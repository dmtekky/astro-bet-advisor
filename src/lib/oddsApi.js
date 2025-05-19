// Configuration
const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = import.meta.env.VITE_THE_ODDS_API_KEY;

if (!API_KEY) {
  console.error('Missing VITE_THE_ODDS_API_KEY in environment variables');
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Checks the structure of the teams table and ensures the sport_key column exists
 */
async function checkTeamTableStructure() {
  try {
    // Get the structure of the teams table
    const { data: columns, error } = await supabaseClient
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'teams')
      .order('ordinal_position');

    if (error) throw error;

    console.log('Current teams table structure:');
    console.table(columns);

    // Check if sport_key exists
    const hasSportKey = columns.some(col => col.column_name === 'sport_key');
    console.log(hasSportKey 
      ? '✅ sport_key column exists!' 
      : '❌ sport_key column is missing');

    return { hasSportKey, columns };
  } catch (error) {
    console.error('Error checking table structure:', error);
    return { error };
  }
}

// Verify the column is accessible
async function verifySportKeyColumn() {
  try {
    // Try to update a test record with sport_key
    const { data: testTeam, error: updateError } = await supabaseClient
      .from('teams')
      .update({ sport_key: 'basketball_nba' })
      .eq('id', 1)  // Using ID 1 as a test, adjust if needed
      .select('id, name, sport_key')
      .single();

    if (updateError) throw updateError;

    console.log('✅ Successfully verified sport_key column!');
    console.log('Test update result:', testTeam);
    return { success: true };
  } catch (error) {
    console.error('❌ Error verifying sport_key column:', error);
    return { error };
  }
}

// Run the verification
verifySportKeyColumn().then(result => {
  if (result.success) {
    console.log('✅ Database is ready for game syncing!');
  } else {
    console.log('❌ Please check the error above');
  }
});

/**
 * Adds a sport_key column to the teams table if it doesn't exist
 * @returns {Promise<{success: boolean, error?: any}>}
 */
async function addSportKeyColumn() {
  try {
    // Use RPC to execute the SQL to add the column
    const { data, error } = await supabaseClient.rpc('add_sport_key_column');
    
    if (error) {
      console.error('Error adding sport_key column:', error);
      return { error };
    }
    
    console.log('Successfully added sport_key column to teams table');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: error.message };
  }
}

// Call the function to ensure the column exists
addSportKeyColumn().then(result => {
  if (result.error) {
    console.warn('Could not verify sport_key column. Some features may not work correctly.');
  }
});

// Cache duration in milliseconds (7 days)
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Syncs game schedules from The Odds API to Supabase with team integration
 * @param {Object} supabase - Supabase client
 * @param {string} [sport='basketball_nba'] - The sport key to sync
 * @param {boolean} [forceUpdate=false] - Force update even if cache is recent
 * @returns {Promise<{success: boolean, gameCount?: number, error?: string}>}
 */
export async function syncGameSchedules(supabase, sport = 'basketball_nba', forceUpdate = false) {
  try {
    // 1. Check if we need to update (weekly cache)
    if (!forceUpdate) {
      const { data: lastUpdate } = await supabase
        .from('cached_odds')
        .select('last_update')
        .eq('sport', sport)
        .order('last_update', { ascending: false })
        .limit(1)
        .single();

      // Only fetch if data is older than 7 days
      const cacheExpiry = new Date(Date.now() - CACHE_DURATION_MS);
      if (lastUpdate?.last_update && new Date(lastUpdate.last_update) > cacheExpiry) {
        console.log(`Using cached data for ${sport} (last updated: ${lastUpdate.last_update})`);
        return { success: true, fromCache: true };
      }
    }

    // 2. Fetch games from The Odds API
    console.log(`Fetching fresh data for ${sport}...`);
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const games = await response.json();
    if (!games || !games.length) {
      console.log('No games found to sync');
      return { success: true, gameCount: 0 };
    }

    // 3. Store raw response in cached_odds
    const { error: cacheError } = await supabase
      .from('cached_odds')
      .upsert({
        sport,
        data: games,
        last_update: new Date().toISOString()
      }, {
        onConflict: 'sport'
      });

    if (cacheError) {
      console.error('Error caching odds:', cacheError);
    }

    // 4. Match teams with existing teams in the database
    const processedGames = [];
    
    for (const game of games) {
      // Find home team in teams table
      const { data: homeTeam } = await supabase
        .from('teams')
        .select('id, name')
        .or(`name.eq.${game.home_team},name.ilike.${game.home_team}`)
        .eq('sport', sport.includes('basketball') ? 'nba' : 'mlb')
        .limit(1)
        .single();

      // Find away team in teams table
      const { data: awayTeam } = await supabase
        .from('teams')
        .select('id, name')
        .or(`name.eq.${game.away_team},name.ilike.${game.away_team}`)
        .eq('sport', sport.includes('basketball') ? 'nba' : 'mlb')
        .limit(1)
        .single();

      // Prepare game record with team IDs if found
      const gameRecord = {
        id: game.id,
        sport_key: game.sport_key,
        sport_title: game.sport_title || (sport === 'basketball_nba' ? 'NBA' : 'MLB'),
        commence_time: game.commence_time,
        home_team: game.home_team,
        away_team: game.away_team,
        home_team_id: homeTeam?.id || null,
        away_team_id: awayTeam?.id || null,
        updated_at: new Date().toISOString()
      };

      processedGames.push(gameRecord);
    }

    // 5. Upsert processed games to schedules table
    const { data: upsertedGames, error: upsertError } = await supabase
      .from('schedules')
      .upsert(processedGames, { onConflict: 'id' });

    if (upsertError) {
      throw new Error(`Error upserting games: ${upsertError.message}`);
    }

    console.log(`✅ Successfully synced ${processedGames.length} ${sport} games`);
    return { success: true, gameCount: processedGames.length };

  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Syncs both NBA and MLB game schedules
 * @param {Object} supabase - Supabase client
 * @param {boolean} [forceUpdate=false] - Force update even if cache is recent
 * @returns {Promise<{success: boolean, nba?: {gameCount: number}, mlb?: {gameCount: number}, error?: string}>}
 */
export async function syncAllSports(supabase, forceUpdate = false) {
  try {
    // Sync NBA games
    const nbaResult = await syncGameSchedules(supabase, 'basketball_nba', forceUpdate);
    
    // Sync MLB games
    const mlbResult = await syncGameSchedules(supabase, 'baseball_mlb', forceUpdate);

    return {
      success: nbaResult.success && mlbResult.success,
      nba: nbaResult,
      mlb: mlbResult
    };
  } catch (error) {
    console.error('Error syncing all sports:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches upcoming games from the schedules table
 * @param {Object} supabase - Supabase client
 * @param {string} [sport='basketball_nba'] - The sport key
 * @param {number} [daysAhead=7] - Number of days to look ahead
 * @returns {Promise<Array>} - Array of upcoming games
 */
export async function getUpcomingGames(supabase, sport = 'basketball_nba', daysAhead = 7) {
  try {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    
    const { data: games, error } = await supabase
      .from('schedules')
      .select('*, home_team_id(*), away_team_id(*)')
      .eq('sport_key', sport)
      .gte('commence_time', now.toISOString())
      .lte('commence_time', future.toISOString())
      .order('commence_time', { ascending: true });

    if (error) throw error;
    
    return games || [];
  } catch (error) {
    console.error(`Error fetching upcoming ${sport} games:`, error);
    return [];
  }
}

/**
 * Fetches a single test game from The Odds API
 * @param {string} [sport='basketball_nba'] - The sport key
 * @returns {Promise<Object>} - Single game data or error
 */
export async function fetchTestGame(sport = 'basketball_nba') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso&bookmakers=draftkings&commenceTimeTo=${tomorrowStr}T00:00:00Z`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const games = await response.json();
    const game = games[0]; // Get the first game
    
    if (!game) {
      console.warn('No upcoming games found');
      return null;
    }

    console.log(' Successfully fetched test game:');
    console.log({
      id: game.id,
      sport: game.sport_key,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      bookmakers: game.bookmakers?.map(b => ({
        key: b.key,
        last_update: b.last_update,
        markets: b.markets?.map(m => m.key)
      }))
    });

    return game;
  } catch (error) {
    console.error(' Error fetching test game:', error);
    return { error: error.message };
  }
}

/**
 * Fetches odds data from The Odds API
 * @param {string} sport - The sport key (e.g., 'basketball_nba')
 * @returns {Promise<Array>} - Array of games with odds data
 */
// Helper to format date as YYYY-MM-DDTHH:MM:SSZ (no milliseconds)
function toApiDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Remove placeholder/mock games from Supabase
export async function removePlaceholderGames(supabaseClient) {
  // You can extend this list as needed
  const placeholderLeagues = ['Premier League'];
  const placeholderTeams = ['Team A', 'Team B'];

  // Build dynamic filter
  let orFilters = placeholderLeagues.map(l => `league.eq.${l}`);
  orFilters = orFilters.concat(
    placeholderTeams.map(t => `home_team.eq.${t}`),
    placeholderTeams.map(t => `away_team.eq.${t}`)
  );

  await supabaseClient
    .from('schedules')
    .delete()
    .or(orFilters.join(','));
}

// Fetch odds for a given sport and date range
export const fetchOdds = async (sport = 'basketball_nba', fromDate = null, toDate = null) => {
  if (!API_KEY) {
    throw new Error('API key is not configured');
  }

  // Calculate default date range (now to 7 days from now)
  const now = fromDate || new Date();
  const sevenDaysLater = toDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const commenceTimeFrom = encodeURIComponent(toApiDate(now));
  const commenceTimeTo = encodeURIComponent(toApiDate(sevenDaysLater));

  try {
    const response = await fetch(
      `${API_BASE_URL}/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Failed to fetch odds data');
    }

    const games = await response.json();
    
    // Transform the data to match the expected format
    return games.map(game => ({
      id: game.id,
      sport_key: game.sport_key,
      sport_title: game.sport_title,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      home_team_id: game.home_team_id,
      away_team_id: game.away_team_id,
      home_team_record: '', // Not provided by the API
      away_team_record: '', // Not provided by the API
      home_odds: getBestOdds(game.bookmakers, game.home_team, 'h2h'),
      away_odds: getBestOdds(game.bookmakers, game.away_team, 'h2h'),
      spread: getBestSpread(game.bookmakers, game.home_team),
      total: getBestTotal(game.bookmakers),
      bookmakers: game.bookmakers?.map(bookmaker => ({
        key: bookmaker.key,
        title: bookmaker.title,
        last_update: bookmaker.last_update,
        markets: bookmaker.markets || []
      })) || [],
      home_team_logo: '', // Not provided by the API
      away_team_logo: '', // Not provided by the API
      venue: game.venue || 'TBD',
      status: game.status || 'scheduled'
    }));
  } catch (err) {
    console.error('Error fetching odds:', err);
    throw err;
  }
};

// Generic odds sync for any set of sports
export async function syncOddsToSupabase(supabaseClient, sports = ['basketball_nba', 'baseball_mlb'], days = 7) {
  const fromDate = new Date();
  const toDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // 1. Remove placeholder/mock data
  await removePlaceholderGames(supabaseClient);

  // 2. Fetch and upsert for each sport
  let allGames = [];
  for (const sport of sports) {
    const games = await fetchOdds(sport, fromDate, toDate);
    allGames = allGames.concat(games);
  }

  if (allGames.length > 0) {
    const { error } = await supabaseClient.from('schedules').upsert(allGames, { onConflict: ['id'] });
    if (error) throw error;
    return { success: true, count: allGames.length };
  }
  return { success: true, message: 'No games found for selected sports.' };
}

/**
 * Fetches details for a specific game
 * @param {string} gameId - The ID of the game
 * @returns {Promise<Object>} - Game details with odds
 */
export const fetchGameDetails = async (gameId) => {
  if (!API_KEY) {
    throw new Error('API key is not configured');
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/sports/basketball_nba/events/${gameId}/odds?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Failed to fetch game details');
    }

    const game = await response.json();
    
    return {
      id: game.id,
      sport_key: game.sport_key,
      sport_title: game.sport_title,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      home_team_id: game.home_team_id,
      away_team_id: game.away_team_id,
      home_team_record: '', // Not provided by the API
      away_team_record: '', // Not provided by the API
      home_odds: getBestOdds(game.bookmakers, game.home_team, 'h2h'),
      away_odds: getBestOdds(game.bookmakers, game.away_team, 'h2h'),
      spread: getBestSpread(game.bookmakers, game.home_team),
      total: getBestTotal(game.bookmakers),
      bookmakers: game.bookmakers?.map(bookmaker => ({
        key: bookmaker.key,
        title: bookmaker.title,
        last_update: bookmaker.last_update,
        markets: bookmaker.markets || []
      })) || [],
      home_team_logo: '', // Not provided by the API
      away_team_logo: '', // Not provided by the API
      venue: game.venue || 'TBD',
      status: game.status || 'scheduled'
    };
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
};

/**
 * Helper function to get the best odds for a team
 */
function getBestOdds(bookmakers, teamName, market = 'h2h') {
  if (!bookmakers?.length) return 0;
  
  let bestOdds = 0;
  
  bookmakers.forEach(bookmaker => {
    const marketData = bookmaker.markets?.find(m => m.key === market);
    if (!marketData) return;
    
    const outcome = marketData.outcomes?.find(o => o.name === teamName);
    if (outcome && outcome.price > bestOdds) {
      bestOdds = outcome.price;
    }
  });
  
  return bestOdds;
}

/**
 * Helper function to get the best spread for a team
 */
function getBestSpread(bookmakers, teamName) {
  if (!bookmakers?.length) return 0;
  
  let bestSpread = 0;
  let bestPrice = 0;
  
  bookmakers.forEach(bookmaker => {
    const marketData = bookmaker.markets?.find(m => m.key === 'spreads');
    if (!marketData) return;
    
    const outcome = marketData.outcomes?.find(o => o.name === teamName);
    if (outcome && outcome.price > bestPrice) {
      bestSpread = outcome.point;
      bestPrice = outcome.price;
    }
  });
  
  return bestSpread;
}

/**
 * Helper function to get the best total
 */
function getBestTotal(bookmakers) {
  if (!bookmakers?.length) return 0;
  
  let bestTotal = 0;
  let bestPrice = 0;
  
  bookmakers.forEach(bookmaker => {
    const marketData = bookmaker.markets?.find(m => m.key === 'totals');
    if (!marketData) return;
    
    const overOutcome = marketData.outcomes?.find(o => o.name === 'Over');
    if (overOutcome && overOutcome.price > bestPrice) {
      bestTotal = overOutcome.point;
      bestPrice = overOutcome.price;
    }
  });
  
  return bestTotal;
}

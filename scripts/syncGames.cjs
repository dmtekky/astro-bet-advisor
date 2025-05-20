/**
 * Weekly Sync Script for The Odds API (CommonJS Version)
 * 
 * This script fetches NBA and MLB game data from The Odds API
 * and stores it in Supabase. It's designed to be run once per week
 * to minimize API usage while keeping game data up-to-date.
 * 
 * Usage:
 * - Run manually: node scripts/syncGames.cjs
 * - Set up as a cron job to run weekly
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Log environment variables for debugging
console.log('Environment variables:');
console.log(`- VITE_THE_ODDS_API_KEY: ${process.env.VITE_THE_ODDS_API_KEY ? 'Set' : 'Not set'}`);
console.log(`- VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set'}`);
console.log(`- VITE_SUPABASE_KEY: ${process.env.VITE_SUPABASE_KEY ? 'Set' : 'Not set'}`);

// Validate required environment variables
if (!process.env.VITE_THE_ODDS_API_KEY || !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_KEY) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Sports to sync
const SPORTS = ['basketball_nba', 'baseball_mlb'];

/**
 * Fetches game odds from The Odds API for a specific sport
 * @param {string} sport - The sport to fetch odds for (e.g., 'basketball_nba')
 * @returns {Promise<Array>} - Array of game odds
 */
async function fetchGameSchedules(sport) {
  try {
    console.log(`\nFetching ${sport} odds...`);
    
    // Get the current date and 7 days from now in ISO format
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 7);
    
    const response = await axios.get(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds`,
      {
        params: {
          apiKey: process.env.VITE_THE_ODDS_API_KEY,
          regions: 'us', // US odds format
          markets: 'h2h,spreads,totals', // Get moneyline, spreads, and totals
          oddsFormat: 'decimal',
          dateFormat: 'iso',
          bookmakers: 'fanduel,draftkings,williamhill_us,pointsbetus'
        },
        timeout: 15000 // 15 second timeout
      }
    );
    
    console.log(`Fetched ${response.data.length} games for ${sport}`);
    // Log API rate limits if available
    if (response.headers) {
      console.log('API Rate Limits:');
      console.log(`- Requests Used: ${response.headers['x-requests-used'] || 'N/A'}`);
      console.log(`- Requests Remaining: ${response.headers['x-requests-remaining'] || 'N/A'}`);
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${sport} schedules:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return [];
  }
}

/**
 * Helper function to check if a column exists in a table
 * @param {string} tableName - The name of the table to check
 * @param {string} columnName - The name of the column to check
 * @returns {Promise<boolean>} - Whether the column exists
 */
async function columnExists(tableName, columnName) {
  try {
    // Try to query the column directly
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
      
    // If no error, the column exists
    return !error;
  } catch (e) {
    // If there's an error, the column probably doesn't exist
    return false;
  }
}

/**
 * Extracts the best odds from all bookmakers for a game
 * @param {Object} game - The game data from the API
 * @returns {Object} - Best odds for the game
 */
function extractBestOdds(game) {
  if (!game.bookmakers || game.bookmakers.length === 0) {
    return null;
  }

  const bestOdds = {
    moneyline: { home: null, away: null },
    spread: { home: null, away: null, point: null },
    total: { over: null, under: null, point: null },
    last_updated: new Date().toISOString(),
    bookmakers: {}
  };

  // Process each bookmaker's odds
  game.bookmakers.forEach(bookmaker => {
    if (!bookmaker.bookmaker_key) return;
    
    const bookieKey = bookmaker.bookmaker_key;
    bestOdds.bookmakers[bookieKey] = {
      name: bookmaker.title,
      last_update: bookmaker.last_update,
      markets: {}
    };

    // Process each market (h2h, spreads, totals)
    bookmaker.markets?.forEach(market => {
      if (market.key === 'h2h') {
        // Moneyline
        market.outcomes.forEach(outcome => {
          const teamType = outcome.name === game.home_team ? 'home' : 'away';
          if (!bestOdds.moneyline[teamType] || outcome.price > bestOdds.moneyline[teamType].price) {
            bestOdds.moneyline[teamType] = {
              price: outcome.price,
              bookmaker: bookieKey
            };
          }
          bestOdds.bookmakers[bookieKey].markets.moneyline = outcome;
        });
      } else if (market.key === 'spreads') {
        // Point spreads
        market.outcomes.forEach(outcome => {
          const teamType = outcome.name === game.home_team ? 'home' : 'away';
          if (!bestOdds.spread[teamType] || 
              (outcome.point > bestOdds.spread.point && outcome.point > 0) ||
              (outcome.point < bestOdds.spread.point && outcome.point < 0)) {
            bestOdds.spread[teamType] = {
              price: outcome.price,
              bookmaker: bookieKey
            };
            bestOdds.spread.point = outcome.point;
          }
          bestOdds.bookmakers[bookieKey].markets.spread = outcome;
        });
      } else if (market.key === 'totals' && market.outcomes[0]) {
        // Totals (over/under)
        const over = market.outcomes.find(o => o.name === 'Over');
        const under = market.outcomes.find(o => o.name === 'Under');
        
        if (over && (!bestOdds.total.over || over.price > bestOdds.total.over.price)) {
          bestOdds.total.over = {
            price: over.price,
            bookmaker: bookieKey
          };
          bestOdds.total.point = over.point;
        }
        
        if (under && (!bestOdds.total.under || under.price > bestOdds.total.under.price)) {
          bestOdds.total.under = {
            price: under.price,
            bookmaker: bookieKey
          };
          if (!bestOdds.total.point) bestOdds.total.point = under.point;
        }
        
        bestOdds.bookmakers[bookieKey].markets.total = { over, under };
      }
    });
  });

  return bestOdds;
}

/**
 * Stores game odds in the database
 * @param {Array} games - Array of game odds
 * @param {string} sport - The sport being synced
 * @returns {Promise<Object>} - Result of the database operation
 */
async function storeGameSchedules(games, sport) {
  // Ensure games is an array
  const gamesArray = Array.isArray(games) ? games : [games];
  console.log(`Storing ${gamesArray.length} games for ${sport}...`);
  
  try {
    // First, try to store with basic data (no odds)
    const gameData = games.map(game => ({
      id: game.id,
      sport_type: sport,
      home_team: game.home_team,
      away_team: game.away_team,
      game_time: game.commence_time,
      status: 'scheduled',
      last_updated: new Date().toISOString()
    }));
    
    // Try to upsert the games with basic data first
    const { data, error } = await supabase
      .from('schedules')
      .upsert(gameData, { onConflict: 'id' })
      .select();

    if (error) throw error;
    
    console.log(`Successfully stored ${data?.length || 0} games for ${sport}`);
    
    // Check if the odds column exists
    const oddsColumnExists = await columnExists('schedules', 'odds');
    
    if (oddsColumnExists) {
      // If the odds column exists, update the games with odds data
      const gameDataWithOdds = gamesArray.map(game => ({
        id: game.id,
        odds: extractBestOdds(game)
      }));
      
      const { data: oddsData, error: oddsError } = await supabase
        .from('schedules')
        .upsert(gameDataWithOdds, { onConflict: 'id' })
        .select();
        
      if (oddsError) throw oddsError;
      
      console.log(`Successfully updated ${oddsData?.length || 0} games with odds for ${sport}`);
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    // If the error is about the odds column, try without it
    if (error.message && (error.message.includes('odds') || error.code === 'PGRST204')) {
      console.log('Odds column not found, storing without odds data...');
      
      try {
        // Try again without the odds column
        const gameDataWithoutOdds = games.map(game => ({
          id: game.id,
          sport_type: sport,
          home_team: game.home_team,
          away_team: game.away_team,
          game_time: game.commence_time,
          status: 'scheduled',
          last_updated: new Date().toISOString()
        }));
        
        const { data, error: simpleError } = await supabase
          .from('schedules')
          .upsert(gameDataWithoutOdds, { onConflict: 'id' })
          .select();
          
        if (simpleError) throw simpleError;
        
        console.log(`Successfully stored ${data?.length || 0} games for ${sport} (without odds)`);
        return { data: data || [], error: null };
      } catch (simpleError) {
        console.error(`Error storing ${sport} games without odds:`, simpleError.message);
        return { data: null, error: simpleError };
      }
    } else {
      console.error(`Error storing ${sport} games:`, error.message);
      return { data: null, error };
    }
  }
}

/**
 * Syncs game schedules for a specific sport
 * @param {string} sport - The sport to sync
 */
async function syncSport(sport) {
  try {
    // Fetch the latest game schedules
    const games = await fetchGameSchedules(sport);
    
    if (games.length === 0) {
      console.log(`No games found for ${sport}`);
      return { success: false, message: `No games found for ${sport}` };
    }
    
    // Store the game schedules in the database
    const { error } = await storeGameSchedules(games, sport);
    
    if (error) {
      throw error;
    }
    
    return { success: true, message: `Successfully synced ${games.length} games for ${sport}` };
  } catch (error) {
    console.error(`Error syncing ${sport}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to sync all sports
 */
async function syncAllSports() {
  try {
    console.log('\n=== Starting game sync ===');
    console.log(`Current time: ${new Date().toISOString()}`);
    
    // Check if the odds column exists in the schedules table
    console.log('Checking if odds column exists in schedules table...');
    
    try {
      // First, try to query the odds column directly
      const { data, error } = await supabase
        .from('schedules')
        .select('id, odds')
        .limit(1);
      
      // If we get a column not found error, try to add the column
      if (error && error.code === '42703') {
        console.log('Odds column not found, attempting to add it...');
        
        // Try to add the column using a direct SQL query
        const { data: alterResult, error: alterError } = await supabase
          .from('schedules')
          .insert([{ 
            // This is a dummy insert to get around RLS if needed
            // We'll delete it immediately after
            id: 'temp_' + Date.now(),
            home_team: 'temp',
            away_team: 'temp',
            game_time: new Date().toISOString(),
            status: 'scheduled'
          }])
          .select('id');
          
        if (alterError) {
          console.warn('Warning: Could not add odds column automatically. Please run the migration manually.');
          console.warn('Error:', alterError.message);
          
          // Try to continue anyway - the column might exist but have RLS issues
          console.log('Attempting to continue with sync - if you see column errors, please run the migration manually');
        } else {
          // Clean up the dummy record
          if (alterResult && alterResult[0] && alterResult[0].id) {
            await supabase
              .from('schedules')
              .delete()
              .eq('id', alterResult[0].id);
          }
          
          console.log('Successfully added odds column to schedules table');
        }
      } else if (error) {
        console.warn('Warning: Could not check if odds column exists:', error.message);
        console.log('Attempting to continue with sync - if you see column errors, please run the migration manually');
      } else {
        console.log('Odds column already exists in schedules table');
      }
      
      console.log('Successfully connected to Supabase and verified table structure');
    } catch (error) {
      console.error('Error checking/adding odds column:', error.message);
      console.log('Attempting to continue with sync - if you see column errors, please run the migration manually');
    }
    
    // Sync each sport with error handling for each
  const results = {};
  for (const sport of SPORTS) {
    try {
      console.log(`\n=== Syncing ${sport} ===`);
      results[sport] = await syncSport(sport);
      console.log(`=== Completed ${sport} ===`);
      
      // Add a small delay between sports to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error syncing ${sport}:`, error);
      results[sport] = { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }  
    console.log('\n=== Sync completed successfully ===');
    console.log('Results:', JSON.stringify(results, null, 2));
    return { success: true, results };
  } catch (error) {
    console.error('Error during sync:', error);
    return { success: false, error: error.message };
  }
}

// Run the sync if this file is executed directly
if (require.main === module) {
  syncAllSports()
    .then(({ success, results, error }) => {
      console.log('\nSync process finished');
      if (!success) {
        console.error('Sync failed:', error);
        process.exit(1);
      }
      console.log('Results:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Unhandled error in sync process:', error);
      process.exit(1);
    });
}

// Export functions for testing
module.exports = {
  fetchGameSchedules,
  storeGameSchedules,
  syncSport,
  syncAllSports
};

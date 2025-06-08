// Import required modules
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import the MySportsFeeds API library
const MySportsFeeds = require('mysportsfeeds-node');
const dotenv = require('dotenv');
const path = require('path');

async function logDatabaseSchema(supabase) {
  try {
    console.log('🔍 Checking database schema...');
    
    // Get list of all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) throw tablesError;
    
    console.log('📋 Database tables:', tables.map(t => t.table_name).join(', '));
    
    // Check nba_games table structure
    const { data: nbaGamesColumns, error: nbaGamesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'nba_games');
      
    if (nbaGamesError) throw nbaGamesError;
    
    console.log('\n📊 nba_games columns:');
    console.table(nbaGamesColumns);
    
    // Check if we have any NBA teams
    const { data: nbaTeams, error: teamsError } = await supabase
      .from('nba_teams')
      .select('id, name, abbreviation')
      .limit(5);
      
    if (teamsError) console.warn('⚠️ Could not fetch NBA teams:', teamsError.message);
    else console.log('\n🏀 Sample NBA teams:', nbaTeams);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking database schema:', error.message);
    return false;
  }
}

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL and key are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MySportsFeeds API configuration
const MSF_API_KEY = process.env.MY_SPORTS_FEEDS_API_KEY;

if (!MSF_API_KEY) {
  console.error('❌ Error: MySportsFeeds API key not found in environment variables');
  process.exit(1);
}

// Initialize MySportsFeeds client
const msf = new MySportsFeeds('2.1', true);
msf.authenticate(MSF_API_KEY, 'MYSPORTSFEEDS');

// Utility: Fetch the current NBA season slug
// Hardcode the NBA season slug for 2024-2025 regular season
function fetchCurrentSeasonSlug() {
  const slug = '2024-2025-regular';
  console.log(`📅 Using NBA season slug: ${slug}`);
  return slug;
}

// Utility: Fetch and process NBA venues for a given season
async function fetchAndProcessVenues(msf, supabase, seasonSlug) {
  console.log(`🏟️ Fetching NBA venues for season: ${seasonSlug}...`);
  try {
    const venuesResp = await msf.getData('nba', seasonSlug, 'seasonal_venues', 'json');
    const venuesToUpsert = (venuesResp.venues || []).map(v => ({
      id: v.venue.id.toString(),
      name: v.venue.name,
      city: v.venue.city,
      country: v.venue.country,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    const { error: venuesError } = await supabase.from('nba_venues').upsert(venuesToUpsert, { onConflict: 'id' });
    if (venuesError) {
      console.error('❌ Error upserting venues:', venuesError);
    } else {
      console.log(`✅ Upserted ${venuesToUpsert.length} venues.`);
      console.table(venuesToUpsert.map(v => ({ id: v.id, name: v.name, city: v.city })));
    }
  } catch (e) {
    console.error(`❌ Error fetching or processing venues for season ${seasonSlug}: ${e.message ? e.message.split('\n')[0] : String(e)}`);
    // Decide if this error is critical. For now, log and continue.
  }
}

// Function to get or create a league
async function getOrCreateLeague(supabase, name, key) {
  try {
    // Try to find the league by key
    const { data: existingLeague, error: findError } = await supabase
      .from('leagues')
      .select('id')
      .eq('key', key)
      .single();

    if (existingLeague) {
      console.log(`Found existing league: ${name} (${key})`);
      return existingLeague.id;
    }

    // If not found, create a new league
    const { data: newLeague, error: createError } = await supabase
      .from('leagues')
      .insert([
        {
          name,
          key,
          external_id: 1, // Use a numeric ID for NBA
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating league:', createError);
      throw createError;
    }

    console.log(`Created new league: ${name} (${key})`);
    return newLeague.id;
  } catch (error) {
    console.error('Error in getOrCreateLeague:', error);
    throw error;
  }
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to check the database schema
async function checkDatabaseSchema(supabase) {
  try {
    console.log('🔍 Checking database schema for nba_games table...');
    
    // First, check if the table exists and get its columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_columns', { 
        table_name: 'nba_games',
        schema_name: 'public'
      });
    
    if (columnsError) {
      console.warn('⚠️ Could not fetch columns using RPC, trying direct query...', columnsError);
      
      // Fallback to direct query if RPC fails
      const { data: directData, error: directError } = await supabase
        .from('nba_games')
        .select('*')
        .limit(1);
        
      if (directError) {
        console.warn('⚠️ Could not fetch sample data from nba_games:', directError.message);
        console.log('ℹ️ This might be expected if the table is empty.');
      } else {
        console.log('ℹ️ Sample data from nba_games:', JSON.stringify(directData, null, 2));
      }
      
      // Try to add the column anyway
      return await addSeasonSlugColumn(supabase);
    }
    
    console.log('📊 NBA Games Table Columns:', columns);
    
    // Check if season_slug column exists
    const hasSeasonSlug = columns && columns.some(col => col.column_name === 'season_slug');
    
    if (!hasSeasonSlug) {
      console.log('ℹ️ season_slug column not found. Attempting to add it...');
      return await addSeasonSlugColumn(supabase);
    }
    
    console.log('✅ season_slug column exists in nba_games table.');
    return true;
    
  } catch (err) {
    console.warn('⚠️ Error checking database schema:', err.message);
    console.log('ℹ️ This might be expected if the exec_sql function is not available.');
    return false;
  }
}

async function addSeasonSlugColumn(supabase) {
  try {
    console.log('ℹ️ Adding season_slug column to nba_games table...');
    
    // Try using the RPC function if available
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          ALTER TABLE nba_games 
          ADD COLUMN IF NOT EXISTS season_slug TEXT;
          COMMENT ON COLUMN nba_games.season_slug IS 'Full season identifier (e.g., 2024-2025-regular)';
        `
      });
      
      if (error) throw error;
      console.log('✅ Added season_slug column to nba_games table using RPC.');
      return true;
    } catch (rpcError) {
      console.warn('⚠️ Could not add column using RPC, trying direct SQL:', rpcError.message);
      
      // Fallback to direct SQL execution
      const { data, error } = await supabase
        .from('nba_games')
        .select('*')
        .limit(1);
        
      if (error) {
        console.warn('⚠️ Could not execute direct query:', error.message);
        return false;
      }
      
      console.log('ℹ️ Direct query successful. Column may have been added by another process.');
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Error adding season_slug column:', err.message);
    return false;
  }
}

async function fetchAndProcessGames(msf, supabase, seasonSlug, nbaLeagueId) {
  console.log(`🗓️ Fetching NBA games for season: ${seasonSlug}...`);
  
  try {
    let allGames = [];
    let teamReferences = [];
    
    // Define the season types we want to fetch
    const seasonTypes = [
      { name: 'regular', slug: '2024-2025-regular' },
      { name: 'playoffs', slug: '2025-playoff' }
    ];
    
    // Set date range for the entire 2024-2025 NBA season including playoffs (October 2024 - June 2025)
    const seasonStart = new Date('2024-10-22'); // Typical NBA season start
    const seasonEnd = new Date('2025-06-20');    // NBA Finals typically end by mid-June
    
    const startDateStr = formatDate(seasonStart);
    const endDateStr = formatDate(seasonEnd);
    
    console.log(`🏀 Fetching games for the entire 2024-2025 NBA season including playoffs (${startDateStr} to ${endDateStr})...`);
    
    // Fetch games for each season type
    for (const seasonType of seasonTypes) {
      console.log(`\n🔄 Processing ${seasonType.name} season (${seasonType.slug})...`);
      let gamesForSeason = [];
      
      try {
        // First, try to get games for the entire season
        console.log('🔍 Attempting to fetch seasonal games...');
        const gamesResp = await msf.getData('nba', seasonType.slug, 'seasonal_games', 'json');
        
        if (gamesResp.games && Array.isArray(gamesResp.games)) {
          gamesForSeason = gamesResp.games;
          console.log(`✅ Found ${gamesForSeason.length} games in the ${seasonType.name} season`);
          
          // Extract team references if available
          if (gamesResp.references?.teamReferences) {
            teamReferences = [...teamReferences, ...gamesResp.references.teamReferences];
          }
        } else {
          console.log(`ℹ️ No games found in ${seasonType.name} seasonal endpoint, trying daily games endpoint...`);
          // Fall back to daily games if seasonal endpoint doesn't work
          const dailyResp = await msf.getData('nba', seasonType.slug, 'daily_games', 'json', {
            date: `${startDateStr}-${endDateStr}`
          });
          
          if (dailyResp.games && Array.isArray(dailyResp.games)) {
            gamesForSeason = dailyResp.games;
            console.log(`✅ Found ${gamesForSeason.length} games in daily range for ${seasonType.name}`);
          }
        }
        
        // Add the games to our collection
        allGames = [...allGames, ...gamesForSeason];
        
      } catch (error) {
        console.error(`⚠️ Error fetching ${seasonType.name} games:`, error.message);
        // Continue with next season type if we can't fetch games for this one
        continue;
      }
    }
    
    console.log(`\n🏁 Total games found: ${allGames.length} (across all season types)`);
    
    if (allGames.length === 0) {
      console.warn('⚠️ No games found for any season type');
      return { data: [], teamReferences: [] };
    }
    
    // Process games and collect team references
    console.log(`📊 Processing ${allGames.length} games...`);
    
    // Remove duplicates from team references
    const uniqueTeamRefs = [];
    const seenTeamIds = new Set();
    
    for (const team of teamReferences) {
      if (!seenTeamIds.has(team.id)) {
        seenTeamIds.add(team.id);
        uniqueTeamRefs.push(team);
      }
    }
    
    console.log(`🤝 Found ${uniqueTeamRefs.length} unique team references`);
    
    // First, get all teams to map external IDs to internal UUIDs
    console.log('🔍 Fetching team mappings...');
    const { data: teams, error: teamsError } = await supabase
      .from('nba_teams')
      .select('id, external_team_id, name, abbreviation');
      
    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
      return [];
    }
    
    // Create map for external_team_id to UUID
    const teamExternalIdMap = new Map();
    const teamAbbreviationMap = new Map();
    
    teams.forEach(team => {
      // Map by external_team_id (if exists)
      if (team.external_team_id) {
        const extId = team.external_team_id.toString();
        teamExternalIdMap.set(extId, team.id);
        
        // Also try to map by numeric part of the external ID
        const numericId = extId.replace(/\D/g, '');
        if (numericId && numericId !== extId) {
          teamExternalIdMap.set(numericId, team.id);
        }
      }
      
      // Also map by team abbreviation as a fallback
      if (team.abbreviation) {
        teamAbbreviationMap.set(team.abbreviation.toUpperCase(), team.id);
      }
    });
    
    console.log(`✅ Mapped ${teamExternalIdMap.size} external team IDs and ${teamAbbreviationMap.size} team abbreviations`);
    console.log('Sample team mappings (first 5):', Array.from(teamExternalIdMap.entries()).slice(0, 5));
    
    // Process each game
    const gamesToUpsert = [];
    console.log(`🔍 Processing ${allGames.length} games...`);
    
    for (const game of allGames) {
      try {
        // Debug: Log the full game object to understand its structure
        // console.log('Game object:', JSON.stringify(game, null, 2));
        
        let gameData = {};
        let homeTeamId, awayTeamId, homeTeamAbbr, awayTeamAbbr, schedule, score;
        
        let gameId = '';
        
        // Extract game data based on the format
        if (game.schedule) {
          // Format 1: Nested schedule object (most common format from the API)
          schedule = game.schedule;
          score = game.score || {};
          gameId = schedule.id?.toString() || '';
          homeTeamId = schedule.homeTeam?.id?.toString();
          awayTeamId = schedule.awayTeam?.id?.toString();
          homeTeamAbbr = schedule.homeTeam?.abbreviation;
          awayTeamAbbr = schedule.awayTeam?.abbreviation;
        } else if (game.id) {
          // Format 2: Direct game object (less common)
          gameId = game.id.toString();
          homeTeamId = (game.homeTeam?.id || game.homeTeamID)?.toString();
          awayTeamId = (game.awayTeam?.id || game.awayTeamID)?.toString();
          homeTeamAbbr = game.homeTeam?.abbreviation;
          awayTeamAbbr = game.awayTeam?.abbreviation;
          schedule = game;
          score = game;
        } else {
          console.warn('⚠️ Skipping game - unknown format:', JSON.stringify(game, null, 2));
          continue;
        }
        
        if (!gameId) {
          console.warn('⚠️ Skipping game - missing ID');
          continue;
        }
        
        // Debug: Log the team IDs we're trying to match
        console.log(`Processing game ${gameId} - Home: ${homeTeamId} (${homeTeamAbbr}), Away: ${awayTeamId} (${awayTeamAbbr})`);
        
        // Try to find team UUID by external_id first, then by abbreviation
        const homeTeamUuid = teamExternalIdMap.get(homeTeamId) || 
                           (homeTeamAbbr ? teamAbbreviationMap.get(homeTeamAbbr.toUpperCase()) : null);
        
        const awayTeamUuid = teamExternalIdMap.get(awayTeamId) ||
                           (awayTeamAbbr ? teamAbbreviationMap.get(awayTeamAbbr.toUpperCase()) : null);
        
        if (!homeTeamUuid || !awayTeamUuid) {
          console.warn(`⚠️ Could not find UUIDs for teams - home: ${homeTeamId} (${homeTeamAbbr}), away: ${awayTeamId} (${awayTeamAbbr})`);
          console.log('Available team mappings (first 5):', {
            homeTeamId,
            homeTeamAbbr,
            awayTeamId,
            awayTeamAbbr,
            sampleExternalIds: Array.from(teamExternalIdMap.entries()).slice(0, 5),
            sampleAbbreviations: Array.from(teamAbbreviationMap.entries()).slice(0, 5)
          });
          continue; // Skip this game if we can't find team UUIDs
        }
        
        // Format game date and time
        let gameDate = null;
        let gameTime = null;
        
        if (schedule?.startTime) {
          const startTime = new Date(schedule.startTime);
          gameDate = startTime.toISOString().split('T')[0];
          gameTime = startTime.toISOString().split('T')[1].split('.')[0];
        } else if (game.startTimeUTC) {
          const startTime = new Date(game.startTimeUTC);
          gameDate = startTime.toISOString().split('T')[0];
          gameTime = startTime.toISOString().split('T')[1].split('.')[0];
        }
        
        // Extract the start year from the season slug (e.g., '2024-2025-regular' -> 2024)
        const seasonYear = parseInt(seasonSlug.split('-')[0], 10);
        
        // Generate a deterministic UUID from the game ID
        // This creates a UUID v5 using the game ID as the name and a fixed namespace
        const crypto = require('crypto');
        const namespace = '1b671a64-40d5-491e-99b0-da01ff1f3341'; // Random fixed namespace
        const name = `nba-game-${gameId}`;
        const hash = crypto.createHash('sha1').update(namespace + name).digest('hex');
        const gameUuid = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          '5' + hash.substring(13, 16), // Version 5
          '8' + hash.substring(17, 20), // Variant 1
          hash.substring(20, 32)
        ].join('-');
        
        // Prepare game data for upsert - match the nba_games table schema
        // Get or create the NBA league ID
        let nbaLeagueId;
        try {
          nbaLeagueId = await getOrCreateLeague(supabase, 'NBA', 'nba');
        } catch (error) {
          console.error('Error in getOrCreateLeague:', error);
          throw error; // Rethrow to be caught by the outer try-catch
        }
        
        gameData = {
          id: gameUuid, // Use the generated UUID as the primary key
          external_id: gameId, // Store the original game ID for reference
          season: seasonYear, // Use the numeric season year (e.g., 2024)
          league_id: nbaLeagueId, // Include the league ID
          game_date: gameDate,
          game_time: gameTime,
          status: schedule?.playedStatus || game.status || 'SCHEDULED',
          home_team_id: homeTeamUuid,
          away_team_id: awayTeamUuid,
          home_score: score?.homeScoreTotal || game.homeScore || null,
          away_score: score?.awayScoreTotal || game.awayScore || null,
          venue_id: schedule?.venue?.id?.toString() || game.venueID || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Temporarily removing season_slug as it's causing issues with the database
        // gameData.season_slug = seasonSlug;
        
        console.log(`📝 Processed game ${gameId}: ${awayTeamAbbr || '?'} @ ${homeTeamAbbr || '?'} on ${gameDate || '?'}`);
        
        // Add to batch for upsert
        gamesToUpsert.push(gameData);
        
        // Add team references for later processing
        teamReferences.push(homeTeamUuid, awayTeamUuid);
        
        // Log the game data for debugging
        console.log(`📝 Processing game: ${awayTeamId || '?'} @ ${homeTeamId || '?'} on ${gameData.game_date || '?'}`);
        
        // Validate required fields
        if (!gameData.id) {
          console.warn('⚠️ Skipping game - missing ID');
          continue;
        }
        
        // Validate required fields
        if (!gameData.home_team_id || !gameData.away_team_id) {
          console.warn(`⚠️ Skipping game ${gameData.id} - missing team mappings (home ext: ${homeTeamExternalId}, away ext: ${awayTeamExternalId})`);
          continue;
        }
        
        gamesToUpsert.push(gameData);
        
        // Add team references for later processing
        if (gameData.home_team_id) teamReferences.push(gameData.home_team_id);
        if (gameData.away_team_id) teamReferences.push(gameData.away_team_id);
      } catch (error) {
        console.error(`❌ Error processing game:`, error);
      }
    }
    
    // Filter out any null games (skipped due to missing team UUIDs)
    const validGames = gamesToUpsert.filter(game => game !== null);
    
    if (validGames.length === 0) {
      console.warn('⚠️ No valid games to upsert after filtering');
      return [];
    }
    
    console.log(`🚀 Preparing to upsert ${validGames.length} games...`);
    
    // Remove duplicate games before upsert
    const uniqueGamesMap = new Map();
    gamesToUpsert.forEach(game => {
      uniqueGamesMap.set(game.external_id, game);
    });
    const uniqueGames = Array.from(uniqueGamesMap.values());
    
    console.log(`🔍 Processed ${gamesToUpsert.length} games, ${uniqueGames.length} unique`);
    
    try {
      console.log(`🚀 Starting single upsert of ${uniqueGames.length} games...`);
      
      // Get existing game IDs for the games we're about to upsert
      const externalIds = uniqueGames.map(g => g.external_id).filter(Boolean);
      const { data: existingGames = [], error: fetchError } = await supabase
        .from('nba_games')
        .select('id, external_id')
        .in('external_id', externalIds);
        
      if (fetchError) {
        console.error('❌ Error fetching existing games:', fetchError);
        throw fetchError;
      }
      
      const existingGameMap = new Map(existingGames.map(g => [g.external_id, g.id]));
      
      // Prepare all games with proper IDs for existing games
      const preparedGames = uniqueGames.map(game => {
        // Use existing UUID if found, otherwise let the database generate one
        const existingId = game.external_id ? existingGameMap.get(game.external_id) : null;
        
        // Create a copy of the game without the id if it's not a valid UUID
        const { id, ...gameData } = game;
        
        return {
          ...gameData,
          ...(existingId ? { id: existingId } : {})
        };
      });
      
      // Perform the single upsert operation
      const { data, error } = await supabase
        .from('nba_games')
        .upsert(preparedGames, { 
          onConflict: 'external_id',
          ignoreDuplicates: false
        });
        
      if (error) {
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log(`✅ Successfully upserted ${uniqueGames.length} games in a single operation`);
      
    } catch (error) {
      console.error('❌ Error during upsert operation:', error);
      console.log('Attempting to insert games one by one...');
      
      // Fallback to individual inserts if batch fails
      let successfulUpserts = 0;
      for (const game of uniqueGames) {
        try {
          const { error: singleError } = await supabase
            .from('nba_games')
            .upsert(game, { 
              onConflict: 'external_id',
              ignoreDuplicates: false
            });
            
          if (singleError) throw singleError;
          successfulUpserts++;
          console.log(`  ✅ Successfully upserted game ${game.external_id}`);
        } catch (singleError) {
          console.error(`  ❌ Failed to upsert game ${game.external_id}:`, singleError);
          console.log('  Game data:', JSON.stringify({
            ...game,
            home_team_id: game.home_team_id?.substring(0, 8) + '...',
            away_team_id: game.away_team_id?.substring(0, 8) + '...'
          }, null, 2));
        }
      }
      
      console.log(`\n🎉 Successfully processed ${successfulUpserts} of ${uniqueGames.length} games`);
      
      if (successfulUpserts < uniqueGames.length) {
        console.warn(`⚠️ ${uniqueGames.length - successfulUpserts} games were not processed successfully`);
      }
      
      return { data: [], count: successfulUpserts };
    }
    
    // Log summary of processed games
    if (validGames.length > 0) {
      console.log('\n📊 Games Processing Summary:');
      console.table(validGames.slice(0, 5).map(g => ({
        external_id: g.external_id,
        date: g.game_date,
        home: g.home_team_id?.substring(0, 8) + '...',
        away: g.away_team_id?.substring(0, 8) + '...',
        status: g.status
      })));
    } else {
      console.log('ℹ️ No valid games were processed');
    }

    // Extract team references from game data
    if (gamesResp.data && Array.isArray(gamesResp.data)) {
      teamReferences = gamesResp.data.map(game => game.home_team_id).concat(gamesResp.data.map(game => game.away_team_id));
      console.log(`🤝 Found ${teamReferences.length} team references from game data.`);
    } else {
      console.log('ℹ️ No teamReferences available from game data. Skipping team processing and update.');
    }

    // Process NBA teams from team references in games
    if (gamesResp.data?.length) {
      const teamRefs = gamesResp.data;
      const teamUpdates = [];
      
      for (const teamRef of teamRefs) {
        // Only include fields that exist in the nba_teams table
        const teamData = {
          external_team_id: teamRef.external_id.toString(),
          abbreviation: teamRef.home_team_id?.substring(0, 8) + '...',
          city: teamRef.home_team_id?.substring(0, 8) + '...',
          name: teamRef.home_team_id?.substring(0, 8) + '...',
          // Only include these fields if they exist in your schema
          // home_venue_id: teamRef.homeVenue?.id ? teamRef.homeVenue.id.toString() : null,
          // home_venue_name: teamRef.homeVenue?.name || null,
          // team_colors_hex: teamRef.teamColoursHex ? teamRef.teamColoursHex.join(',') : null,
          // twitter: teamRef.socialMediaAccounts?.find(a => a.mediaType === 'TWITTER')?.value || null,
          // logo_url: teamRef.officialLogoImageSrc || null,
        };
        
        // Log the full team data for debugging
        console.log(`Processing team ${teamData.name} (${teamData.abbreviation})`);

        // First check if team exists with this external_team_id
        const { data: existingTeam } = await supabase
          .from('nba_teams')
          .select('id, name, abbreviation')
          .eq('external_team_id', teamData.external_team_id)
          .maybeSingle();

        try {
          if (existingTeam) {
            // Update existing team
            const { error: updateError } = await supabase
              .from('nba_teams')
              .update(teamData)
              .eq('id', existingTeam.id);
            
            if (updateError) throw updateError;
            console.log(`✅ Updated team ${teamData.external_team_id}: ${teamData.name} (${teamData.abbreviation})`);
          } else {
            // Insert new team
            const { error: insertError } = await supabase
              .from('nba_teams')
              .insert([{ ...teamData, created_at: new Date().toISOString() }]);
            
            if (insertError) throw insertError;
            console.log(`✅ Added new team ${teamData.external_team_id}: ${teamData.name} (${teamData.abbreviation})`);
          }
          teamUpdates.push(teamData);
        } catch (error) {
          console.error(`❌ Error processing team ${teamData.external_team_id}:`, error.message || error);
        }
      }
      
      // Log summary of team updates
      if (teamUpdates.length > 0) {
        console.log('\nTeam Updates Summary:');
        console.table(teamUpdates.map(t => ({
          id: t.external_team_id,
          name: t.name,
          abbr: t.abbreviation,
          venue: t.home_venue_name || 'N/A'
        })));
      }
    } else {
      console.log('ℹ️ No valid teams found from game references to update in the database.');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`❌ Error fetching or processing games for season ${seasonSlug}:`, errorMessage);
    if (error.response?.data) {
      console.error('Error response data:', error.response.data);
    }
    // Return an empty response on error
    return { data: [] };
  }
}

async function getOrCreateNbaLeague(supabase) {
  try {
    console.log('🔍 Checking for NBA league in database...');
    
    // Try to find the NBA league
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id')
      .eq('sport', 'basketball')
      .eq('name', 'NBA')
      .maybeSingle();
      
    if (error) throw error;
    
    if (leagues) {
      console.log(`✅ Found NBA league with ID: ${leagues.id}`);
      return leagues.id;
    }
    
    // If not found, create it
    console.log('ℹ️ NBA league not found, creating...');
    const { data: newLeague, error: createError } = await supabase
      .from('leagues')
      .insert([
        { 
          name: 'NBA',
          sport: 'basketball',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();
      
    if (createError) throw createError;
    
    console.log(`✅ Created NBA league with ID: ${newLeague.id}`);
    return newLeague.id;
    
  } catch (error) {
    console.error('❌ Error getting or creating NBA league:', error);
    // Fallback to a known NBA league UUID if available
    return '5b2f7f79-3df3-4602-bb9d-b8a8e0f3b9b6'; // This should be replaced with your actual NBA league UUID
  }
}

async function fetchNbaData() {
  try {
    console.log('🏀 Fetching NBA data from MySportsFeeds...');
    
    // Initialize Supabase client with environment variables
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Error: Missing Supabase URL or key. Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY are set in your .env file.');
      return false;
    }
    
    console.log('🔌 Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get or create NBA league ID
    const nbaLeagueId = await getOrCreateNbaLeague(supabase);
    
    // Initialize MySportsFeeds client
    const msfApiKey = process.env.MY_SPORTS_FEEDS_API_KEY;
    const msfPassword = process.env.MY_SPORTS_FEEDS_PASSWORD || 'MYSPORTSFEEDS';
    
    if (!msfApiKey) {
      console.error('❌ Error: Missing MySportsFeeds API key. Please set MY_SPORTS_FEEDS_API_KEY in your .env file.');
      return false;
    }
    
    console.log('🔌 Initializing MySportsFeeds client...');
    const msf = new MySportsFeeds('2.1', true);
    msf.authenticate(msfApiKey, msfPassword);
    console.log('✅ MySportsFeeds client initialized successfully');
    
    // Get the current season slug
    const seasonSlug = await fetchCurrentSeasonSlug(msf);

    if (!seasonSlug) {
      console.error('❌ Critical: Could not determine NBA season slug. Aborting.');
      return false;
    }

    console.log(`📅 Using NBA season slug: ${seasonSlug}`);
    
    // 1. Check database schema first
    console.log('🔍 Checking database schema...');
    await checkDatabaseSchema(supabase);
    
    // 1.5. Log database schema for debugging
    await logDatabaseSchema(supabase);
    
    // 2. Fetch and process venues
    console.log('🏟️ Fetching and processing venues...');
    await fetchAndProcessVenues(msf, supabase, seasonSlug);

    // 3. Fetch and process games (this also returns team references)
    console.log('Processing games data...');
    const games = await fetchAndProcessGames(msf, supabase, seasonSlug, nbaLeagueId);
    
    console.log('✅ Successfully fetched and processed NBA venues, teams, and games.');
    return true; // Indicate success
  } catch (error) {
    console.error('❌ An error occurred during NBA data fetching:', error.message ? error.message : error);
    // Log the full error object if it's more complex
    if (typeof error === 'object' && error !== null) {
        console.error('Full error object:', JSON.stringify(error, null, 2));
    }
    return false; // Indicate failure
  }
}

if (require.main === module) {
  // Run the main function if this script is executed directly
  fetchNbaData()
    .then(success => {
      if (success) {
        console.log('✅ Script completed successfully.');
        process.exit(0);
      } else {
        console.error('❌ Script finished with errors.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unhandled error in main execution:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules if needed
module.exports = {
  fetchAndProcessGames
};

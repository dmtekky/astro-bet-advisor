// sync.js - MANUAL_OVERWRITE_V1 - DATE: 2025-05-27
console.log('<<<<< RUNNING sync.js - MANUAL_OVERWRITE_V1 >>>>>');
console.log('<<<<< If you see this, the new script is running. >>>>>');

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const envPath = require('path').resolve(__dirname, '../../.env');
console.log(`<<<<< Attempting to load .env from: ${envPath} >>>>>`);
require('dotenv').config({ path: envPath });

console.log('<<<<< DOTENV CONFIGURED (or attempted) >>>>>');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

console.log(`<<<<< Supabase URL Loaded: ${!!supabaseUrl} >>>>>`);
console.log(`<<<<< Supabase Key Loaded: ${!!supabaseKey} >>>>>`);

if (!supabaseUrl || !supabaseKey) {
  console.error('🔥 FATAL ERROR: Supabase URL or Key is missing from .env. Ensure .env is at project root and VITE_SUPABASE_URL/KEY are set.');
  console.error(`Tried to load .env from: ${envPath}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('<<<<< SUPABASE CLIENT INITIALIZED >>>>>');

// TheSportsDB API key and MLB league ID
const API_KEY = '502451'; // Your API key for TheSportsDB
const LEAGUE_ID_SPORTSDB = '4424'; // MLB league ID in TheSportsDB

const TEAM_NAME_MAPPING = {
  'Athletics': 'Oakland Athletics',
  'D-backs': 'Arizona Diamondbacks',
  'White Sox': 'Chicago White Sox',
  'Cubs': 'Chicago Cubs',
  'Reds': 'Cincinnati Reds',
  'Guardians': 'Cleveland Guardians',
  'Rockies': 'Colorado Rockies',
  'Tigers': 'Detroit Tigers',
  'Astros': 'Houston Astros',
  'Royals': 'Kansas City Royals',
  'Angels': 'Los Angeles Angels',
  'Dodgers': 'Los Angeles Dodgers',
  'Marlins': 'Miami Marlins',
  'Brewers': 'Milwaukee Brewers',
  'Twins': 'Minnesota Twins',
  'Mets': 'New York Mets',
  'Yankees': 'New York Yankees',
  'Phillies': 'Philadelphia Phillies',
  'Pirates': 'Pittsburgh Pirates',
  'Padres': 'San Diego Padres',
  'Giants': 'San Francisco Giants',
  'Mariners': 'Seattle Mariners',
  'Cardinals': 'St. Louis Cardinals',
  'Rays': 'Tampa Bay Rays',
  'Rangers': 'Texas Rangers',
  'Blue Jays': 'Toronto Blue Jays',
  'Nationals': 'Washington Nationals',
  'Braves': 'Atlanta Braves',
  'Orioles': 'Baltimore Orioles',
  'Red Sox': 'Boston Red Sox'
};
console.log('<<<<< TEAM_NAME_MAPPING DEFINED >>>>>');


async function syncGames() {
  console.log('<<<<< syncGames FUNCTION CALLED >>>>>');
  try {
    console.log('🚀 Starting games sync...');

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('name', 'MLB')
      .single();

    if (leagueError || !league) {
      console.error('🔥 FATAL ERROR: MLB league not found in database.', leagueError);
      process.exit(1);
    }
    console.log(`✅ Found league in DB: ${league.name} (ID: ${league.id})`);

    console.log('🔍 Fetching teams from database...');
    const { data: teamsInDb, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('league_id', league.id);

    if (teamsError) {
      console.error('🔥 FATAL ERROR: Could not fetch teams from database.', teamsError);
      process.exit(1);
    }
    console.log(`📋 Found ${teamsInDb.length} teams in database for league ${league.name}`);

    console.log('🔍 Fetching games from TheSportsDB...');
    const sportsDbApiUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnextleague.php?id=${LEAGUE_ID_SPORTSDB}`;
    const response = await axios.get(sportsDbApiUrl, { timeout: 15000 });

    const events = response.data?.events || [];
    console.log(`🎯 Found ${events.length} upcoming games from TheSportsDB.`);
    if (events.length === 0) {
        console.log('No events found from TheSportsDB. Exiting sync process.');
        return;
    }

    let processedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      const eventIdentifier = `EventID-${event.idEvent || 'UNKNOWN_API_ID'}`;
      console.log(`\n🔄 Processing ${eventIdentifier}: ${event.strEvent || 'No event name provided by API'}`);

      try {
        if (!event.idEvent || !event.strHomeTeam || !event.strAwayTeam || !event.dateEvent) {
          console.warn(`⏭️ ${eventIdentifier}: Skipping - API event data missing critical fields (idEvent, strHomeTeam, strAwayTeam, or dateEvent). Event data:`, JSON.stringify(event));
          skippedCount++;
          continue;
        }

        const homeTeamApiName = TEAM_NAME_MAPPING[event.strHomeTeam] || event.strHomeTeam;
        const awayTeamApiName = TEAM_NAME_MAPPING[event.strAwayTeam] || event.strAwayTeam;

        const homeTeamDb = teamsInDb.find(t => t.name.toLowerCase() === homeTeamApiName.toLowerCase());
        const awayTeamDb = teamsInDb.find(t => t.name.toLowerCase() === awayTeamApiName.toLowerCase());

        if (!homeTeamDb) {
          console.warn(`⏭️ ${eventIdentifier}: Skipping - Home team '${homeTeamApiName}' (from API '${event.strHomeTeam}') not found in your DB.`);
          skippedCount++;
          continue;
        }
        if (!awayTeamDb) {
          console.warn(`⏭️ ${eventIdentifier}: Skipping - Away team '${awayTeamApiName}' (from API '${event.strAwayTeam}') not found in your DB.`);
          skippedCount++;
          continue;
        }

        const gameDateTimeStr = event.dateEvent + 'T' + (event.strTime || '00:00:00Z'); // Assume Z if no specific timezone offset
        const gameDate = new Date(gameDateTimeStr);
        if (isNaN(gameDate.getTime())) {
            console.warn(`⏭️ ${eventIdentifier}: Skipping - Invalid game date parsed from API ('${gameDateTimeStr}')`);
            skippedCount++;
            continue;
        }

        const externalId = parseInt(event.idEvent, 10);

        const gameRecord = {
          external_id: externalId,
          league_id: league.id,
          season: 2025, // CRITICALLY HARDCODED AS INTEGER!
          season_type: 'regular', // Defaulting to 'regular'
          game_date: gameDate.toISOString(),
          game_time_utc: gameDate.toISOString(),
          game_time_local: gameDate.toISOString(), // Consider local time zone adjustment if necessary
          status: event.strStatus === 'Match Finished' ? 'completed' : 'scheduled',
          home_team_id: homeTeamDb.id,
          away_team_id: awayTeamDb.id,
        };

        console.log(`✅ ${eventIdentifier}: Prepared gameRecord. Crucially, season = ${gameRecord.season} (type: ${typeof gameRecord.season})`);
        console.log(`Full gameRecord for ${eventIdentifier} BEFORE DB OPERATION:`, JSON.stringify(gameRecord, null, 2));

        console.log(`🔍 ${eventIdentifier}: Checking existence in DB for external_id: ${gameRecord.external_id}`);
        const { data: existingGame, error: fetchError } = await supabase
          .from('games')
          .select('id')
          .eq('external_id', gameRecord.external_id)
          .maybeSingle();

        if (fetchError) {
          console.error(`❌ ${eventIdentifier}: DB Error fetching existing game:`, JSON.stringify(fetchError, null, 2));
          skippedCount++;
          continue;
        }

        if (existingGame) {
          console.log(`ℹ️ ${eventIdentifier}: Game exists (DB ID: ${existingGame.id}). Attempting UPDATE.`);
          const { data: updatedData, error: updateError } = await supabase
            .from('games')
            .update(gameRecord)
            .eq('external_id', gameRecord.external_id)
            .select();

          if (updateError) {
            console.error(`❌ ${eventIdentifier}: DB Error updating game:`, JSON.stringify(updateError, null, 2));
            console.error(`Data sent for update for ${eventIdentifier}:`, JSON.stringify(gameRecord, null, 2));
            skippedCount++;
          } else {
            console.log(`✅ ${eventIdentifier}: Successfully updated game. Result:`, JSON.stringify(updatedData, null, 2));
            processedCount++;
          }
        } else {
          console.log(`ℹ️ ${eventIdentifier}: Game does not exist. Attempting INSERT.`);
          const { data: insertedData, error: insertError } = await supabase
            .from('games')
            .insert([gameRecord])
            .select();

          if (insertError) {
            console.error(`❌ ${eventIdentifier}: DB Error inserting game:`, JSON.stringify(insertError, null, 2));
            console.error(`Data sent for insert for ${eventIdentifier}:`, JSON.stringify(gameRecord, null, 2));
            skippedCount++;
          } else {
            console.log(`✅ ${eventIdentifier}: Successfully inserted new game. Result:`, JSON.stringify(insertedData, null, 2));
            processedCount++;
          }
        }
      } catch (loopError) {
        console.error(`❌❌❌ ${eventIdentifier}: UNEXPECTED ERROR in event loop:`, loopError.message);
        console.error(loopError.stack);
        skippedCount++;
      }
    }

    console.log(`\n✨ Sync complete! Processed: ${processedCount}, Skipped: ${skippedCount}`);

  } catch (mainError) {
    console.error('🔥🔥🔥 FATAL ERROR in syncGames function:', mainError.message);
    console.error(mainError.stack);
    process.exit(1);
  }
}

syncGames();
console.log('<<<<< sync.js script finished. >>>>>');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('🔥 Fatal error: Supabase URL or Key is missing. Check your .env file and path.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// TheSportsDB API key and MLB league ID
const API_KEY = '502451'; // Your API key for TheSportsDB
const LEAGUE_ID_SPORTSDB = '4424'; // MLB league ID in TheSportsDB

// Team name mappings (from TheSportsDB to your DB names if different)
const TEAM_NAME_MAPPING = {
  'Athletics': 'Oakland Athletics',
  'D-backs': 'Arizona Diamondbacks',
  'White Sox': 'Chicago White Sox',
  'Cubs': 'Chicago Cubs',
  'Reds': 'Cincinnati Reds',
  'Guardians': 'Cleveland Guardians',
  'Rockies': 'Colorado Rockies',
  'Tigers': 'Detroit Tigers',
  'Astros': 'Houston Astros',
  'Royals': 'Kansas City Royals',
  'Angels': 'Los Angeles Angels',
  'Dodgers': 'Los Angeles Dodgers',
  'Marlins': 'Miami Marlins',
  'Brewers': 'Milwaukee Brewers',
  'Twins': 'Minnesota Twins',
  'Mets': 'New York Mets',
  'Yankees': 'New York Yankees',
  'Phillies': 'Philadelphia Phillies',
  'Pirates': 'Pittsburgh Pirates',
  'Padres': 'San Diego Padres',
  'Giants': 'San Francisco Giants',
  'Mariners': 'Seattle Mariners',
  'Cardinals': 'St. Louis Cardinals',
  'Rays': 'Tampa Bay Rays',
  'Rangers': 'Texas Rangers',
  'Blue Jays': 'Toronto Blue Jays',
  'Nationals': 'Washington Nationals',
  'Braves': 'Atlanta Braves',
  'Orioles': 'Baltimore Orioles',
  'Red Sox': 'Boston Red Sox'
};

async function syncGames() {
  try {
    console.log('🚀 Starting games sync...');

    // Get MLB league ID from your database
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('name', 'MLB')
      .single();

    if (leagueError || !league) {
      console.error('🔥 Fatal error: MLB league not found in database.', leagueError);
      process.exit(1);
    }
    console.log(`✅ Found league in DB: ${league.name} (ID: ${league.id})`);

    // Fetch all teams for this league from your database
    console.log('🔍 Fetching teams from database...');
    const { data: teamsInDb, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('league_id', league.id);

    if (teamsError) {
      console.error('🔥 Fatal error: Could not fetch teams from database.', teamsError);
      process.exit(1);
    }
    console.log(`📋 Found ${teamsInDb.length} teams in database for league ${league.name}`);
    if (teamsInDb.length === 0) {
        console.warn('⚠️ Warning: No teams found in your database for MLB. Team matching will likely fail.');
    }

    // Fetch upcoming games from TheSportsDB
    console.log('🔍 Fetching games from TheSportsDB...');
    const sportsDbApiUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnextleague.php?id=${LEAGUE_ID_SPORTSDB}`;
    const response = await axios.get(sportsDbApiUrl, { timeout: 15000 });

    const events = response.data?.events || [];
    if (events.length === 0) {
        console.log('🎯 No upcoming games found from TheSportsDB for MLB.');
        return;
    }
    console.log(`🎯 Found ${events.length} upcoming games from TheSportsDB.`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      try {
        console.log(`\n🔄 Processing event ID ${event.idEvent}: ${event.strEvent}`);

        if (!event.idEvent || !event.strHomeTeam || !event.strAwayTeam || !event.dateEvent) {
          console.warn('⏭️ Skipping event due to missing critical fields (idEvent, strHomeTeam, strAwayTeam, or dateEvent). Event:', event);
          skippedCount++;
          continue;
        }

        const homeTeamApiName = TEAM_NAME_MAPPING[event.strHomeTeam] || event.strHomeTeam;
        const awayTeamApiName = TEAM_NAME_MAPPING[event.strAwayTeam] || event.strAwayTeam;

        const homeTeamDb = teamsInDb.find(t => t.name.toLowerCase() === homeTeamApiName.toLowerCase());
        const awayTeamDb = teamsInDb.find(t => t.name.toLowerCase() === awayTeamApiName.toLowerCase());

        if (!homeTeamDb || !awayTeamDb) {
          console.warn(`⏭️ Skipping event: Teams not found in DB. API Home: '${event.strHomeTeam}' (Mapped: '${homeTeamApiName}'), API Away: '${event.strAwayTeam}' (Mapped: '${awayTeamApiName}'). Found Home: ${!!homeTeamDb}, Found Away: ${!!awayTeamDb}`);
          skippedCount++;
          continue;
        }

        const gameDateTimeStr = event.dateEvent + 'T' + (event.strTime || '00:00:00Z'); // Assume Z if no specific timezone offset
        const gameDate = new Date(gameDateTimeStr);
        if (isNaN(gameDate.getTime())) {
            console.warn(`⏭️ Skipping event ID ${event.idEvent}: Invalid game date '${gameDateTimeStr}'`);
            skippedCount++;
            continue;
        }

        const externalId = parseInt(event.idEvent, 10);
        if (isNaN(externalId)) {
            console.warn(`⏭️ Skipping event ID ${event.idEvent}: Invalid external_id (idEvent).`);
            skippedCount++;
            continue;
        }

        // Prepare data with ONLY NOT NULL fields (excluding DB defaults like 'id')
        const gameRecord = {
          external_id: externalId,
          league_id: league.id,
          season: 2025, // CRITICAL: Hardcoded integer
          season_type: 'regular', // Assuming 'regular'
          game_date: gameDate.toISOString(),
          game_time_utc: gameDate.toISOString(), // Or specific UTC time if available
          game_time_local: gameDate.toISOString(), // Or specific local time if available
          status: event.strStatus === 'Match Finished' ? 'completed' : 'scheduled', // Or map other statuses
          home_team_id: homeTeamDb.id,
          away_team_id: awayTeamDb.id,
          // Optional fields (nullable or with DB defaults) can be added later
          // home_score: event.intHomeScore ? parseInt(event.intHomeScore, 10) : null,
          // away_score: event.intAwayScore ? parseInt(event.intAwayScore, 10) : null,
          // updated_at: new Date().toISOString() // Let DB handle if it has default now()
        };

        // Check if game already exists by external_id
        const { data: existingGame, error: fetchError } = await supabase
          .from('games')
          .select('id') // Select only 'id' or a minimal field for existence check
          .eq('external_id', gameRecord.external_id)
          .maybeSingle(); // Returns one_row or null, no error if not found

        if (fetchError) {
          console.error(`❌ Error fetching existing game (external_id: ${gameRecord.external_id}):`, JSON.stringify(fetchError, null, 2));
          skippedCount++;
          continue;
        }

        if (existingGame) {
          // Game exists, update it
          console.log(`ℹ️ Game (external_id: ${gameRecord.external_id}) exists. Preparing to update with:`, gameRecord);
          const { data: updatedData, error: updateError } = await supabase
            .from('games')
            .update(gameRecord) // Pass the same minimal record for now
            .eq('external_id', gameRecord.external_id)
            .select();

          if (updateError) {
            console.error(`❌ Error updating game (external_id: ${gameRecord.external_id}):`, JSON.stringify(updateError, null, 2));
            console.error('Data sent for update:', JSON.stringify(gameRecord, null, 2));
            skippedCount++;
          } else {
            console.log(`✅ Successfully updated game (external_id: ${gameRecord.external_id}). Result:`, updatedData);
            processedCount++;
          }
        } else {
          // Game does not exist, insert it
          console.log(`ℹ️ Game (external_id: ${gameRecord.external_id}) does not exist. Preparing to insert:`, gameRecord);
          const { data: insertedData, error: insertError } = await supabase
            .from('games')
            .insert([gameRecord]) // insert expects an array of objects
            .select();

          if (insertError) {
            console.error(`❌ Error inserting game (external_id: ${gameRecord.external_id}):`, JSON.stringify(insertError, null, 2));
            console.error('Data sent for insert:', JSON.stringify(gameRecord, null, 2));
            skippedCount++;
          } else {
            console.log(`✅ Successfully inserted new game (external_id: ${gameRecord.external_id}). Result:`, insertedData);
            processedCount++;
          }
        }

      } catch (loopError) {
        // Catch errors within the loop for a specific event
        console.error(`❌❌❌ An unexpected error occurred while processing event ID ${event.idEvent}:`, JSON.stringify(loopError, Object.getOwnPropertyNames(loopError), 2));
        skippedCount++;
      }
    }

    console.log(`\n✨ Sync complete! Processed: ${processedCount}, Skipped: ${skippedCount}`);

  } catch (mainError) {
    // Catch fatal errors outside the loop (e.g., initial setup, API fetch)
    console.error('🔥🔥🔥 A fatal error occurred during the sync process:', JSON.stringify(mainError, Object.getOwnPropertyNames(mainError), 2));
    process.exit(1);
  }
}

syncGames();

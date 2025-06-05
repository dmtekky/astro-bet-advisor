import { createClient } from '@supabase/supabase-js';
import https from 'https';

// Initialize Supabase client - hardcoded for reliability
const supabaseUrl = 'https://awoxkynorbspcrrggbca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w';
const supabase = createClient(supabaseUrl, supabaseKey);

// MySportsFeeds API configuration
const MSF_API_KEY = '8844c949-54d6-4e72-ba93-203dfd';
const MSF_PASSWORD = 'MYSPORTSFEEDS';

// Table name for stats
const TABLE_NAME = 'nba_player_season_stats_2025';
const SEASON = '2024-25';

// Create our table
async function createNewTable() {
  console.log(`Creating new ${TABLE_NAME} table...`);
  
  try {
    // Check if table exists first
    const { count, error: countError } = await supabase
      .from('information_schema.tables')
      .select('table_name', { count: 'exact' })
      .eq('table_schema', 'public')
      .eq('table_name', TABLE_NAME);
    
    if (countError) {
      console.log('Error checking table existence:', countError.message);
    }
    
    // Create table if it doesn't exist
    if (!count) {
      console.log('Table does not exist, trying to create it');
      
      try {
        // Try a direct insert first to let Supabase auto-create the table
        const { error } = await supabase
          .from(TABLE_NAME)
          .insert({
            msf_player_id: 'test_id',
            player_name: 'Test Player',
            team_abbreviation: 'TEST',
            season: SEASON
          }).select();
        
        if (error && error.code !== '23505') { // Ignore unique violation errors
          console.error('Error creating table via insert:', error.message);
        } else {
          console.log('✅ Table created via initial insert');
        }
      } catch (error) {
        console.error('Error during initial table creation:', error.message);
      }
    } else {
      console.log('✅ Table already exists');
    }
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  }
}

// Function to make API requests
function makeApiRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${MSF_API_KEY}:${MSF_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    };

    console.log(`Making request to: ${url}`);
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            console.error('Error parsing JSON response:', error);
            reject(error);
          }
        } else {
          console.error(`API request failed with status: ${res.statusCode}`);
          // Output some of the response for debugging
          console.error('Response preview:', data.substring(0, 200));
          reject(new Error(`API request failed with status: ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      console.error('Error making API request:', error);
      reject(error);
    });
  });
}

// Main function to fetch and process NBA player stats
async function fetchAndProcessNBAPlayerStats() {
  try {
    await createNewTable();
    console.log('Fetching NBA player stats...');

    // Fetch player stats from MySportsFeeds
    const statsUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nba/2024-2025-regular/player_stats_totals.json';
    const statsData = await makeApiRequest(statsUrl);
    
    if (!statsData || !statsData.playerStatsTotals) {
      throw new Error('No player stats data returned from API');
    }
    
    console.log(`✅ Fetched ${statsData.playerStatsTotals.length} player stats records from API`);
    
    // Process and save the stats - no dependency on player DB matching
    await processAndSaveStats(statsData.playerStatsTotals);
    
    return true;
  } catch (error) {
    console.error('❌ Error in fetchAndProcessNBAPlayerStats:', error);
    throw error;
  }
}

// Process and save player stats using insert-then-update pattern to avoid conflicts
async function processAndSaveStats(playerStats) {
  console.log(`Processing ${playerStats.length} player stats...`);
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // First, get the players we've already inserted to avoid duplicates
    const { data: existingPlayers, error: queryError } = await supabase
      .from(TABLE_NAME)
      .select('msf_player_id')
      .eq('season', SEASON);
      
    if (queryError) {
      console.error('Error fetching existing players:', queryError.message);
    }
    
    // Create a Set of already-inserted player IDs for quick lookups
    const existingPlayerIds = new Set();
    if (existingPlayers) {
      existingPlayers.forEach(player => {
        if (player.msf_player_id) {
          existingPlayerIds.add(player.msf_player_id);
        }
      });
      console.log(`Found ${existingPlayerIds.size} existing players in the database`);
    }
    
    // Process ONE player at a time to avoid batch conflicts
    for (let i = 0; i < playerStats.length; i++) {
      const playerStat = playerStats[i];
      
      // Log progress every 10 players
      if (i % 10 === 0) {
        console.log(`Progress: ${i}/${playerStats.length} processed`);
      }
      
      try {
        if (!playerStat || !playerStat.player || !playerStat.stats) {
          console.log('Skipping invalid player data');
          errorCount++;
          continue;
        }
        
        const player = playerStat.player;
        const team = playerStat.team || {};
        const stats = playerStat.stats;
        
        // Skip if the player is already in our database
        if (existingPlayerIds.has(player.id)) {
          console.log(`Player ${player.id} already in database, updating...`);
        }
        
        // Skip if no stats available
        if (!stats || Object.keys(stats).length === 0) {
          console.log(`No stats for player ${player.id} (${player.firstName} ${player.lastName})`);
          errorCount++;
          continue;
        }
        
        // Prepare the stats data
        const statsData = {
          msf_player_id: player.id,
          player_name: `${player.firstName} ${player.lastName}`,
          team_abbreviation: team.abbreviation || 'UNK',
          season: SEASON,
          games_played: stats.gamesPlayed || 0,
          games_started: stats.gamesStarted || 0,
          minutes_played: stats.minutes || 0,
          points: stats.points || 0,
          total_rebounds: (stats.offReb || 0) + (stats.defReb || 0),
          offensive_rebounds: stats.offReb || 0,
          defensive_rebounds: stats.defReb || 0,
          assists: stats.assists || 0,
          steals: stats.steals || 0,
          blocks: stats.blocks || 0,
          turnovers: stats.turnovers || 0,
          field_goals_made: stats.fgMade || 0,
          field_goals_attempted: stats.fgAtt || 0,
          field_goal_pct: stats.fgPct || 0,
          three_point_made: stats.fg3PtMade || 0,
          three_point_attempted: stats.fg3PtAtt || 0,
          three_point_pct: stats.fg3PtPct || 0,
          free_throws_made: stats.ftMade || 0,
          free_throws_attempted: stats.ftAtt || 0,
          free_throw_pct: stats.ftPct || 0,
          personal_fouls: stats.fouls || 0,
          plus_minus: stats.plusMinus || 0,
          raw_stats: stats
        };
        
        // Try to insert or update one at a time
        try {
          if (existingPlayerIds.has(player.id)) {
            // Update existing player
            const { error: updateError } = await supabase
              .from(TABLE_NAME)
              .update(statsData)
              .eq('msf_player_id', player.id)
              .eq('season', SEASON);
            
            if (updateError) {
              console.error(`Error updating player ${player.id}:`, updateError.message);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            // Insert new player
            const { error: insertError } = await supabase
              .from(TABLE_NAME)
              .insert(statsData);
            
            if (insertError) {
              console.error(`Error inserting player ${player.id}:`, insertError.message);
              errorCount++;
            } else {
              successCount++;
              // Add to our set of existing players to avoid duplicate inserts
              existingPlayerIds.add(player.id);
            }
          }
        } catch (error) {
          console.error(`Error processing player ${player.id}:`, error.message);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing player at index ${i}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== Stats processing summary ===`);
    console.log(`Total players: ${playerStats.length}`);
    console.log(`Successful operations: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    
    return successCount;
  } catch (error) {
    console.error('❌ Error in processing stats:', error);
    throw error;
  }
}

// Run the main function
fetchAndProcessNBAPlayerStats()
  .then(() => {
    console.log('✅ Stats sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error in stats sync:', error);
    process.exit(1);
  });

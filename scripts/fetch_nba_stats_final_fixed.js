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
    // First clear the table to ensure fresh data
    console.log('Clearing existing data from table...');
    const { error: clearError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .neq('msf_player_id', 'test_id'); // preserve test row if it exists
      
    if (clearError) {
      console.error('Error clearing table:', clearError.message);
    } else {
      console.log('Table cleared successfully');
    }
    
    // Process players in smaller batches to avoid timeouts
    const batchSize = 10;
    const totalBatches = Math.ceil(playerStats.length / batchSize);
    
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const start = batchNum * batchSize;
      const end = Math.min(start + batchSize, playerStats.length);
      const batch = playerStats.slice(start, end);
      console.log(`\nProcessing batch ${batchNum + 1}/${totalBatches} (${start}-${end})...`);
      
      const statsToInsert = [];
      
      for (const playerStat of batch) {
        try {
          if (!playerStat || !playerStat.player || !playerStat.stats) {
            console.log('Skipping invalid player data');
            errorCount++;
            continue;
          }
          
          const player = playerStat.player;
          const team = playerStat.team || {};
          const stats = playerStat.stats;
          const fieldGoals = stats.fieldGoals || {};
          const freeThrows = stats.freeThrows || {};
          const rebounds = stats.rebounds || {};
          const offense = stats.offense || {};
          const defense = stats.defense || {};
          const misc = stats.miscellaneous || {};
          
          // Skip if no stats available
          if (!stats || Object.keys(stats).length === 0) {
            console.log(`No stats for player ${player.id} (${player.firstName} ${player.lastName})`);
            errorCount++;
            continue;
          }
          
          // Convert minutes from seconds to minutes
          const minSeconds = misc.minSeconds || 0;
          const minutesPlayed = Math.round(minSeconds / 60);
          
          // Prepare the stats data for insert with correct field mappings
          const statsData = {
            msf_player_id: player.id,
            player_name: `${player.firstName} ${player.lastName}`,
            team_abbreviation: team.abbreviation || 'UNK',
            season: SEASON,
            games_played: stats.gamesPlayed || 0,
            games_started: misc.gamesStarted || 0,
            minutes_played: minutesPlayed,
            points: offense.pts || 0,
            total_rebounds: rebounds.reb || 0,
            offensive_rebounds: rebounds.offReb || 0,
            defensive_rebounds: rebounds.defReb || 0,
            assists: offense.ast || 0,
            steals: defense.stl || 0,
            blocks: defense.blk || 0,
            turnovers: defense.tov || 0,
            field_goals_made: fieldGoals.fgMade || 0,
            field_goals_attempted: fieldGoals.fgAtt || 0,
            field_goal_pct: fieldGoals.fgPct || 0,
            three_point_made: fieldGoals.fg3PtMade || 0,
            three_point_attempted: fieldGoals.fg3PtAtt || 0,
            three_point_pct: fieldGoals.fg3PtPct || 0,
            free_throws_made: freeThrows.ftMade || 0,
            free_throws_attempted: freeThrows.ftAtt || 0,
            free_throw_pct: freeThrows.ftPct || 0,
            personal_fouls: misc.foulPers || 0,
            plus_minus: misc.plusMinus || 0,
            raw_stats: stats
          };
          
          statsToInsert.push(statsData);
          
        } catch (error) {
          console.error(`Error processing player:`, error);
          errorCount++;
        }
      }
      
      // Insert batch
      if (statsToInsert.length > 0) {
        try {
          const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(statsToInsert)
            .select('id');
          
          if (error) {
            console.error('❌ Error inserting batch:', error);
            errorCount += statsToInsert.length;
          } else {
            console.log(`✅ Successfully inserted ${data.length} records`);
            successCount += data.length;
          }
        } catch (error) {
          console.error('❌ Exception during batch insert:', error);
          errorCount += statsToInsert.length;
        }
      }
    }
    
    console.log(`\n=== Stats processing summary ===`);
    console.log(`Total players: ${playerStats.length}`);
    console.log(`Successful inserts: ${successCount}`);
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

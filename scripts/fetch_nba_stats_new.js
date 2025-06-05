
import { createClient } from '@supabase/supabase-js';
import https from 'https';

// Initialize Supabase client
const supabaseUrl = 'https://awoxkynorbspcrrggbca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MySportsFeeds API configuration
const MSF_API_KEY = '8844c949-54d6-4e72-ba93-203dfd';
const MSF_PASSWORD = 'MYSPORTSFEEDS'; // Default password for v2.1 API

if (!MSF_API_KEY) {
  console.error('Error: MY_SPORTS_FEEDS_API_KEY is not set (this should not happen if hardcoded)');
  process.exit(1);
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
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          console.error(`API request failed with status ${res.statusCode}`);
          console.error('Response data:', data);
          reject(new Error(`API request failed with status ${res.statusCode}`));
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
    
    // Use the 2024-2025 season with -regular suffix
    const season = '2024-2025-regular';
    
    // Use the player stats totals endpoint
    const endpoint = `/v2.1/pull/nba/${season}/player_stats_totals.json`;
    
    const params = new URLSearchParams({
      sort: 'player.lastName',
      sortType: 'asc',
      limit: 500
    });
    
    const url = `https://api.mysportsfeeds.com${endpoint}?${params.toString()}`;
    
    // Make the API request
    console.log('Fetching player stats from MySportsFeeds API...');
    const response = await makeApiRequest(url);
    
    if (!response || !response.playerStatsTotals) {
      console.error('Invalid response format from API');
      return;
    }
    
    const playerStats = response.playerStatsTotals;
    console.log(`\nSuccessfully fetched ${playerStats.length} player stats`);
    
    // Log sample player data
    if (playerStats.length > 0) {
      const samplePlayer = playerStats[0];
      console.log('\nSample player data:');
      console.log(JSON.stringify({
        name: `${samplePlayer.player.firstName} ${samplePlayer.player.lastName}`,
        team: samplePlayer.team.abbreviation,
        gamesPlayed: samplePlayer.stats?.gamesPlayed,
        points: samplePlayer.stats?.pts,
        rebounds: samplePlayer.stats?.reb,
        assists: samplePlayer.stats?.ast
      }, null, 2));
    }
    
    // Process and save the stats
    await processAndSaveStats(playerStats);
    
  } catch (error) {
    console.error('Error in fetchAndProcessNBAPlayerStats:', error);
  }
}

// Process and save player stats to Supabase
async function processAndSaveStats(playerStats) {
  console.log('\nProcessing player stats for database insertion...');
  
  // First, get all current NBA players to map by name
  const { data: players, error: playersError } = await supabase
    .from('nba_players')
    .select('id, first_name, last_name, team_id');
    
  if (playersError) {
    console.error('Error fetching players:', playersError);
    return;
  }
  
  console.log(`Fetched ${players.length} players from database`);
  
  // Create a map of player names to player data for easy lookup
  const playerNameMap = new Map();
  
  players.forEach(player => {
    // Map by full name
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase().trim();
    playerNameMap.set(fullName, player);
    
    // Also map by last name, first name
    const reverseName = `${player.last_name}, ${player.first_name}`.toLowerCase().trim();
    playerNameMap.set(reverseName, player);
    
    // And by first initial + last name
    const shortName = `${player.first_name[0]}. ${player.last_name}`.toLowerCase().trim();
    playerNameMap.set(shortName, player);
  });
  
  console.log(`Created lookup map with ${playerNameMap.size} player name variations`);
  
  // First, check the structure of the nba_player_season_stats table
  console.log('\nChecking database structure...');
  const { data: tableInfo, error: tableError } = await supabase
    .from('nba_player_season_stats')
    .select('*')
    .limit(1);
    
  if (tableError) {
    console.error('Error checking table structure:', tableError);
    return;
  }
  
  // Define the columns we want to use based on our schema
  const availableColumns = [
    'player_id',
    'season',
    'team_id',
    'games_played',
    'minutes',
    'points',
    'rebounds',
    'assists',
    'steals',
    'blocks',
    'turnovers',
    'field_goals_made',
    'field_goals_attempted',
    'three_point_made',
    'three_point_attempted',
    'free_throws_made',
    'free_throws_attempted',
    'offensive_rebounds',
    'defensive_rebounds',
    'personal_fouls',
    'plus_minus',
    'games_started',
    'field_goal_pct',
    'three_point_pct',
    'free_throw_pct',
    'raw_stats'
  ];
  
  console.log('Using columns:', availableColumns);

  // Process each player's stats
  const statsToInsert = [];
  let matchedPlayers = 0;
  let statsWithNoData = 0;
  let failedMatches = 0;
  
  for (const player of playerStats) {
    try {
      if (!player || !player.player || !player.team) {
        console.log('Skipping invalid player data:', player);
        failedMatches++;
        continue;
      }
      
      const playerName = player.player?.name;
      const playerTeam = player.team?.abbreviation;
      const stats = player.stats;
      
      // Skip if no stats data
      if (!stats || Object.keys(stats).length === 0) {
        console.log(`No stats data for player: ${playerName} (${playerTeam})`);
        statsWithNoData++;
        continue;
      }
      
      // Skip if missing required fields
      if (!playerName) {
        console.log('Skipping player with no name');
        failedMatches++;
        continue;
            break;
          }
        }
      }
      
      if (playerData) {
        // Format the raw stats as a JSONB object
        const rawStats = {
          ...stats,
          // Ensure all numeric values are properly typed
          gamesPlayed: parseInt(stats.gamesPlayed) || 0,
          minSeconds: parseFloat(stats.minSeconds) || 0,
          pts: parseFloat(stats.pts) || 0,
          reb: parseFloat(stats.reb) || 0,
          ast: parseFloat(stats.ast) || 0,
          stl: parseFloat(stats.stl) || 0,
          blk: parseFloat(stats.blk) || 0,
          tov: parseFloat(stats.tov) || 0,
          fgMade: parseFloat(stats.fgMade) || 0,
          fgAtt: parseFloat(stats.fgAtt) || 0,
          fg3PtMade: parseFloat(stats.fg3PtMade) || 0,
          fg3PtAtt: parseFloat(stats.fg3PtAtt) || 0,
          ftMade: parseFloat(stats.ftMade) || 0,
          ftAtt: parseFloat(stats.ftAtt) || 0,
          offReb: parseFloat(stats.offReb) || 0,
          defReb: parseFloat(stats.defReb) || 0,
          foulPers: parseFloat(stats.foulPers) || 0,
          plusMinus: parseFloat(stats.plusMinus) || 0,
          gamesStarted: parseInt(stats.gamesStarted) || 0,
          player_id: playerData.id,
          player_name: playerData.name,
          team_abbreviation: playerTeam,
          games_played: stats.gamesPlayed || 0,
          minutes_played: stats.minSeconds ? Math.round(parseFloat(stats.minSeconds) / 60) : 0,
          points: stats.pts || 0,
          total_rebounds: (stats.offReb || 0) + (stats.defReb || 0),
          assists: stats.ast || 0,
          steals: stats.stl || 0,
          blocks: stats.blk || 0,
          turnovers: stats.tov || 0,
          field_goals_made: stats.fgMade || 0,
          field_goals_attempted: stats.fgAtt || 0,
          three_point_made: stats.fg3PtMade || 0,
          three_point_attempted: stats.fg3PtAtt || 0,
          free_throws_made: stats.ftMade || 0,
          free_throws_attempted: stats.ftAtt || 0,
          offensive_rebounds: stats.offReb || 0,
          defensive_rebounds: stats.defReb || 0,
          personal_fouls: stats.foulPers || 0,
          plus_minus: stats.plusMinus || 0,
          games_started: stats.gamesStarted || 0,
          field_goal_pct: stats.fgPct || 0,
          three_point_pct: stats.fg3PtPct || 0,
          free_throw_pct: stats.ftPct || 0,
          raw_stats: stats,
          updated_at: new Date().toISOString(),
          season: '2024-25',
          team_id: playerData.team_id || null
        };
        
        statsToInsert.push(statsData);
        
        matchedPlayers++;
        
        // Log every 10th matched player
        if (matchedPlayers % 10 === 0) {
          console.log(`Matched ${matchedPlayers} players so far...`);
        }
      } else {
        console.log(`No match found for player: ${playerName} (${playerTeam})`);
        failedMatches++;
      }
    } catch (error) {
      console.error(`Error processing player stats:`, error);
    }
  }
  
  console.log(`\nProcessed ${playerStats.length} players:`);
  console.log(`- Matched: ${matchedPlayers}`);
  console.log(`- No stats data: ${statsWithNoData}`);
  console.log(`- Failed to match: ${failedMatches}`);
  
  // Insert or update stats in batches
  if (statsToInsert.length > 0) {
    console.log(`\nInserting/updating ${statsToInsert.length} player stats...`);
    
    try {
      const { data, error } = await supabase
        .from('nba_player_season_stats')
        .upsert(statsToInsert, { onConflict: ['player_id', 'season'] });
      
      if (error) {
        console.error('Error upserting player stats:', error);
      } else {
        console.log(`✅ Successfully upserted ${statsToInsert.length} player stats`);
      }
    } catch (error) {
      console.error('Exception during upsert:', error);
    }
  } else {
    console.log('No stats to insert');
  }
  
  return statsToInsert.length;
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

// Export functions for testing if needed
export {
  fetchAndProcessNBAPlayerStats,
  makeApiRequest,
  processAndSaveStats
};

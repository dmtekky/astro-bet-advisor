// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Debug log environment variables (without sensitive data)
console.log('Environment variables loaded:');
console.log('- PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL ? '***exists***' : 'MISSING');
console.log('- PUBLIC_SUPABASE_KEY:', process.env.PUBLIC_SUPABASE_KEY ? '***exists***' : 'MISSING');
console.log('- MY_SPORTS_FEEDS_API_KEY:', process.env.MY_SPORTS_FEEDS_API_KEY ? '***exists***' : 'MISSING');

// Validate required environment variables
const requiredVars = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_KEY', 'MY_SPORTS_FEEDS_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and try again.');
  process.exit(1);
}

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { Buffer } from 'buffer';

// Initialize Supabase client
console.log('\n🔌 Initializing Supabase client...');
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '***exists***' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Test Supabase connection and check tables
async function testSupabaseConnection() {
  console.log('\n🔍 Testing Supabase connection and checking tables...');
  
  try {
    // Get table structure for nba_players
    console.log('\n📋 nba_players table structure:');
    const { data: playersStructure, error: structError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'nba_players');
    
    if (structError) {
      console.error('❌ Error getting nba_players structure:', structError.message);
    } else {
      console.log(playersStructure.map(col => `- ${col.column_name} (${col.data_type})`).join('\n'));
    }
    
    // Get one player as sample
    const { data: samplePlayer, error: sampleError } = await supabase
      .from('nba_players')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.error('❌ Error getting sample player:', sampleError.message);
    } else if (samplePlayer) {
      console.log('\n👤 Sample player data:', JSON.stringify(samplePlayer, null, 2));
    }
    
    // Check nba_player_season_stats table
    console.log('\n📊 nba_player_season_stats table structure:');
    const { data: statsStructure, error: statsStructError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'nba_player_season_stats');
    
    if (statsStructError) {
      console.error('❌ Error getting nba_player_season_stats structure:', statsStructError.message);
    } else {
      console.log(statsStructure.map(col => `- ${col.column_name} (${col.data_type})`).join('\n'));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
    return false;
  }
}

// MySportsFeeds API Configuration
const API_KEY = process.env.MY_SPORTS_FEEDS_API_KEY;
const PASSWORD = 'MYSPORTSFEEDS';
const SEASON = '2024-2025-regular';
const API_URL = `/v2.1/pull/nba/${SEASON}/player_stats_totals.json`;

if (!API_KEY) {
  console.error('Error: MY_SPORTS_FEEDS_API_KEY is not set in environment variables');
  process.exit(1);
}

// Create Basic Auth token
const authToken = Buffer.from(`${API_KEY}:${PASSWORD}`).toString('base64');

function makeApiRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            console.log('API Response:', JSON.stringify({
              status: res.statusCode,
              headers: res.headers,
              data: Object.keys(jsonData).length > 0 ? 'Data received' : 'Empty data',
              sample: jsonData.playerStatsTotals ? 
                jsonData.playerStatsTotals[0] : 'No player stats found'
            }, null, 2));
            resolve(jsonData);
          } catch (e) {
            console.error('Error parsing API response:', e);
            console.error('Response data:', data);
            reject(e);
          }
        } else {
          console.error('API Error Response:', {
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function fetchPlayerStats() {
  try {
    console.log('Fetching NBA player stats...');
    
    // Use the 2024-2025 season with -regular suffix as per test_api.html
    const season = '2024-2025-regular';
    
    // Use the player stats totals endpoint that works in test_api.html
    const endpoint = `/v2.1/pull/nba/${season}/player_stats_totals.json`;
    console.log(`Using endpoint: ${endpoint}`);
  
    const params = new URLSearchParams({
      sort: 'player.lastName',
      limit: '500',
      offset: '0'
    });
  
    const path = `${endpoint}?${params.toString()}`;
    console.log(`Fetching stats for season: ${season}`);
  
    const options = {
      hostname: 'api.mysportsfeeds.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NBA Stats Fetcher/1.0'
      }
    };

    const data = await makeApiRequest(options);
    
    if (!data.playerStatsTotals || data.playerStatsTotals.length === 0) {
      console.log('No player stats found in the response');
      return;
    }
    
    console.log(`Fetched ${data.playerStatsTotals.length} player stats`);
  
  // Log the first player's stats to see the structure
  if (data.playerStatsTotals.length > 0) {
    console.log('\nSample player stats structure:');
    console.log(JSON.stringify({
      player: data.playerStatsTotals[0].player,
      team: data.playerStatsTotals[0].team,
      statistics: Object.entries(data.playerStatsTotals[0].statistics || {}).map(([key, value]) => ({
        key,
        value,
        type: typeof value
      }))
    }, null, 2));
  }
  
  // Process and insert stats into database
  await processAndSaveStats(data.playerStatsTotals);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Process and save player stats
async function processAndSaveStats(apiResponse) {
  if (!apiResponse) {
    console.error('No API response received');
    return;
  }
  
  // Log the structure of the response in detail
  console.log('\nAPI Response Structure:', JSON.stringify({
    type: typeof apiResponse,
    isArray: Array.isArray(apiResponse),
    keys: Object.keys(apiResponse),
    hasPlayerStatsTotals: 'playerStatsTotals' in apiResponse,
    playerStatsTotalsType: typeof apiResponse.playerStatsTotals,
    playerStatsTotalsIsArray: Array.isArray(apiResponse.playerStatsTotals),
    playerStatsTotalsLength: apiResponse.playerStatsTotals ? apiResponse.playerStatsTotals.length : 'N/A',
    firstLevelProperties: Object.entries(apiResponse).reduce((acc, [key, value]) => {
      acc[key] = {
        type: typeof value,
        isArray: Array.isArray(value),
        length: Array.isArray(value) ? value.length : 'N/A',
        sample: Array.isArray(value) && value.length > 0 ? value[0] : value
      };
      return acc;
    }, {})
  }, null, 2));
  
  // Extract player stats from the response
  let playerStats = [];
  if (apiResponse.playerStatsTotals && Array.isArray(apiResponse.playerStatsTotals)) {
    playerStats = apiResponse.playerStatsTotals;
    console.log(`Found ${playerStats.length} player stats in response`);
  } else if (Array.isArray(apiResponse)) {
    // In case the response is directly an array
    playerStats = apiResponse;
    console.log(`Using direct array response with ${playerStats.length} items`);
  } else {
    console.error('No player stats found in the API response');
    console.error('Response keys:', Object.keys(apiResponse));
    return;
  }
  
  if (playerStats.length === 0) {
    console.error('No player stats data available');
    return;
  }
  
  console.log('Processing player stats for database insertion...');
  
  // First, get all current NBA players to map by name
  console.log('Fetching NBA players for matching...');
  const { data: nbaPlayers, error: playersError } = await supabase
    .from('nba_players')
    .select('id, first_name, last_name, team_id, primary_position, jersey_number, photo_url');
    
  if (playersError) {
    console.error('Error fetching NBA players:', playersError);
    return;
  }
  
  console.log(`Found ${nbaPlayers.length} NBA players in database`);
  
  // Create a map of player names to player data for quick lookup
  const playerNameMap = new Map();
  nbaPlayers.forEach(player => {
    if (player.first_name && player.last_name) {
      // Create variations of the name for better matching
      const fullName = `${player.first_name} ${player.last_name}`.toLowerCase().trim();
      const reverseName = `${player.last_name}, ${player.first_name}`.toLowerCase().trim();
      const shortName = `${player.first_name[0]}. ${player.last_name}`.toLowerCase().trim();
      
      // Store the player under all variations
      playerNameMap.set(fullName, player);
      playerNameMap.set(reverseName, player);
      playerNameMap.set(shortName, player);
      
      // Also try without special characters for better matching
      const simpleName = fullName.replace(/[^a-z0-9 ]/g, '').trim();
      if (simpleName !== fullName) {
        playerNameMap.set(simpleName, player);
      }
    }
  });
  
  console.log(`Created lookup map with ${playerNameMap.size} player name variations`);
  
  // Log sample of first player's stats if available
  if (playerStats.length > 0) {
    const firstPlayer = playerStats[0];
    console.log('\nSample player stats from API (first player):');
    console.log(JSON.stringify({
      // Include all available keys from the player object
      player: firstPlayer.player || {},
      team: firstPlayer.team || {},
      stats: firstPlayer.stats || {},
      // Include all available keys to see what's in the response
      availableKeys: Object.keys(firstPlayer),
      // Include all properties from the first level
      allProperties: Object.entries(firstPlayer).reduce((acc, [key, value]) => {
        acc[key] = {
          type: typeof value,
          isArray: Array.isArray(value),
          value: value
        };
        return acc;
      }, {})
    }, null, 2));
    
    // If there are no stats, try to find any numeric values that might contain stats
    if (!firstPlayer.stats) {
      console.log('\nNo statistics found in the player object. Looking for stats in other fields...');
      const potentialStats = Object.entries(firstPlayer).filter(([key, value]) => {
        // Look for objects or numbers that might contain stats
        return (typeof value === 'object' && value !== null && !Array.isArray(value)) ||
               (typeof value === 'number' && key.toLowerCase().includes('stats'));
      });
      
      if (potentialStats.length > 0) {
        console.log('Potential stats found in these fields:');
        potentialStats.forEach(([key, value]) => {
          console.log(`- ${key}:`, JSON.stringify(value, null, 2));
        });
      } else {
        console.log('No potential stats fields found in the player object.');
      }
    }
  }
  
  // Process each player's stats
  const statsToInsert = [];
  let matchedPlayers = 0;
  let skippedPlayers = 0;
  let statsWithNoData = 0;
  
  for (const playerStat of playerStats) {
    try {
      // Extract player info
      const playerInfo = playerStat.player || {};
      const playerName = `${playerInfo.firstName || ''} ${playerInfo.lastName || ''}`.trim();
      const playerTeam = playerStat.team ? playerStat.team.abbreviation : 'UNK';
      
      // Log player data for debugging
      const playerData = {
        name: playerName,
        team: playerTeam,
        statsCount: 0,
        statsKeys: []
      };
      
      // Check if we have stats - look for stats in the 'stats' property
      const stats = playerStat.stats || playerStat.statistics || playerStat;
      
      if (stats && typeof stats === 'object') {
        // Get all numeric stats
        const numericStats = Object.entries(stats).filter(([_, value]) => 
          typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))
        );
        
        playerData.statsCount = numericStats.length;
        playerData.statsKeys = numericStats.map(([key]) => key);
        
        if (numericStats.length > 0) {
          // Add sample stats to the player data
          playerData.sampleStats = numericStats.slice(0, 5).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        }
      }
    }
    
    if (!playerData) {
      console.log(`  ❌ No match found for ${fullName}`);
      continue;
    }
    
    // Try different possible stat field names
    const statValue = (statNames) => {
      for (const name of statNames) {
        if (statistics[name] !== undefined) return statistics[name];
      }
      return 0;
    };
    
    const stats = {
      player_id: playerData.id,
      team_id: playerData.team_id || null,
      player_name: `${playerData.first_name} ${playerData.last_name}`.trim(),
      position: playerData.primary_position || null,
      jersey_number: playerData.jersey_number || null,
      photo_url: playerData.photo_url || null,
      season: SEASON,
      games_played: statValue(['gamesPlayed', 'games', 'gp']) || 0,
      minutes: Math.round((statValue(['minSeconds', 'minutes', 'min']) || 0) / 60 * 10) / 10,
      points: statValue(['points', 'pts', 'PTS']) || 0,
      assists: statValue(['assists', 'ast', 'AST']) || 0,
      rebounds: statValue(['rebounds', 'reb', 'REB']) || 0,
      offensive_rebounds: statValue(['offensiveRebounds', 'offReb', 'OREB']) || 0,
      defensive_rebounds: statValue(['defensiveRebounds', 'defReb', 'DREB']) || 0,
      steals: statValue(['steals', 'stl', 'STL']) || 0,
      blocks: statValue(['blocks', 'blk', 'BLK']) || 0,
      turnovers: statValue(['turnovers', 'tov', 'TOV']) || 0,
      personal_fouls: statValue(['personalFouls', 'fouls', 'PF']) || 0,
      field_goals_made: statValue(['fieldGoalsMade', 'fgm', 'FGM']) || 0,
      field_goals_attempted: statValue(['fieldGoalsAttempted', 'fga', 'FGA']) || 0,
      three_point_made: statValue(['threePointersMade', 'fg3m', 'FG3M']) || 0,
      three_point_attempted: statValue(['threePointersAttempted', 'fg3a', 'FG3A']) || 0,
      free_throws_made: statValue(['freeThrowsMade', 'ftm', 'FTM']) || 0,
      free_throws_attempted: statValue(['freeThrowsAttempted', 'fta', 'FTA']) || 0,
      plus_minus: statValue(['plusMinus', 'plusMinus', '+/-']) || 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    statsToInsert.push(stats);
    matchedPlayers++;
  }
  
  console.log(`\nProcessed ${playerStats.length} players:`);
  console.log(`- Matched: ${matchedPlayers}`);
  console.log(`- No stats data: ${statsWithNoData}`);
  console.log(`- Skipped (no stats): ${skippedPlayers}`);
  console.log(`- Failed to match: ${playerStats.length - matchedPlayers - skippedPlayers - statsWithNoData}`);
  
  // Log a sample of the stats we're trying to insert
  if (statsToInsert.length > 0) {
    console.log('\nSample of stats to be inserted:');
    console.table(statsToInsert.slice(0, 3).map(s => ({
      name: s.player_name,
      team: s.team_id,
      games: s.games_played,
      points: s.points,
      assists: s.assists,
      rebounds: s.rebounds
    })));
  }
  
  if (statsToInsert.length === 0) {
    console.log('No stats to insert');
    return;
  }
  
  console.log(`\nSample of stats to insert (first 5):`);
  console.table(statsToInsert.slice(0, 5).map(s => ({
    name: s.player_name,
    team: s.team_id,
    games: s.games_played,
    points: s.points,
    assists: s.assists,
    rebounds: s.rebounds
  })));
  
  // Process in batches to avoid hitting Supabase limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < statsToInsert.length; i += BATCH_SIZE) {
    const batch = statsToInsert.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(statsToInsert.length/BATCH_SIZE)} (${i+1}-${Math.min(i+BATCH_SIZE, statsToInsert.length)}/${statsToInsert.length})`);
    
    const { error: upsertError } = await supabase
      .from('nba_player_season_stats')
      .upsert(batch, { onConflict: 'player_id,season' });
      
    if (upsertError) {
      console.error(`Error upserting batch ${i/BATCH_SIZE + 1}:`, upsertError);
    } else {
      console.log(`✅ Successfully upserted batch ${i/BATCH_SIZE + 1}`);
    }
  }
  
  console.log('Player stats sync completed');
  
  // Verify the inserted data
  console.log('\nVerifying inserted data...');
  const { data: insertedStats, error: statsError } = await supabase
    .from('nba_player_season_stats')
    .select('*')
    .order('points', { ascending: false })
    .limit(5);
    
  if (statsError) {
    console.error('Error fetching inserted stats:', statsError);
  } else {
    console.log('\nTop 5 players by points:');
    console.table(insertedStats.map(p => ({
      name: p.player_name,
      team: p.team_id,
      games: p.games_played,
      points: p.points,
      assists: p.assists,
      rebounds: p.rebounds
    })));
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting NBA stats sync...');
  
  // Test Supabase connection first
  const isConnected = await testSupabaseConnection();
  if (!isConnected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Fetch and process player stats
  try {
    await fetchPlayerStats();
    console.log('\n✅ Stats sync completed successfully!');
  } catch (error) {
    console.error('❌ Error during stats sync:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

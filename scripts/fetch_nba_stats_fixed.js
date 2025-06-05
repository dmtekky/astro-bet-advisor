// Hardcoded Supabase configuration - will be overridden by environment variables
let SUPABASE_URL = 'https://awoxkynorbspcrrggbca.supabase.co';
let SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w';
let MY_SPORTS_FEEDS_API_KEY = '8844c949-54d6-4e72-ba93-203dfd';

// Override with environment variables if they exist
if (process.env.SUPABASE_URL) SUPABASE_URL = process.env.SUPABASE_URL;
if (process.env.SUPABASE_KEY) SUPABASE_KEY = process.env.SUPABASE_KEY;
if (process.env.MY_SPORTS_FEEDS_API_KEY) MY_SPORTS_FEEDS_API_KEY = process.env.MY_SPORTS_FEEDS_API_KEY;

// Import required modules
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to make API requests
async function makeApiRequest(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${MY_SPORTS_FEEDS_API_KEY}:MYSPORTSFEEDS`).toString('base64')
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error making API request:', error);
    throw error;
  }
}

// Main function to fetch and process NBA player stats
async function fetchAndProcessNBAPlayerStats() {
  try {
    console.log('Fetching NBA player stats...');
    
    // First, fetch all players to build a name map
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, first_name, last_name, team_id');
      
    if (playersError) {
      throw new Error(`Error fetching players: ${playersError.message}`);
    }
    
    console.log(`Fetched ${players.length} players from database`);
    
    // Build a map of player names to their IDs for easier lookup
    const playerNameMap = new Map();
    players.forEach(player => {
      if (player && player.first_name && player.last_name) {
        const fullName = `${player.first_name} ${player.last_name}`.toLowerCase().trim();
        playerNameMap.set(fullName, player);
        
        // Also add just the last name for fuzzy matching
        const lastName = player.last_name.toLowerCase().trim();
        if (!playerNameMap.has(lastName)) {
          playerNameMap.set(lastName, player);
        }
      }
    });
    
    // Fetch player stats from MySportsFeeds
    const statsUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nba/2024-2025-regular/player_stats_totals.json';
    const statsData = await makeApiRequest(statsUrl);
    
    if (!statsData || !statsData.playerStatsTotals) {
      throw new Error('No player stats data returned from API');
    }
    
    console.log(`Fetched ${statsData.playerStatsTotals.length} player stats from API`);
    
    // Process and save the stats
    await processAndSaveStats(statsData.playerStatsTotals, playerNameMap);
    
  } catch (error) {
    console.error('Error in fetchAndProcessNBAPlayerStats:', error);
    throw error;
  }
}

// Process and save player stats to the database
async function processAndSaveStats(playerStats, playerNameMap) {
  const statsToInsert = [];
  let matchedPlayers = 0;
  let statsWithNoData = 0;
  let failedMatches = 0;
  
  for (const playerStat of playerStats) {
    try {
      if (!playerStat || !playerStat.player || !playerStat.team) {
        console.log('Skipping invalid player data:', playerStat);
        failedMatches++;
        continue;
      }
      
      const playerName = playerStat.player.name || '';
      const playerTeam = playerStat.team.abbreviation || 'UNK';
      const stats = playerStat.stats || {};
      
      // Skip if no stats available
      if (!stats || Object.keys(stats).length === 0) {
        console.log(`No stats data for player: ${playerName} (${playerTeam})`);
        statsWithNoData++;
        continue;
      }
      
      // Find the player in our map
      const normalizedPlayerName = playerName.toLowerCase().trim();
      let playerData = playerNameMap.get(normalizedPlayerName);
      
      // If not found by full name, try to find by last name
      if (!playerData) {
        const lastName = playerName.split(' ').pop().toLowerCase();
        for (const [name, player] of playerNameMap.entries()) {
          if (name.endsWith(lastName)) {
            console.log(`Matched by last name: ${playerName} -> ${name}`);
            playerData = player;
            break;
          }
        }
      }
      
      if (playerData) {
        // Prepare the stats data for upsert
        const statsData = {
          player_id: playerData.id,
          player_name: playerName,
          team_abbreviation: playerTeam,
          games_played: stats.gamesPlayed || 0,
          minutes_played: stats.minutes || 0,
          points: stats.points || 0,
          total_rebounds: (stats.offensiveRebounds || 0) + (stats.defensiveRebounds || 0),
          assists: stats.assists || 0,
          steals: stats.steals || 0,
          blocks: stats.blocks || 0,
          turnovers: stats.turnovers || 0,
          field_goals_made: stats.fieldGoalsMade || 0,
          field_goals_attempted: stats.fieldGoalsAttempted || 0,
          three_point_made: stats.threePointFieldGoalsMade || 0,
          three_point_attempted: stats.threePointFieldGoalsAttempted || 0,
          free_throws_made: stats.freeThrowsMade || 0,
          free_throws_attempted: stats.freeThrowsAttempted || 0,
          offensive_rebounds: stats.offensiveRebounds || 0,
          defensive_rebounds: stats.defensiveRebounds || 0,
          personal_fouls: stats.personalFouls || 0,
          plus_minus: stats.plusMinus || 0,
          games_started: stats.gamesStarted || 0,
          field_goal_pct: stats.fieldGoalPercentage || 0,
          three_point_pct: stats.threePointPercentage || 0,
          free_throw_pct: stats.freeThrowPercentage || 0,
          raw_stats: stats,
          updated_at: new Date().toISOString(),
          season: '2024-25',
          team_id: playerData.team_id || null
        };
        
        statsToInsert.push(statsData);
        matchedPlayers++;
        
        // Log progress
        if (matchedPlayers % 10 === 0) {
          console.log(`Processed ${matchedPlayers} players...`);
        }
      } else {
        console.log(`No match found for player: ${playerName} (${playerTeam})`);
        failedMatches++;
      }
    } catch (error) {
      console.error(`Error processing player ${playerName}:`, error);
      failedMatches++;
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
      throw error;
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

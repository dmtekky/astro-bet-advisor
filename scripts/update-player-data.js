// Use require for better compatibility with Vercel
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const msfApiKey = process.env.MSF_API_KEY;

if (!supabaseUrl || !supabaseKey || !msfApiKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch player data from MySportsFeeds API
async function fetchPlayerData() {
  console.log('Fetching player data from MySportsFeeds...');
  
  const url = 'https://api.mysportsfeeds.com/v2.1/pull/mlb/players.json';
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(msfApiKey + ':MYSPORTSFEEDS').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.players || [];
    
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
}

// Update player data in Supabase
async function updatePlayerRecords(players) {
  console.log(`Updating ${players.length} players in the database...`);
  
  const updates = players.map(player => {
    const stats = player.player?.currentRosterStatus?.latestStats || {};
    
    return {
      player_id: player.player.id,
      player_full_name: player.player.firstName + ' ' + player.player.lastName,
      player_position: player.player.primaryPosition,
      player_team: player.team?.abbreviation || null,
      stats_batting_hits: stats.batting?.hits || 0,
      stats_batting_runs: stats.batting?.runs || 0,
      stats_batting_homeruns: stats.batting?.homeRuns || 0,
      stats_batting_runs_batted_in: stats.batting?.runsBattedIn || 0,
      stats_fielding_assists: stats.fielding?.assists || 0,
      stats_fielding_put_outs: stats.fielding?.putOuts || 0,
      stats_pitching_earned_run_avg: stats.pitching?.earnedRunAverage || 0,
      stats_games_played: stats.gamesPlayed || 0,
      updated_at: new Date().toISOString()
    };
  });
  
  // Update in batches to avoid overwhelming the database
  const batchSize = 100;
  let successCount = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('baseball_players')
      .upsert(batch, { onConflict: 'player_id' });
      
    if (error) {
      console.error(`Error updating batch ${i / batchSize + 1}:`, error);
    } else {
      successCount += batch.length;
      console.log(`Updated batch ${i / batchSize + 1}/${Math.ceil(updates.length / batchSize)}: ${successCount}/${updates.length} players`);
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return successCount;
}

// Main function
export async function updatePlayerData() {
  try {
    // Step 1: Fetch latest player data from MySportsFeeds
    const players = await fetchPlayerData();
    console.log(`Fetched data for ${players.length} players`);
    
    // Step 2: Update the database
    const updatedCount = await updatePlayerRecords(players);
    
    console.log(`✅ Successfully updated ${updatedCount} player records`);
    return { success: true, updatedCount };
    
  } catch (error) {
    console.error('❌ Error in updatePlayerData:', error);
    return { success: false, error: error.message };
  }
}

// Export the update function for use in other modules
module.exports = { updatePlayerData };

// Run the update if this file is executed directly
if (require.main === module) {
  updatePlayerData()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

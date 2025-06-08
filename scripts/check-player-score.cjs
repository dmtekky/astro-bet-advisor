// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to check a player's score
async function checkPlayerScore(playerId) {
  try {
    console.log(`Fetching player with ID: ${playerId}`);
    
    // Fetch the player data
    const { data: player, error } = await supabase
      .from('baseball_players')
      .select('player_id, player_first_name, player_last_name, player_birth_date, astro_influence_score, updated_at')
      .eq('player_id', playerId)
      .single();

    if (error) {
      console.error('❌ Error fetching player:', error);
      return;
    }

    if (!player) {
      console.error(`❌ No player found with ID: ${playerId}`);
      return;
    }

    const playerName = `${player.player_first_name} ${player.player_last_name}`.trim();
    console.log('\n📊 Player Details:');
    console.log(`Name: ${playerName}`);
    console.log(`ID: ${player.player_id}`);
    console.log(`Birth Date: ${player.player_birth_date}`);
    console.log(`Astro Score: ${player.astro_influence_score || 'Not set'}`);
    console.log(`Last Updated: ${player.updated_at || 'Never'}`);
    
  } catch (error) {
    console.error('❌ Error checking player score:', error);
  }
}

// Get player ID from command line arguments or use a default
const playerId = process.argv[2] || 1; // Default to player ID 1 if none provided

// Run the check
checkPlayerScore(playerId);

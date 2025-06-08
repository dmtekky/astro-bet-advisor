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
    
    const { data: player, error } = await supabase
      .from('baseball_players')
      .select('*')
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

    console.log('\n📊 Player Details:');
    console.log(`Name: ${player.player_first_name} ${player.player_last_name}`);
    console.log(`Birth Date: ${player.player_birth_date}`);
    console.log(`Astro Influence Score: ${player.astro_influence_score}`);
    console.log(`Last Updated: ${player.updated_at}`);
    
  } catch (error) {
    console.error('❌ Error checking player:', error);
  }
}

// Get player ID from command line arguments or use a default
const playerId = process.argv[2] || 1; // Default to player ID 1 if none provided

// Run the check
checkPlayerScore(playerId);

// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Import our custom astro score export
const { calculateAstroInfluenceScore } = require('./astroScoreExport.cjs');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to update a single player's score
async function updatePlayerScore(playerId) {
  try {
    console.log(`Fetching player with ID: ${playerId}`);
    
    // Fetch the player data
    const { data: player, error: fetchError } = await supabase
      .from('baseball_players')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching player:', fetchError);
      return;
    }

    if (!player) {
      console.error(`❌ No player found with ID: ${playerId}`);
      return;
    }

    const playerName = `${player.player_first_name} ${player.player_last_name}`.trim();
    console.log(`\n🔍 Processing ${playerName} (${player.player_id}) - ${player.player_birth_date}`);
    
    // Calculate astro score
    const astroScore = await calculateAstroInfluenceScore(
      {
        player_id: player.player_id,
        player_first_name: player.player_first_name,
        player_last_name: player.player_last_name,
        player_birth_date: player.player_birth_date
      },
      new Date().toISOString().split('T')[0]
    );

    console.log(`✨ Calculated score: ${astroScore}`);

    // Update the player record
    const { data, error } = await supabase
      .from('baseball_players')
      .update({
        astro_influence_score: astroScore,
        updated_at: new Date().toISOString()
      })
      .eq('player_id', player.player_id)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Updated ${playerName} with score ${astroScore}`);
    console.log('Updated player data:', data);
    
  } catch (error) {
    console.error('❌ Error updating player:', error);
  }
}

// Get player ID from command line arguments or use a default
const playerId = process.argv[2] || 1; // Default to player ID 1 if none provided

// Run the update
updatePlayerScore(playerId);

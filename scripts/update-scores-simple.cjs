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

// Simple test function to verify the astro score calculation
async function testAstroScore() {
  console.log('Testing astro score calculation...');
  
  // Test with a sample player
  const testPlayer = {
    player_id: 12345,
    player_first_name: 'Test',
    player_last_name: 'Player',
    player_birth_date: '1990-01-01'
  };
  
  try {
    const score = await calculateAstroInfluenceScore(testPlayer, '2025-06-07');
    console.log(`✅ Test score for ${testPlayer.player_first_name} ${testPlayer.player_last_name}:`, score);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Main function to update all player scores
async function updateAllPlayerScores() {
  console.log('🚀 Starting player score updates...');
  
  // First, test the astro score calculation
  const testPassed = await testAstroScore();
  if (!testPassed) {
    console.error('❌ Aborting due to test failure');
    return;
  }
  
  try {
    // Fetch all players with birth dates
    const { data: players, error: fetchError } = await supabase
      .from('baseball_players')
      .select('player_id, player_first_name, player_last_name, player_birth_date')
      .not('player_birth_date', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching players:', fetchError);
      return;
    }

    console.log(`📊 Found ${players.length} players with birth dates`);

    // Process players in batches
    const batchSize = 10; // Smaller batch size for testing
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < Math.min(10, players.length); i++) { // Limit to first 10 for testing
      const player = players[i];
      const playerName = `${player.player_first_name} ${player.player_last_name}`.trim();
      
      try {
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
          .eq('player_id', player.player_id);

        if (error) {
          throw error;
        }

        console.log(`✅ Updated ${playerName} with score ${astroScore}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating player ${playerName} (${player.player_id}):`, error.message);
        errorCount++;
      }
      
      // Add a small delay between updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Update complete!');
    console.log(`✅ Successfully updated: ${updatedCount} players`);
    console.log(`❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the update
updateAllPlayerScores();

// @ts-check
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import our custom astro score export
const { calculateAstroInfluenceScore } = require('./astroScoreExport.cjs');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to update all player scores
async function updateAllPlayerScores() {
  console.log('🚀 Starting player score updates...');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  try {
    // First, test the astro score calculation with a test player
    const testScore = await testAstroScore();
    if (!testScore) {
      console.error('❌ Aborting due to test failure');
      return;
    }
    
    // Fetch all players with birth dates
    console.log('Fetching players with birth dates...');
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
    const batchSize = 20; // Smaller batch size to avoid timeouts
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const playerName = `${player.player_first_name} ${player.player_last_name}`.trim();
      
      try {
        console.log(`\n🔍 Processing [${i+1}/${players.length}] ${playerName} (${player.player_id}) - ${player.player_birth_date}`);
        
        try {
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

          // Update the player record directly
          const { error: updateError } = await supabase
            .from('baseball_players')
            .update({
              astro_influence_score: astroScore,
              updated_at: new Date().toISOString()
            })
            .eq('player_id', player.player_id);

          if (updateError) {
            throw updateError;
          }

          console.log(`✅ Updated player ${player.player_id} with score ${astroScore}`);
          updatedCount++;
          
        } catch (error) {
          console.error(`❌ Error updating player ${player.player_id}:`, error.message);
          errorCount++;
        }
        
        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`✅ Updated ${playerName} with score ${astroScore}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing player ${playerName} (${player.player_id}):`, error.message);
        errorCount++;
      }
      
      // Add a small delay between updates
      if (i < players.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('\n🎉 Update complete!');
    console.log(`✅ Successfully updated: ${updatedCount} players`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some players were not updated. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Test function to verify astro score calculation
async function testAstroScore() {
  console.log('\n🧪 Testing astro score calculation...');
  
  // Test with a sample player
  const testPlayer = {
    player_id: 1,
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

// Run the update
updateAllPlayerScores();

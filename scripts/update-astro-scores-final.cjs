// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

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
  
  try {
    // First, test the astro score calculation with a test player
    const testScore = await testAstroScore();
    if (!testScore) {
      console.error('❌ Aborting due to test failure');
      return;
    }
    
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
    const batchSize = 50;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      const updates = [];

      // Process each player in the current batch
      for (const player of batch) {
        try {
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

          updates.push({
            player_id: player.player_id,
            astro_influence_score: astroScore,
            updated_at: new Date().toISOString()
          });
        } catch (error) {
          console.error(`❌ Error processing player ${player.player_id}:`, error.message);
          errorCount++;
        }
      }

      // Update players in the current batch one by one to ensure reliable updates
      if (updates.length > 0) {
        for (const update of updates) {
          try {
            const { error } = await supabase
              .from('baseball_players')
              .update({
                astro_influence_score: update.astro_influence_score,
                updated_at: update.updated_at
              })
              .eq('player_id', update.player_id);

            if (error) {
              console.error(`❌ Error updating player ${update.player_id}:`, error);
              errorCount++;
            } else {
              console.log(`✅ Updated player ${update.player_id} with score ${update.astro_influence_score}`);
              updatedCount++;
            }
          } catch (error) {
            console.error(`❌ Exception updating player ${update.player_id}:`, error);
            errorCount++;
          }
          
          // Small delay between updates to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      }

      // Add a small delay between batches
      if (i + batchSize < players.length) {
        console.log(`\n⏳ Pausing between batches...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
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
  console.log('Testing astro score calculation...');
  
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

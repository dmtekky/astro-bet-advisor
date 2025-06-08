// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { calculateAstroInfluenceScore } = require('./astroScore_2025-06-07.cjs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function updatePlayerScores() {
  console.log('🚀 Starting player score updates...');
  
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

      // Update players in the current batch
      if (updates.length > 0) {
        try {
          const { data, error } = await supabase
            .from('baseball_players')
            .upsert(updates, { onConflict: 'player_id' });

          if (error) {
            console.error('❌ Error updating players:', error);
            errorCount += updates.length;
          } else {
            console.log(`✅ Updated ${updates.length} players`);
            updatedCount += updates.length;
          }
        } catch (error) {
          console.error('❌ Exception during batch update:', error);
          errorCount += updates.length;
        }
      }

      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Update complete!');
    console.log(`✅ Successfully updated: ${updatedCount} players`);
    console.log(`❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the update
updatePlayerScores();

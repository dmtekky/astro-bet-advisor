// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to check if scores were updated
async function verifyScores() {
  try {
    console.log('Verifying updated scores...');
    
    // Get a few random players to check
    const { data: players, error } = await supabase
      .from('baseball_players')
      .select('player_id, player_first_name, player_last_name, astro_influence_score, updated_at')
      .not('astro_influence_score', 'is', null)
      .limit(5);

    if (error) {
      console.error('❌ Error fetching players:', error);
      return;
    }

    if (!players || players.length === 0) {
      console.log('No players with astro scores found');
      return;
    }

    console.log('\n📊 Players with updated astro scores:');
    players.forEach(player => {
      console.log(`- ${player.player_first_name} ${player.player_last_name} (ID: ${player.player_id}): ${player.astro_influence_score} (Updated: ${player.updated_at})`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying scores:', error);
  }
}

// Run the verification
verifyScores();

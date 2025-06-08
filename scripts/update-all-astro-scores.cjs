// @ts-check
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { execSync } = require('child_process'); // For running histogram script

// Load environment variables in non-Vercel environments
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

// Import the main function from the astro score calculation module
const { main: calculateAllAstroScores } = require('./astroScore_2025-06-07.cjs');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = '❌ Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set';
  console.error(errorMsg);
  if (isVercel) {
    // In Vercel, we need to throw an error that will be caught by the API handler
    throw new Error(errorMsg);
  } else {
    process.exit(1);
  }
}

console.log('Initializing Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Function to update all player scores
async function updateAllPlayerScores() {
  console.log('🚀 Starting player score updates...');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  try {
    // Fetch all players with birth dates
    console.log('\n🔍 Fetching all players with birth dates...');
    const { data: players, error: fetchError } = await supabase
      .from('baseball_players')
      .select('player_id, player_first_name, player_last_name, player_birth_date')
      .not('player_birth_date', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching players:', fetchError);
      return;
    }

    console.log(`📊 Found ${players.length} players with birth dates`);

    // Prepare players for the astro score calculation module
    const mappedPlayers = players.map(p => ({
      player_id: p.player_id,
      name: `${p.player_first_name || ''} ${p.player_last_name || ''}`.trim(),
      birth_date: p.player_birth_date,
      // Pass original fields too, in case astroScore_2025-06-07.cjs uses them internally, though 'name' and 'birth_date' are primary for its logic now
      player_first_name: p.player_first_name,
      player_last_name: p.player_last_name
    }));

    console.log(`
🌠 Calculating astro scores for all ${mappedPlayers.length} players...`);
    const playerScores = await calculateAllAstroScores(mappedPlayers, new Date());

    if (!playerScores || playerScores.length === 0) {
      console.error('❌ No scores were returned from the calculation module.');
      return;
    }

    console.log(`
💾 Updating ${playerScores.length} players in Supabase...`);
    for (let i = 0; i < playerScores.length; i++) {
      const scoreData = playerScores[i];
      // Find original player data to get name for logging, if needed, or use scoreData.player_id
      const originalPlayer = players.find(p => String(p.player_id) === String(scoreData.player_id));
      const playerNameForLog = originalPlayer ? `${originalPlayer.player_first_name} ${originalPlayer.player_last_name}`.trim() : `ID ${scoreData.player_id}`;

      try {
        console.log(`🔄 Updating [${i+1}/${playerScores.length}] player ${playerNameForLog} (${scoreData.player_id}) with score ${scoreData.astro_influence_score}`);
        const { error: updateError } = await supabase
          .from('baseball_players')
          .update({
            astro_influence_score: scoreData.astro_influence_score,
            updated_at: new Date().toISOString()
          })
          .eq('player_id', scoreData.player_id);

        if (updateError) {
          throw updateError;
        }
        updatedCount++;
        console.log(`✅ Updated ${playerNameForLog}`);

      } catch (error) {
        console.error(`❌ Error updating player ${playerNameForLog} (${scoreData.player_id}):`, error.message);
        errorCount++;
      }
      // Optional: Add a small delay between Supabase updates if rate limiting is a concern
      if (i < playerScores.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay as it's just DB updates now
      }
    }

    console.log('\n🎉 Update complete!');
    console.log(`✅ Successfully updated: ${updatedCount} players`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some players were not updated. Check the logs above for details.');
    }

    // Run histogram script
    console.log('\n📊 Running histogramAstroScores.cjs...');
    try {
      const histogramOutput = execSync('node scripts/histogramAstroScores.cjs', { encoding: 'utf-8', stdio: 'inherit' });
      console.log('✅ histogramAstroScores.cjs executed successfully.');
    } catch (histError) {
      console.error('❌ Error running histogramAstroScores.cjs:', histError.message);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateAllPlayerScores().catch(error => {
    console.error('❌ Error in updateAllPlayerScores:', error);
    process.exit(1);
  });
}

// Export the function for use in API routes
module.exports = { updateAllPlayerScores };

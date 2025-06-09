// NBA Player Astro Score Update Script
console.log('NBA Astro Score Update Script Initialized');

const { createClient } = require('@supabase/supabase-js');
const { calculateAstroInfluenceScore } = require('./astroScore_2025-06-07.cjs');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 25;

async function fetchPlayers() {
  // Fetch all NBA players with birth dates
  let { data: players, error } = await supabase
    .from('nba_players')
    .select('id, first_name, last_name, birth_date, astro_influence')
    .not('birth_date', 'is', null);
  
  if (error) throw error;
  return players || [];
}

async function updatePlayerAstroScores(players) {
  const now = new Date();
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);
    const batchUpdates = [];
    
    // First pass: Calculate all astro scores
    for (const player of batch) {
      try {
        const playerData = {
          ...player,
          player_first_name: player.first_name,
          player_last_name: player.last_name,
          player_birth_date: player.birth_date,
        };

        const astroScore = await calculateAstroInfluenceScore(playerData, now);
        
        if (player.astro_influence !== astroScore) {
          batchUpdates.push({
            id: player.id,
            astro_influence: astroScore,
            updated_at: new Date().toISOString()
          });
          console.log(`[${updated + 1}] ${player.first_name || ''} ${player.last_name || ''} (ID: ${player.id}) astro_influence: ${astroScore}`);
          updated++;
        }
      } catch (err) {
        console.error(`Failed to calculate astro score for player ID ${player.id}:`, err);
        failed++;
      }
    }

    // Second pass: Update database
    for (const update of batchUpdates) {
      const player = players.find(p => p.id === update.id);
      if (!player) {
        console.warn(`⚠️ Could not find player with ID ${update.id} in current batch`);
        continue;
      }
      
      const playerUpdate = {
        astro_influence: update.astro_influence,
        updated_at: update.updated_at
      };

      try {
        // Update nba_players table
        const { error: playerError } = await supabase
          .from('nba_players')
          .update(playerUpdate)
          .eq('id', update.id);
        
        if (playerError) throw playerError;
        
        // Try to update nba_player_season_stats_2025
        await updatePlayerSeasonStats(player, playerUpdate);
        
        console.log(`✅ Updated astro scores for player ID ${update.id} in both tables`);
      } catch (err) {
        console.error(`❌ Failed to update player ID ${update.id}:`, err.message);
        failed++;
      }
    }
  }

  return { updated, failed };
}

async function updatePlayerSeasonStats(player, update) {
  try {
    // Convert player.id to string to match msf_player_id type
    const playerIdStr = player.id.toString();
    
    // Find the stats record using msf_player_id
    const { data: stats, error: findError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('id, player_id, msf_player_id')
      .eq('msf_player_id', playerIdStr)
      .maybeSingle();
      
    if (findError) throw findError;
    
    if (!stats) {
      console.warn(`⚠️ No stats record found for ${player.first_name} ${player.last_name} (ID: ${player.id})`);
      return false;
    }
    
    // Update the stats record
    const { error: updateError } = await supabase
      .from('nba_player_season_stats_2025')
      .update({
        astro_influence: update.astro_influence,
        updated_at: update.updated_at
      })
      .eq('id', stats.id);
      
    if (updateError) throw updateError;
    
    console.log(`✅ Updated stats for ${player.first_name} ${player.last_name} (ID: ${player.id})`);
    console.log(`   - Stats ID: ${stats.id}, Player ID: ${stats.player_id}, MSF ID: ${stats.msf_player_id}`);
    return true;
    
  } catch (err) {
    console.warn(`⚠️ Error updating stats for player ID ${player.id}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Fetching NBA players with birth dates...');
  const players = await fetchPlayers();
  
  if (!players || players.length === 0) {
    console.log('ℹ️  No NBA players with birth dates found.');
    return;
  }
  
  console.log(`📊 Found ${players.length} NBA players with birth dates.`);
  console.log('⏳ Calculating astro scores...');
  
  const { updated, failed } = await updatePlayerAstroScores(players);
  
  console.log('\n🎉 Update complete!');
  console.log(`✅ Updated: ${updated} players`);
  if (failed > 0) {
    console.warn(`❌ Failed: ${failed} players`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { calculateAstrologicalInfluence } from '../src/lib/astroCalc.ts';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePlayerScores() {
  const startTime = new Date();
  console.log(`🚀 Starting player score update at ${startTime.toISOString()}`);

  try {
    // Fetch all players with stats (in batches of 1000)
    console.log('Fetching players with stats...');
    let allPlayers: any[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: players, error } = await supabase
        .from('baseball_players')
        .select('*')
        .order('player_id')
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('❌ Error fetching players:', error);
        return false;
      }

      if (players && players.length > 0) {
        allPlayers = [...allPlayers, ...players];
        console.log(`   Fetched ${allPlayers.length} players so far...`);
        offset += batchSize;
      } else {
        hasMore = false;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (allPlayers.length === 0) {
      console.log('⚠️  No players found in the database');
      return false;
    }

    console.log(`✅ Found ${allPlayers.length} players to process`);

    // Process players in batches
    const batchSizeProcess = 50;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allPlayers.length; i += batchSizeProcess) {
      const batch = allPlayers.slice(i, i + batchSizeProcess);
      const updates: any[] = [];

      for (const player of batch) {
        let astroScore = 0;
        try {
          // Use the main astro calculation (async)
          const astroResult = await calculateAstrologicalInfluence(player);
          astroScore = astroResult.score;
        } catch (e) {
          console.error(`[ASTRO ERROR] Failed to calculate for player ${player.player_id}:`, e);
          astroScore = 0;
        }
        // Keep the impact score logic as before
        let impactScore = 0;
        if (player.stats_batting_hits || player.stats_batting_runs || player.stats_batting_homeruns || player.stats_batting_runs_batted_in) {
          impactScore += (player.stats_batting_hits || 0) * 0.5;
          impactScore += (player.stats_batting_runs || 0) * 0.75;
          impactScore += (player.stats_batting_homeruns || 0) * 1.5;
          impactScore += (player.stats_batting_runs_batted_in || 0) * 0.5;
        }
        if (player.stats_fielding_assists) impactScore += player.stats_fielding_assists * 0.3;
        if (player.stats_fielding_put_outs) impactScore += player.stats_fielding_put_outs * 0.2;
        if (player.stats_pitching_earned_run_avg) impactScore -= player.stats_pitching_earned_run_avg * 0.5;
        impactScore = Math.min(100, Math.max(0, impactScore));
        impactScore = Math.round(impactScore);

        // DEBUG: Log astroScore for every player
        if (!astroScore || astroScore === null || astroScore === undefined || isNaN(astroScore)) {
          console.error('[ASTRO DEBUG] Falsy or invalid astroScore before upsert:', {
            player_id: player.player_id,
            player_birth_date: player.player_birth_date,
            astroScore
          });
        } else {
          console.log('[ASTRO DEBUG] Upserting astroScore:', {
            player_id: player.player_id,
            player_birth_date: player.player_birth_date,
            astroScore
          });
        }
        updates.push({
          player_id: player.player_id,
          impact_score: impactScore,
          astro_influence_score: astroScore,
          updated_at: new Date().toISOString()
        });
      }

      if (updates.length > 0) {
        const { data, error } = await supabase
          .from('baseball_players')
          .upsert(updates, { onConflict: 'player_id' });

        if (error) {
          console.error(`❌ Error updating batch ${i / batchSizeProcess + 1}:`, error);
          errorCount += updates.length;
        } else {
          updatedCount += updates.length;
          console.log(`   Updated ${updates.length} players (${updatedCount} total)`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`\n🎉 Player score update completed!`);
    console.log(`   Total players processed: ${allPlayers.length}`);
    console.log(`   Players updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);
    console.log(`   Finished at: ${endTime.toISOString()}`);
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

updatePlayerScores()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });

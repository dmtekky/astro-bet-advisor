#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Calculate impact score based on player stats
function calculateImpactScore(player) {
  if (!player) return 0;
  let score = 0;
  
  // Batting stats (weighted)
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.5;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.75;
  if (player.stats_batting_homeruns) score += player.stats_batting_homeruns * 1.5;
  if (player.stats_batting_runs_batted_in) score += player.stats_batting_runs_batted_in * 0.5;
  
  // Fielding stats (weighted)
  if (player.stats_fielding_assists) score += player.stats_fielding_assists * 0.3;
  if (player.stats_fielding_put_outs) score += player.stats_fielding_put_outs * 0.2;
  
  // Pitching stats (weighted, but negative for impact score)
  if (player.stats_pitching_earned_run_avg) score -= player.stats_pitching_earned_run_avg * 0.5;
  
  // Normalize score to 0-100 range
  score = Math.min(100, Math.max(0, score));
  return Math.round(score);
}

// Calculate astro influence score
function calculateAstroInfluenceScore(player) {
  if (!player) return 0;
  
  // Base score from player stats (similar to impact score but with different weights)
  let score = 0;
  
  // Batting stats (different weights for astro influence)
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.4;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.6;
  if (player.stats_batting_homeruns) score += player.stats_batting_homeruns * 2.0;
  
  // Recent performance boost (based on games played)
  const recentGames = player.stats_games_played || 0;
  if (recentGames > 0) {
    score *= (1 + Math.min(recentGames / 20, 0.5)); // Up to 50% boost for active players
  }
  
  // Random factor to simulate astrological influence (0.8 to 1.2)
  const randomFactor = 0.8 + Math.random() * 0.4;
  score *= randomFactor;
  
  // Normalize to 0-100 range
  score = Math.min(100, Math.max(0, score));
  return parseFloat(score.toFixed(2));
}

async function updatePlayerScores() {
  const startTime = new Date();
  console.log(`🚀 Starting player score update at ${startTime.toISOString()}`);
  
  try {
    // Fetch all players with stats (in batches of 1000)
    console.log('Fetching players with stats...');
    let allPlayers = [];
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
      
      // Small delay to avoid rate limiting
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
      const updates = [];
      
      // Prepare batch updates
      for (const player of batch) {
        const impactScore = calculateImpactScore(player);
        const astroScore = calculateAstroInfluenceScore(player);
        
        // Only update if scores have changed or are not set
        if (player.impact_score !== impactScore || 
            player.astro_influence_score === null || 
            player.astro_influence_score === undefined) {
              
          updates.push({
            player_id: player.player_id,
            impact_score: impactScore,
            astro_influence_score: astroScore,
            updated_at: new Date().toISOString()
          });
        }
      }
      
      // Process batch updates
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
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
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

// Run the update
updatePlayerScores()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });

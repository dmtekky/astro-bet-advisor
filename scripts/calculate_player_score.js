import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
  { auth: { persistSession: false } }
);

// Function to calculate impact score (copied from sync_nba_astro_scores_fixed.js)
function calculateImpactScore(stats) {
  if (!stats) return 0;

  // Define weights for each stat category (positive impact)
  const positiveWeights = {
    points: 0.25,
    field_goal_pct: 0.15,
    three_point_pct: 0.10,
    free_throw_pct: 0.02,
    assists: 0.15,
    total_rebounds: 0.10,
    offensive_rebounds: 0.02,
    defensive_rebounds: 0.02,
    steals: 0.05,
    blocks: 0.05,
    plus_minus: 0.35,
    minutes_played: 0.01,
    games_played: 0.001,
    games_started: 0.001
  };

  // Define negative impact stats
  const negativeWeights = {
    turnovers: -0.03,
    personal_fouls: -0.01,
    field_goals_attempted: -0.002,
    three_point_attempted: -0.002,
    free_throws_attempted: -0.001
  };

  // Plus/Minus normalization with stronger impact
  const normalizePlusMinus = (value) => {
    if (value === undefined || value === null) return 0.5;
    if (value >= 0) return 0.5 + (Math.min(value, 20) / 40);
    else return 0.5 + (Math.max(value, -20) / 40);
  };

  // Calculate positive impact
  let positiveScore = 0;
  for (const [stat, weight] of Object.entries(positiveWeights)) {
    if (stats[stat] !== undefined && stats[stat] !== null) {
      // Special handling for percentages
      if (stat.endsWith('_pct')) {
        positiveScore += (stats[stat] / 100) * weight;
      } else if (stat === 'plus_minus') {
        positiveScore += normalizePlusMinus(stats[stat]) * weight;
      } else {
        positiveScore += (stats[stat] / 100) * weight; // Normalize other stats
      }
    }
  }

  // Calculate negative impact
  let negativeScore = 0;
  for (const [stat, weight] of Object.entries(negativeWeights)) {
    if (stats[stat] !== undefined && stats[stat] !== null) {
      negativeScore += (stats[stat] / 100) * Math.abs(weight);
    }
  }

  // Combine scores (positive - negative)
  let finalScore = (positiveScore - negativeScore) * 100;

  // Apply efficiency multipliers
  if (stats.field_goal_pct) finalScore *= (0.9 + (stats.field_goal_pct / 100 * 0.1));
  if (stats.three_point_pct) finalScore *= (0.9 + (stats.three_point_pct / 100 * 0.1));
  if (stats.free_throw_pct) finalScore *= (0.95 + (stats.free_throw_pct / 100 * 0.05));
  
  // Apply plus/minus as a major adjustment with stronger negative impact
  if (stats.plus_minus !== undefined) {
    const pmValue = stats.plus_minus;
    if (pmValue >= 0) {
      // For positive plus/minus, apply a moderate boost
      const pmBoost = Math.min(1, pmValue / 15) * 0.2; // Max 20% boost
      finalScore = finalScore * (0.9 + pmBoost);
    } else {
      // For negative plus/minus, apply a stronger penalty
      const pmPenalty = Math.min(1, Math.abs(pmValue) / 10) * 0.5; // Up to 50% penalty
      finalScore = finalScore * (1 - pmPenalty);
    }
  }

  // Ensure score is within bounds
  return Math.max(0, Math.min(100, finalScore));
}

// Fetch and calculate score for player ID 1302
async function getPlayerScore(playerId) {
  try {
    const { data: player, error } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error) throw error;
    if (!player) {
      console.log(`Player with ID ${playerId} not found`);
      return;
    }

    const score = calculateImpactScore(player);
    console.log(`Player: ${player.player_name}`);
    console.log(`Current Impact Score: ${player.impact_score || 'N/A'}`);
    console.log(`New Calculated Score: ${score.toFixed(2)}`);
    console.log('Key Stats:', {
      points: player.points,
      plus_minus: player.plus_minus,
      fg_pct: player.field_goal_pct,
      ast: player.assists,
      reb: player.total_rebounds,
      stl: player.steals,
      blk: player.blocks,
      tov: player.turnovers
    });

    return score;
  } catch (error) {
    console.error('Error fetching player:', error);
  }
}

// Run with player ID 1302
getPlayerScore(1302).then(() => process.exit(0));

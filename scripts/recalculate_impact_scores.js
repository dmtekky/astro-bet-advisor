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
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase with URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set');

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  { 
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);

/**
 * Calculates impact score based on player stats
 * @param {Object} stats - Player statistics
 * @returns {number} Impact score (0-100)
 */
function calculateImpactScore(stats) {
  if (!stats) return 0;

  // Define weights for each stat category (positive impact)
  const positiveWeights = {
    // OFFENSIVE STATS - Points emphasized even more
    points: 0.40,              // Increased from 0.35
    field_goal_pct: 0.05,      // Same
    three_point_pct: 0.03,     // Same
    free_throw_pct: 0.01,      // Same
    assists: 0.18,             // Same
    offensive_rebounds: 0.05,  // Same
    
    // Secondary offensive/overall
    total_rebounds: 0.01,      // Same
    minutes_played: 0.05,      // Increased from 0.04
    games_started: 0.03,       // Increased from 0.02
    
    // DEFENSIVE STATS - Reduced by 3% total
    defensive_rebounds: 0.01,  // Reduced from 0.02
    steals: 0.05,              // Reduced from 0.06
    blocks: 0.05,              // Reduced from 0.06
    plus_minus: 0.03,          // Same
    
    // Games played (raised further)
    games_played: 0.05         // Increased from 0.04
  };

  // Define negative impact stats (reduced penalties)
  const negativeWeights = {
    turnovers: -0.015,         // Reduced from -0.03
    personal_fouls: -0.005,    // Reduced from -0.01
    // Removed shot attempt penalties
  };

  // Normalization factors (per game basis)
  const maxValues = {
    points: 40,
    assists: 15,
    total_rebounds: 20,
    offensive_rebounds: 10,
    defensive_rebounds: 15,
    steals: 4,
    blocks: 5,
    turnovers: 8,
    personal_fouls: 6,
    field_goals_attempted: 30,
    three_point_attempted: 15,
    free_throws_attempted: 15,
    minutes_played: 48,
    games_played: 82,
    games_started: 82,
    plus_minus: 30 // Max expected plus/minus for normalization
  };

  // Calculate positive impact (without plus/minus for now)
  let positiveScore = 0;
  let totalPositiveWeight = 0;
  let plusMinusValue = 0;

  for (const [stat, weight] of Object.entries(positiveWeights)) {
    if (stats[stat] !== undefined) {
      if (stat === 'plus_minus') {
        plusMinusValue = stats[stat]; // Store for later use
      } else {
        const normalizedValue = stats[stat] / (maxValues[stat] || 1);
        positiveScore += normalizedValue * weight;
        totalPositiveWeight += weight;
      }
    }
  }

  // Calculate negative impact (reduced weight)
  let negativeScore = 0;
  let totalNegativeWeight = 0;

  for (const [stat, weight] of Object.entries(negativeWeights)) {
    if (stats[stat] !== undefined) {
      const normalizedValue = stats[stat] / (maxValues[stat] || 1);
      negativeScore += normalizedValue * Math.abs(weight);
      totalNegativeWeight += Math.abs(weight);
    }
  }

  // Calculate base score from positive and negative contributions
  const positiveContribution = positiveScore / Math.max(1, totalPositiveWeight);
  const negativeContribution = negativeScore / Math.max(1, totalNegativeWeight);
  
  // Combine with 70/30 weighting in favor of positive impact
  let finalScore = (positiveContribution * 0.7) + (negativeContribution * 0.3);
  
  // Apply efficiency multipliers
  if (stats.field_goal_pct) finalScore *= (0.9 + (stats.field_goal_pct / 100 * 0.1));
  if (stats.three_point_pct) finalScore *= (0.9 + (stats.three_point_pct / 100 * 0.1));
  if (stats.free_throw_pct) finalScore *= (0.95 + (stats.free_throw_pct / 100 * 0.05));
  
  // Apply plus/minus as a major adjustment with stronger negative impact
  if (plusMinusValue !== 0) {
    if (plusMinusValue > 0) {
      // For positive plus/minus, apply a smaller boost
      const pmBoost = Math.min(1, plusMinusValue / 20) * 0.15; // Reduced max boost to 15%
      finalScore = finalScore * (0.95 + pmBoost);
    } else {
      // For negative plus/minus, apply a stronger penalty
      const pmPenalty = Math.min(1, Math.abs(plusMinusValue) / 8) * 0.4; // Slightly reduced max penalty to 40%
      finalScore = finalScore * (1 - pmPenalty);
    }
  }
  
  // Apply games played multiplier (moderate impact)
  const gamesPlayedMultiplier = stats.games_played 
    ? 0.8 + (Math.min(stats.games_played, 82) / 82 * 0.4) // 20-60% boost based on games
    : 0.8;
  finalScore = finalScore * gamesPlayedMultiplier;

  // Debug logging for Johnny Juzang
  if (stats.player_name === 'Johnny Juzang') {
    console.log('\n=== DEBUG: Johnny Juzang ===');
    console.log('Positive Score:', positiveScore);
    console.log('Negative Score:', negativeScore);
    console.log('Final Raw Score:', finalScore);
    console.log('Plus/Minus:', stats.plus_minus);
    console.log('Games Played:', stats.games_played);
    console.log('Minutes Per Game:', (stats.minutes_played / stats.games_played).toFixed(1));
    console.log('Points Per Game:', (stats.points / stats.games_played).toFixed(1));
    console.log('Assists Per Game:', (stats.assists / stats.games_played).toFixed(1));
    console.log('Steals Per Game:', (stats.steals / stats.games_played).toFixed(1));
    console.log('Turnovers Per Game:', (stats.turnovers / stats.games_played).toFixed(1));
  }
  
  // Use raw score directly with no scaling
  let score = Math.round(finalScore);

  // Store raw score for sorting
  stats.rawScore = score;

  // Ensure minimum score is 1 for players with games, 0 for test players
  if (stats.games_played > 0 && score < 1) score = 1;
  
  return score;
}

/**
 * Recalculates impact scores for all players
 */
async function recalculateImpactScores() {
  try {
    console.log('Starting impact score recalculation...');
    
    try {
    // Test the connection first
    console.log('Testing Supabase connection...');
    
    // First, check both potential player tables
    const tablesToCheck = ['nba_player_season_stats_2025', 'nba_players', 'players'];
    let players = [];
    let tableName = '';
    
    for (const table of tablesToCheck) {
      console.log(`Checking table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (!error && data && data.length > 0) {
        console.log(`✅ Found data in table: ${table}`);
        tableName = table;
        
        // Get all players from this table
        const { data: allPlayers, error: fetchError } = await supabase
          .from(table)
          .select('*');
          
        if (!fetchError && allPlayers && allPlayers.length > 0) {
          players = allPlayers;
          console.log(`✅ Found ${players.length} players in ${table}`);
          break;
        }
      }
    }
    
    if (players.length === 0) {
      console.error('❌ No player data found in any table');
      return;
    }
    
    console.log(`Using table: ${tableName}`);
    console.log(`Found ${players.length} players to update`);
    console.log('Sample player:', {
      id: players[0].id,
      name: players[0].player_name || players[0].full_name || players[0].first_name + ' ' + players[0].last_name,
      points: players[0].points || 'N/A',
      games_played: players[0].games_played || 'N/A',
      table: tableName
    });
    
    // Calculate raw scores first and ensure stable sorting
    let playersWithScores = players.map(player => {
      // Ensure all required stats are numbers
      const stats = {
        ...player,
        points: Number(player.points) || 0,
        assists: Number(player.assists) || 0,
        rebounds: Number(player.total_rebounds) || 0,
        steals: Number(player.steals) || 0,
        blocks: Number(player.blocks) || 0,
        turnovers: Number(player.turnovers) || 0,
        games_played: Number(player.games_played) || 0,
        games_started: Number(player.games_started) || 0,
        minutes_played: Number(player.minutes_played) || 0,
        plus_minus: Number(player.plus_minus) || 0
      };
      
      const score = calculateImpactScore(stats);
      return { ...player, rawScore: score };
    });
    
    // Sort players by raw score descending, then by player_id for stability
    playersWithScores = [...playersWithScores].sort((a, b) => {
      if (b.rawScore !== a.rawScore) {
        return b.rawScore - a.rawScore;
      }
      // If scores are equal, sort by player_id to ensure consistent ordering
      return (a.player_id || '').localeCompare(b.player_id || '');
    });
    
    // Calculate score distribution with raised baseline
    const totalPlayers = playersWithScores.length;
    const distribution = [
      { maxIndex: Math.floor(totalPlayers * 0.02), minScore: 98, maxScore: 100 },  // Top 2%: 98-100
      { maxIndex: Math.floor(totalPlayers * 0.05), minScore: 94, maxScore: 97 },   // Next 3%: 94-97
      { maxIndex: Math.floor(totalPlayers * 0.1), minScore: 88, maxScore: 93 },    // Next 5%: 88-93
      { maxIndex: Math.floor(totalPlayers * 0.2), minScore: 80, maxScore: 87 },    // Next 10%: 80-87
      { maxIndex: Math.floor(totalPlayers * 0.35), minScore: 70, maxScore: 79 },   // Next 15%: 70-79
      { maxIndex: Math.floor(totalPlayers * 0.55), minScore: 60, maxScore: 69 },   // Next 20%: 60-69
      { maxIndex: Math.floor(totalPlayers * 0.75), minScore: 50, maxScore: 59 },   // Next 20%: 50-59
      { maxIndex: Math.floor(totalPlayers * 0.9), minScore: 40, maxScore: 49 },    // Next 15%: 40-49
      { maxIndex: totalPlayers, minScore: 30, maxScore: 39 }                       // Bottom 10%: 30-39
    ];
    
    // Apply linear scaling within each bracket
    const scaledPlayers = playersWithScores.map((player, index) => {
      let scaledScore = 1; // Default minimum score
      
      // Find which bracket this player falls into
      for (let i = 0; i < distribution.length; i++) {
        const bracket = distribution[i];
        if (index < bracket.maxIndex) {
          const prevBracket = i > 0 ? distribution[i - 1] : { maxIndex: 0 };
          const playersInBracket = bracket.maxIndex - prevBracket.maxIndex;
          const positionInBracket = index - (prevBracket.maxIndex || 0);
          const scoreRange = bracket.maxScore - bracket.minScore;
          
          // Linear scaling within the bracket
          scaledScore = Math.round(
            bracket.minScore + 
            (scoreRange * (positionInBracket / playersInBracket))
          );
          
          // Ensure we don't go below min score (shouldn't happen with proper math)
          scaledScore = Math.max(30, Math.min(100, scaledScore));
          break;
        }
      }
      
      return {
        ...player,
        impact_score: scaledScore
      };
    });
    
    // Update players in batches
    const BATCH_SIZE = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < scaledPlayers.length; i += BATCH_SIZE) {
      const batch = scaledPlayers.slice(i, i + BATCH_SIZE);
      const updates = batch.map(player => ({
        id: player.id,
        player_id: player.player_id,
        impact_score: player.impact_score,
        updated_at: new Date().toISOString()
      }));
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .upsert(updates, { onConflict: 'id' });
          
        if (error) throw error;
        
        updatedCount += updates.length;
        console.log(`Updated ${updatedCount}/${scaledPlayers.length} players`);
        
      } catch (error) {
        console.error(`Error updating batch ${i / BATCH_SIZE + 1}:`, error);
      }
    }
    
    console.log(`\n✅ Successfully updated impact scores for ${updatedCount} players`);
    
  } catch (err) {
    console.error('Error in recalculateImpactScores:', err);
    return;
  }
    
    // Calculate score distribution percentages with raised baseline
    const totalPlayers = playersWithScores.length;
    const distribution = [
      { maxIndex: Math.floor(totalPlayers * 0.02), minScore: 98, maxScore: 100 },  // Top 2%: 98-100
      { maxIndex: Math.floor(totalPlayers * 0.05), minScore: 94, maxScore: 97 },   // Next 3%: 94-97
      { maxIndex: Math.floor(totalPlayers * 0.1), minScore: 88, maxScore: 93 },    // Next 5%: 88-93
      { maxIndex: Math.floor(totalPlayers * 0.2), minScore: 80, maxScore: 87 },    // Next 10%: 80-87
      { maxIndex: Math.floor(totalPlayers * 0.35), minScore: 70, maxScore: 79 },   // Next 15%: 70-79
      { maxIndex: Math.floor(totalPlayers * 0.55), minScore: 60, maxScore: 69 },   // Next 20%: 60-69
      { maxIndex: Math.floor(totalPlayers * 0.75), minScore: 50, maxScore: 59 },   // Next 20%: 50-59
      { maxIndex: Math.floor(totalPlayers * 0.9), minScore: 40, maxScore: 49 },    // Next 15%: 40-49
      { maxIndex: totalPlayers, minScore: 30, maxScore: 39 }                       // Bottom 10%: 30-39
    ];
    
    // Apply linear scaling within each bracket
    const scaledPlayers = playersWithScores.map((player, index) => {
      let scaledScore = 1; // Default minimum score
      
      // Find which bracket this player falls into
      for (let i = 0; i < distribution.length; i++) {
        const bracket = distribution[i];
        if (index < bracket.maxIndex) {
          const prevBracket = i > 0 ? distribution[i - 1] : { maxIndex: 0 };
          const playersInBracket = bracket.maxIndex - prevBracket.maxIndex;
          const positionInBracket = index - (prevBracket.maxIndex || 0);
          const scoreRange = bracket.maxScore - bracket.minScore;
          
          // Linear scaling within the bracket
          scaledScore = Math.round(
            bracket.minScore + 
            (scoreRange * (positionInBracket / playersInBracket))
          );
          
          // Ensure we don't go below min score (shouldn't happen with proper math)
          scaledScore = Math.max(1, Math.min(100, scaledScore));
          break;
        }
      }
      
      return {
        ...player,
        impact_score: scaledScore
      };
    });

    
    // Update players in batches
    const BATCH_SIZE = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < scaledPlayers.length; i += BATCH_SIZE) {
      const batch = scaledPlayers.slice(i, i + BATCH_SIZE);
      const updates = batch.map(player => ({
        id: player.id,
        player_id: player.player_id,  // Include player_id for conflict resolution
        impact_score: player.impact_score,
        updated_at: new Date().toISOString()
      }));

      try {
        const { data, error } = await supabase
          .from('nba_player_season_stats_2025')
          .upsert(updates, { onConflict: 'id' });

        if (error) throw error;

        updatedCount += updates.length;
        console.log(`Updated ${updatedCount}/${players.length} players`);
      } catch (error) {
        console.error('Error updating batch:', error);
      }
      
      // Update the database
      const { error: updateError } = await supabase
        .from('nba_player_season_stats_2025')
        .upsert(updates, { onConflict: 'id' });
        
      if (updateError) {
        console.error('Error updating batch:', updateError);
      } else {
        updatedCount += updates.length;
        console.log(`Updated ${updatedCount}/${players.length} players`);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Successfully updated impact scores for ${updatedCount} players`);
    
  } catch (error) {
    console.error('Error in recalculateImpactScores:', error);
  }
}

// Run the recalibration
recalculateImpactScores().then(() => {
  console.log('Recalibration complete');  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

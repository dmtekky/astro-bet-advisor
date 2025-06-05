/**
 * NBA Player Impact Score Updater
 * 
 * This script calculates and updates impact scores for NBA players in the database
 * using the calculateNbaImpactScore formula that weights various player statistics.
 * 
 * The impact scores are stored in the nba_player_season_stats table.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Define the interface for NBA player stats used in impact score calculation
interface NbaPlayerInfo {
  first_name?: string;
  last_name?: string;
}

interface NbaPlayerStats {
  external_player_id: string;
  nba_players: NbaPlayerInfo[]; // Array of player info
  games_played?: number | null;
  minutes?: number | null;
  points?: number | null;
  rebounds?: number | null;
  assists?: number | null;
  steals?: number | null;
  blocks?: number | null;
  field_goal_pct?: number | null;
  three_point_pct?: number | null;
  plus_minus?: number | null;
  impact_score?: number | null;
  updated_at?: string;
}

// Define the type for the update operation
type PlayerStatsUpdate = Pick<NbaPlayerStats, 'external_player_id' | 'impact_score' | 'updated_at'>;

/**
 * Calculate impact score for NBA players based on weighted basketball statistics
 * 
 * @param stats Object containing player statistics from nba_player_season_stats
 * @returns Impact score from 0-100
 */
function calculateNbaImpactScore(stats: NbaPlayerStats | null | undefined): number {
  if (!stats) return 0;
  
  let score = 0;
  
  // Calculate per-game stats if we have games_played
  const games = stats.games_played || 1; // Avoid division by zero
  
  // Points per game (0-30 points)
  const pointsPerGame = (stats.points || 0) / games;
  score += Math.min(30, pointsPerGame * 1.2);
  
  // Assists per game (0-15 points)
  const assistsPerGame = (stats.assists || 0) / games;
  score += Math.min(15, assistsPerGame * 1.5);
  
  // Rebounds per game (0-15 points)
  const reboundsPerGame = (stats.rebounds || 0) / games;
  score += Math.min(15, reboundsPerGame * 1.2);
  
  // Steals and blocks per game (0-15 points total)
  const stealsPerGame = (stats.steals || 0) / games;
  const blocksPerGame = (stats.blocks || 0) / games;
  const defenseScore = (stealsPerGame * 2.5) + (blocksPerGame * 2.5);
  score += Math.min(15, defenseScore);
  
  // Efficiency (0-15 points)
  let efficiencyScore = 0;
  if (stats.field_goal_pct) {
    efficiencyScore += stats.field_goal_pct * 10; // 0-10 points for FG%
  }
  if (stats.three_point_pct) {
    efficiencyScore += stats.three_point_pct * 5; // 0-5 points for 3P%
  }
  score += Math.min(15, efficiencyScore);
  
  // Playing time and impact (0-10 points)
  const minutesPerGame = (stats.minutes || 0) / games;
  if (minutesPerGame > 0 && stats.plus_minus !== undefined && stats.plus_minus !== null) {
    const minutesFactor = Math.min(1, minutesPerGame / 30); // Normalize to max 30 mins
    const plusMinusPoints = stats.plus_minus > 0 ? 
      Math.min(10, stats.plus_minus) : // If positive, cap at 10 
      Math.max(-10, stats.plus_minus); // If negative, floor at -10
    
    score += (5 + plusMinusPoints * 0.5) * minutesFactor; // Base 5 points adjusted by plus/minus and minutes
  } else if (minutesPerGame > 0) {
    // If only minutes are available
    score += Math.min(5, minutesPerGame * 0.15);
  }
  
  // Normalize to 0-100 scale
  score = Math.min(100, Math.max(0, score));
  
  return Math.round(score);
}

dotenv.config();

// Get environment variables for Supabase connection
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Ensure the impact_score column exists in the nba_player_season_stats table
 */
async function ensureImpactScoreColumn() {
  try {
    console.log('Ensuring impact_score column exists...');
    
    // First try to create the column using the RPC function
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'nba_player_season_stats' 
            AND column_name = 'impact_score'
          ) THEN
            ALTER TABLE public.nba_player_season_stats 
            ADD COLUMN impact_score INTEGER DEFAULT 0;
            
            RAISE NOTICE 'Added impact_score column to nba_player_season_stats table';
          ELSE
            RAISE NOTICE 'impact_score column already exists in nba_player_season_stats table';
          END IF;
        END $$;
      `
    });
    
    if (error) {
      console.warn('Warning: Could not add column with exec_sql. The script will continue but may fail if the column does not exist.');
      console.warn('Error details:', error);
      
      // Fallback: Try a simpler approach if the RPC function fails
      console.log('Attempting alternative method to add column...');
      const { error: simpleError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'nba_player_season_stats',
        column_name: 'impact_score',
        column_type: 'INTEGER'
      });
      
      if (simpleError) {
        console.warn('Fallback method also failed:', simpleError);
        return false;
      }
    }
    
    console.log('Successfully verified/added impact_score column');
    return true;
  } catch (error) {
    console.error('Error ensuring impact_score column exists:', error);
    return false;
  }
}

/**
 * Update impact scores for all NBA players in the nba_player_season_stats table
 */
async function updateNbaImpactScores() {
  // First ensure the column exists
  const columnReady = await ensureImpactScoreColumn();
  if (!columnReady) {
    console.error('Could not ensure impact_score column exists. Aborting.');
    return 0;
  }
  
  try {
    console.log('Checking database structure...');
    
    // First, list all tables in the database
    console.log('Listing all tables in the database...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Available tables:', tables.map(t => t.table_name));
    }
    
    // Check nba_players table
    console.log('\nChecking nba_players table...');
    const { data: players, error: playersError } = await supabase
      .from('nba_players')
      .select('*')
      .limit(1);
      
    if (playersError) {
      console.error('Error querying nba_players:', playersError);
    } else if (players && players.length > 0) {
      console.log('Sample player data:', players[0]);
      console.log('Player columns:', Object.keys(players[0]));
    } else {
      console.log('No data in nba_players table.');
    }
    
    // Check nba_player_season_stats table
    console.log('\nChecking nba_player_season_stats table...');
    const { data: stats, error: statsError } = await supabase
      .from('nba_player_season_stats')
      .select('*')
      .limit(1);
      
    if (statsError) {
      console.error('Error querying nba_player_season_stats:', statsError);
    } else if (stats && stats.length > 0) {
      console.log('Sample stats data:', stats[0]);
      console.log('Stats columns:', Object.keys(stats[0]));
    } else {
      console.log('No data in nba_player_season_stats table.');
    }
    
    // Check if there are any stats with player info
    console.log('\nChecking for player stats with player info...');
    const { data: playerStats, error: playerStatsError } = await supabase
      .from('nba_player_season_stats')
      .select(`
        *,
        nba_players (
          first_name,
          last_name
        )
      `)
      .limit(5);
      
    if (playerStatsError) {
      console.error('Error fetching player stats with player info:', playerStatsError);
      throw new Error(`Error fetching player stats: ${playerStatsError.message}`);
    }
    
    if (!playerStats || playerStats.length === 0) {
      console.log('No player stats found in the database.');
      return 0;
    }
    
    console.log(`Found ${playerStats.length} player stats records.`);
    console.log('First player stat with player info:', JSON.stringify(playerStats[0], null, 2));
    
    // Get all player stats for calculation
    console.log('\nFetching all player stats for impact score calculation...');
    const { data: allPlayerStats, error: allStatsError } = await supabase
      .from('nba_player_season_stats')
      .select(`
        *,
        nba_players (
          first_name,
          last_name
        )
      `);
      
    if (allStatsError) {
      console.error('Error fetching all player stats:', allStatsError);
      throw new Error(`Error fetching all player stats: ${allStatsError.message}`);
    }
    
    if (!allPlayerStats || allPlayerStats.length === 0) {
      console.log('No player stats found for impact score calculation.');
      return 0;
    }
    
    console.log(`Found ${allPlayerStats.length} player stats records for impact score calculation.`);
    return 0; // Temporarily return early to inspect the data
    
    // The rest of the function will be executed if we remove the early return above
    console.log(`Found stats for ${allPlayerStats.length} NBA players. Calculating impact scores...`);
    
    // Rest of the function remains the same, just replace playerStats with allPlayerStats
    
    // Calculate and update impact scores
    let updatedCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < playerStats.length; i += batchSize) {
      const batch = playerStats.slice(i, i + batchSize);
      const updates: PlayerStatsUpdate[] = [];
      
      for (const stats of batch) {
        const impactScore = calculateNbaImpactScore(stats);
        updates.push({
          external_player_id: stats.external_player_id,
          impact_score: impactScore,
          updated_at: new Date().toISOString()
        });
        
        // Log progress for each player
        const playerInfo = stats.nba_players?.[0];
        const playerName = playerInfo?.first_name && playerInfo?.last_name 
          ? `${playerInfo.first_name} ${playerInfo.last_name}` 
          : `Player ${stats.external_player_id}`;
        
        console.log(`Calculated impact score for ${playerName}: ${impactScore}`);
      }
      
      // Update player stats in batch
      const { error: updateError } = await supabase
        .from('nba_player_season_stats')
        .upsert(updates, { onConflict: 'external_player_id' });
        
      if (updateError) {
        console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
      } else {
        updatedCount += updates.length;
        console.log(`Updated ${updatedCount}/${playerStats.length} players`);
      }
    }
    
    console.log(`Successfully updated impact scores for ${updatedCount} NBA players.`);
    return updatedCount;
    
  } catch (error) {
    console.error('Error in updateNbaImpactScores:', error);
    throw error;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  console.log('Starting NBA impact score update process...');
  await updateNbaImpactScores();
  console.log('NBA impact score update completed!');
}

// Run the script
main()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

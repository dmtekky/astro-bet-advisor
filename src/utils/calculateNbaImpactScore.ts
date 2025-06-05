// Utility to calculate a NBA player's impact score based on stats
export interface NbaImpactScorePlayer {
  stats_points_per_game?: number | null;
  stats_assists_per_game?: number | null;
  stats_rebounds_per_game?: number | null;
  stats_steals_per_game?: number | null;
  stats_blocks_per_game?: number | null;
  stats_field_goal_percentage?: number | null;
  stats_three_point_percentage?: number | null;
  stats_minutes_per_game?: number | null;
  stats_plus_minus?: number | null;
}

/**
 * Calculate impact score for NBA players based on common basketball statistics
 * @param player NBA player with statistics
 * @returns Impact score on a 0-100 scale
 */
export function calculateNbaImpactScore(player: NbaImpactScorePlayer | null | undefined): number {
  if (!player) return 0;
  
  let score = 0;
  
  // Scoring stats (up to 35 points)
  if (player.stats_points_per_game) {
    score += player.stats_points_per_game * 1.5; // Up to ~30 points for scoring 20 ppg
  }
  
  // Playmaking (up to 20 points)
  if (player.stats_assists_per_game) {
    score += player.stats_assists_per_game * 2; // Up to ~20 points for 10 assists per game
  }
  
  // Rebounding (up to 15 points)
  if (player.stats_rebounds_per_game) {
    score += player.stats_rebounds_per_game * 1.5; // Up to ~15 points for 10 rebounds per game
  }
  
  // Defense (up to 15 points)
  if (player.stats_steals_per_game) {
    score += player.stats_steals_per_game * 4; // Up to ~8 points for 2 steals per game
  }
  if (player.stats_blocks_per_game) {
    score += player.stats_blocks_per_game * 4; // Up to ~8 points for 2 blocks per game
  }
  
  // Efficiency (up to 15 points)
  if (player.stats_field_goal_percentage) {
    // Convert from decimal (e.g. 0.48) to points (e.g. 4.8)
    score += player.stats_field_goal_percentage * 10; 
  }
  if (player.stats_three_point_percentage) {
    // Bonus for good three point shooting
    score += player.stats_three_point_percentage * 15; 
  }
  
  // Playing time - small bonus for minutes played
  if (player.stats_minutes_per_game) {
    score += player.stats_minutes_per_game * 0.1; // ~3 points for 30 minutes
  }
  
  // Plus/minus - team impact
  if (player.stats_plus_minus && player.stats_plus_minus > 0) {
    score += player.stats_plus_minus * 0.5; // Bonus for positive plus/minus
  }
  
  // Normalize score to 0-100 range
  score = Math.min(100, Math.max(0, score));
  
  // Round to 1 decimal place
  return Math.round(score * 10) / 10;
}

// Utility to calculate a player's impact score based on stats
export interface ImpactScorePlayer {
  stats_batting_hits?: number | null;
  stats_batting_runs?: number | null;
  stats_fielding_assists?: number | null;
}

export function calculateImpactScore(player: ImpactScorePlayer | null | undefined): number {
  if (!player) return 0;
  let score = 0;
  // Batting stats
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.5;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.75;
  // Fielding stats
  if (player.stats_fielding_assists) score += player.stats_fielding_assists * 0.3;
  // Normalize score to 0-100 range
  score = Math.min(100, Math.max(0, score));
  return Math.round(score);
}

import type { CelestialBody, Aspect, PlayerSeasonStats } from '@/types';

/**
 * Represents a player's natal astrological data relevant for influence calculation.
 * This might be simplified or expanded based on available data and calculation complexity.
 */
export interface PlayerNatalData {
  sunSign: string; // Example: 'Aries'
  moonSign: string; // Example: 'Leo'
  // Add other relevant natal placements like Mercury, Venus, Mars, etc.
  // natalChart?: any; // Could be a more complex object representing the full chart
}

/**
 * Represents the current astrological transits relevant for influence calculation.
 */
export interface CurrentTransitData {
  transitingSun: CelestialBody;
  transitingMoon: CelestialBody;
  // Add other transiting planets as needed
  // currentAspects?: Aspect[]; // Aspects between transiting planets or to natal planets
}

/**
 * Calculates the astrological influence score for a player based on their natal data
 * and current astrological transits.
 *
 * @param natalData - The player's natal astrological information.
 * @param transitData - The current astrological transit information.
 * @returns A numerical score representing the astrological influence (e.g., 0-100).
 */
export const calculatePlayerAstrologicalInfluence = (
  natalData: PlayerNatalData,
  transitData: CurrentTransitData
): number => {
  console.log('Calculating astrological influence for player:', natalData, 'with transits:', transitData);
  // Placeholder logic: This will be replaced with actual astrological calculations.
  // For example, consider aspects between transiting planets and natal Sun/Moon.
  // Or the strength of transits to key natal points.
  let score = 50; // Base score

  // Example: Add points if transiting Sun is in player's Sun sign (very simplistic)
  if (transitData.transitingSun.sign === natalData.sunSign) {
    score += 10;
  }

  // Example: Add points if transiting Moon is in player's Moon sign
  if (transitData.transitingMoon.sign === natalData.moonSign) {
    score += 10;
  }

  // Ensure score is within a defined range (e.g., 0-100)
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculates a player's impact score based on their current season statistics.
 * This score reflects their current performance and importance to the team.
 *
 * @param playerStats - The player's season statistics.
 * @returns A numerical score representing the player's impact (e.g., 0-100).
 */
export const calculatePlayerImpactScore = (playerStats: PlayerSeasonStats | undefined | null): number => {
  // TODO: Define PlayerSeasonStats more concretely if not already done
  // For MLB, stats like OPS, ERA, WAR could be used.
  // This is a placeholder and needs to be tailored to the sport (MLB in this case)
  // and the specific stats available and deemed important.
  console.log('Calculating player impact score with stats:', playerStats);
  let impactScore = 0;

  if (!playerStats) return 0;

  // Example for MLB (very simplified):
  // For hitters:
  if (typeof playerStats.on_base_plus_slugging === 'number') {
    impactScore += playerStats.on_base_plus_slugging * 50; // OPS is a good indicator
  }
  if (typeof playerStats.home_runs === 'number') {
    impactScore += playerStats.home_runs * 2;
  }
  if (typeof playerStats.runs_batted_in === 'number') {
    impactScore += playerStats.runs_batted_in * 1;
  }

  // For pitchers:
  if (typeof playerStats.earned_run_average === 'number' && playerStats.earned_run_average > 0) {
    // Lower ERA is better, so invert (e.g., (5 - ERA) * 10, needs careful scaling)
    impactScore += Math.max(0, (5 - playerStats.earned_run_average)) * 10;
  }
  if (typeof playerStats.wins === 'number') {
    impactScore += playerStats.wins * 5;
  }
  if (typeof playerStats.pitching_strikeouts === 'number') {
    impactScore += playerStats.pitching_strikeouts * 0.1;
  }

  return Math.max(0, Math.min(100, Math.round(impactScore))); // Ensure score is 0-100
};

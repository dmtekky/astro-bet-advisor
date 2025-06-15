import { useMemo, useCallback } from 'react';
import type { AstroData } from '@/types/astrology';
import type { GamePredictionData } from '@/types/gamePredictions';
import { transformAstroData } from '@/utils/astroTransform';
import { calculateSportsPredictions, predictGameOutcome } from '@/utils/sportsPredictions';
import type { Game, Team } from '@/types';

/**
 * Hook to manage game predictions based on astrological data
 * @param astroData - Raw astrological data from the API
 * @returns Object containing prediction utilities and data
 */
export const useGamePredictions = (astroData: AstroData | null) => {
  // Transform the raw astro data into the format expected by the prediction functions
  const transformedData = useMemo(() => {
    if (!astroData) return null;
    return transformAstroData(astroData);
  }, [astroData]);

  // Calculate general sports predictions based on the astro data
  const sportsPredictions = useMemo(() => {
    if (!transformedData) return null;
    return calculateSportsPredictions(transformedData);
  }, [transformedData]);

  /**
   * Get a prediction for a specific game
   * @param game - The game to predict
   * @param homeTeam - Home team data
   * @param awayTeam - Away team data
   * @returns Prediction result or null if data is missing
   */
  const getGamePrediction = useCallback((game: Game, homeTeam?: Team, awayTeam?: Team) => {
    if (!transformedData) {
      console.warn(`No transformed astro data available for game prediction`);
      return null;
    }
    try {
      return predictGameOutcome(game, homeTeam, awayTeam, transformedData);
    } catch (error) {
      console.error('Error in getGamePrediction:', error);
      return null;
    }
  }, [transformedData]);

  return {
    /** The transformed astro data ready for predictions */
    transformedData,
    
    /** General sports predictions based on the current astro data */
    sportsPredictions,
    
    /**
     * Get a prediction for a specific game
     * @param game - The game to predict
     * @param homeTeam - Optional home team data
     * @param awayTeam - Optional away team data
     * @returns Prediction result or null if data is missing
     */
    getGamePrediction,
    
    /** Whether the hook has data ready for predictions */
    isLoading: !astroData,
    
    /** Any error that occurred during prediction */
    error: null // Could be enhanced with error handling
  };
};

export default useGamePredictions;

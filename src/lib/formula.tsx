/**
 * formula.ts - Proprietary astrological impact formula for sports betting
 * 
 * This module calculates the astrological influence on sports performance using:
 * - AIS (Astrological Impact Score): Weighted sum of astrological events
 * - KPW (Key Player Weighting): Impact adjustment based on player importance
 * - TAS (Team Astrological Score): Combined score for team performance
 * - PAF (Performance Adjustment Factor): Historical accuracy adjustment
 * - OAS (Odds Adjustment Score): Final betting odds adjustment
 */

import { supabase } from '@/integrations/supabase/client';
import { getZodiacSign, getMoonPhaseInfo } from '@/lib/astroCalc';
import { format } from 'date-fns';

// Import types from the main types file
import type { Player as BasePlayer } from '@/types';

// Extend the base Player type with any additional fields needed for calculations
export interface Player extends Omit<BasePlayer, 'position' | 'sport'> {
  position?: string | string[];
  sport: string;
  birthDate?: string; // Alias for birth_date
  birth_date?: string;
  win_shares?: number;
  stats?: Record<string, any>;
  height?: string;
  weight?: string;
  number?: number;
}

export interface Ephemeris {
  id?: string;
  date: string;
  moon_phase: number;
  moon_sign: string;
  mercury_sign: string;
  mercury_retrograde: boolean;
  venus_sign: string;
  mars_sign: string;
  jupiter_sign: string;
  saturn_sign: string;
  sun_sign: string;
  sun_mars_aspect: number;
  sun_saturn_aspect: number;
  sun_jupiter_aspect: number;
  created_at?: string;
  updated_at?: string;
  aspects?: any;
  metadata?: Record<string, any>;
  timestamp?: string; // ISO timestamp of when the ephemeris data was generated
}

interface AISResult {
  score: number;
  factors: {
    moon_phase: number;
    moon_sign: number;
    mercury_sign: number;
    venus_sign: number;
    mars_sign: number;
    jupiter_sign: number;
    mercury_retrograde: number;
    sun_mars_aspect: number;
    sun_saturn_aspect: number;
    sun_jupiter_aspect: number;
  };
  weightedScores: {
    moon_phase: number;
    moon_sign: number;
    mercury_sign: number;
    venus_sign: number;
    mars_sign: number;
    jupiter_sign: number;
    mercury_retrograde: number;
    sun_mars_aspect: number;
    sun_saturn_aspect: number;
    sun_jupiter_aspect: number;
  };
  error?: string; // Added error property to the interface
  timestamp?: string; // ISO timestamp of when the calculation was performed
}

interface TeamData {
  id: string;
  name: string;
  sport: string;
  players?: Player[];
}

interface BettingOdds {
  home: number;
  away: number;
  spread?: number;
  total?: number;
}

// Base weights for astrological events (initial values)
// These will be updated monthly based on prediction accuracy

// Type for astrological weights
interface AstrologicalWeights {
  moon_phase: number;
  moon_sign: number;
  mercury_sign: number;
  venus_sign: number;
  mars_sign: number;
  jupiter_sign: number;
  mercury_retrograde: number;
  sun_mars_aspect: number;
  sun_saturn_aspect: number;
  sun_jupiter_aspect: number;
}

// Default weights for astrological events
export const DEFAULT_ASTROLOGICAL_WEIGHTS: AstrologicalWeights = {
  moon_phase: 0.15,       // Weight for moon phase influence
  moon_sign: 0.10,        // Weight for moon sign compatibility
  mercury_sign: 0.08,     // Weight for Mercury sign influence
  venus_sign: 0.07,       // Weight for Venus sign influence
  mars_sign: 0.12,        // Weight for Mars sign influence
  jupiter_sign: 0.11,     // Weight for Jupiter sign influence
  mercury_retrograde: 0.14, // Weight for Mercury retrograde effect
  sun_mars_aspect: 0.09,  // Weight for Sun-Mars aspects
  sun_saturn_aspect: 0.06, // Weight for Sun-Saturn aspects
  sun_jupiter_aspect: 0.08 // Weight for Sun-Jupiter aspects
};

export let currentAstrologicalWeights: AstrologicalWeights = { ...DEFAULT_ASTROLOGICAL_WEIGHTS };

// Validate that weights sum to 1.0 and normalize if needed
export const validateWeights = (): void => {
  const weights = Object.values(currentAstrologicalWeights);
  const sum = weights.reduce((a, b) => a + b, 0);
  
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(`Warning: Astrological weights sum to ${sum.toFixed(4)}, not 1.0. Normalizing...`);
    const normalizationFactor = 1.0 / sum;
    
    // Create a new object with normalized weights
    const normalizedWeights = Object.entries(currentAstrologicalWeights).reduce((acc, [key, value]) => {
      acc[key as keyof AstrologicalWeights] = value * normalizationFactor;
      return acc;
    }, {} as AstrologicalWeights);
    
    // Update the weights
    Object.assign(currentAstrologicalWeights, normalizedWeights);
    console.log('Weights normalized successfully');
  }
};

// Run validation immediately on module load
validateWeights();

interface WeightStats {
  correct: number;
  total: number;
}

// Update weights based on prediction accuracy
export const updateWeights = (results: { correct: boolean; weightUsed: keyof AstrologicalWeights }[]): void => {
  if (results.length === 0) {
    console.warn('No results provided for weight update');
    return;
  }

  // Count correct predictions per weight type
  const weightStats = results.reduce<Record<keyof AstrologicalWeights, WeightStats>>((acc, { correct, weightUsed }) => {
    if (!acc[weightUsed]) {
      acc[weightUsed] = { correct: 0, total: 0 };
    }
    acc[weightUsed].total++;
    if (correct) acc[weightUsed].correct++;
    return acc;
  }, {} as Record<keyof AstrologicalWeights, WeightStats>);

  // Calculate new weights based on accuracy
  const newWeights = { ...currentAstrologicalWeights };
  let totalAdjusted = 0;
  let totalAdjustment = 0;

  // First pass: calculate adjustments
  Object.entries(weightStats).forEach(([weightType, { correct, total }]) => {
    if (total > 0) {
      const accuracy = correct / total;
      const adjustment = 0.8 + accuracy * 0.4; // Adjustment factor between 0.8 and 1.2
      const newWeight = currentAstrologicalWeights[weightType as keyof AstrologicalWeights] * adjustment;
      newWeights[weightType as keyof AstrologicalWeights] = Math.min(0.5, Math.max(0.05, newWeight));
      totalAdjusted++;
      totalAdjustment += adjustment;
    }
  });

  // If we adjusted some weights, normalize them
  if (totalAdjusted > 0) {
    // Calculate normalization factor to maintain sum of weights
    const currentSum = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    const normalizationFactor = 1.0 / currentSum;

    // Apply normalization
    (Object.keys(newWeights) as Array<keyof AstrologicalWeights>).forEach(key => {
      newWeights[key] = parseFloat((newWeights[key] * normalizationFactor).toFixed(4));
    });

    // Update the weights
    Object.assign(currentAstrologicalWeights, newWeights);
    console.log('Updated astrological weights:', currentAstrologicalWeights);
    
    // Optional: Save updated weights to database or storage
    saveWeightsToDatabase(newWeights).catch(console.error);
  } else {
    console.log('No weight updates were made');
  }
};

// Type for the weights data in the database
interface WeightsData {
  id: string;
  weights: AstrologicalWeights;
  updated_at: string;
}

// Helper function to save weights to database
export const saveWeightsToDatabase = async (weights: AstrologicalWeights): Promise<void> => {
  try {
    const { error } = await supabase
      .from('astrological_calculations')
      .upsert({
        id: 'current_weights',
        calculation_data: weights as any,
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'id' });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving weights to database:', error);
    throw error;
  }
};

// Helper function to load latest weights from database
export const loadLatestWeights = async (): Promise<AstrologicalWeights> => {
  try {
    const { data, error } = await supabase
      .from('astrological_calculations')
      .select('calculation_data')
      .eq('id', 'current_weights')
      .single();
      
    if (error) throw error;
    const weights = data?.calculation_data as unknown as AstrologicalWeights;
    return weights || DEFAULT_ASTROLOGICAL_WEIGHTS;
  } catch (error) {
    console.error('Failed to load weights from database:', error);
    return DEFAULT_ASTROLOGICAL_WEIGHTS;
  }
};

/**
 * Calculate Astrological Impact Score (AIS) for a player
 * 
 * @param player Player information including birth date and position
 * @param ephemeris Planetary positions and aspects for the game date
 * @returns AIS score and contributing factors
 */
export async function calculateAIS(
  player: Player,
  ephemeris: Partial<Ephemeris>,
  weights: AstrologicalWeights = { ...currentAstrologicalWeights }
): Promise<AISResult> {
  try {
    // Validate required ephemeris data
    if (!ephemeris || typeof ephemeris !== 'object') {
      throw new Error('Invalid or missing ephemeris data');
    }

    // Get position as string (use first position if array)
    const position = Array.isArray(player.position) 
      ? player.position[0] || '' 
      : player.position || '';
    
    // Get birth date (support both birth_date and birthDate for backward compatibility)
    const birthDate = player.birth_date || player.birthDate;
    
    // Calculate individual factor scores with fallbacks for missing data
    const factors = {
      moon_phase: ephemeris.moon_phase !== undefined 
        ? calculateMoonPhaseScore(ephemeris.moon_phase, position) 
        : 0.5,
      
      moon_sign: calculateSignCompatibility(
        birthDate, 
        ephemeris.moon_sign || ''
      ),
      
      mercury_sign: ephemeris.mercury_sign !== undefined
        ? calculateMercuryInfluence(ephemeris.mercury_sign, position)
        : 0.5,
        
      venus_sign: ephemeris.venus_sign !== undefined
        ? calculateVenusInfluence(ephemeris.venus_sign, position)
        : 0.5,
        
      mars_sign: ephemeris.mars_sign !== undefined
        ? calculateMarsInfluence(ephemeris.mars_sign, position)
        : 0.5,
        
      jupiter_sign: ephemeris.jupiter_sign !== undefined
        ? calculateJupiterInfluence(ephemeris.jupiter_sign, position)
        : 0.5,
        
      mercury_retrograde: ephemeris.mercury_retrograde !== undefined
        ? (ephemeris.mercury_retrograde ? 0.8 : 1.0)
        : 1.0,
        
      sun_mars_aspect: ephemeris.sun_mars_aspect !== undefined 
        ? ephemeris.sun_mars_aspect 
        : 0.5,
        
      sun_saturn_aspect: ephemeris.sun_saturn_aspect !== undefined 
        ? ephemeris.sun_saturn_aspect 
        : 0.5,
        
      sun_jupiter_aspect: ephemeris.sun_jupiter_aspect !== undefined 
        ? ephemeris.sun_jupiter_aspect 
        : 0.5
    };

    // Calculate weighted scores
    const weightedScores = {
      moon_phase: factors.moon_phase * weights.moon_phase,
      moon_sign: factors.moon_sign * weights.moon_sign,
      mercury_sign: factors.mercury_sign * weights.mercury_sign,
      venus_sign: factors.venus_sign * weights.venus_sign,
      mars_sign: factors.mars_sign * weights.mars_sign,
      jupiter_sign: factors.jupiter_sign * weights.jupiter_sign,
      mercury_retrograde: factors.mercury_retrograde * weights.mercury_retrograde,
      sun_mars_aspect: factors.sun_mars_aspect * weights.sun_mars_aspect,
      sun_saturn_aspect: factors.sun_saturn_aspect * weights.sun_saturn_aspect,
      sun_jupiter_aspect: factors.sun_jupiter_aspect * weights.sun_jupiter_aspect
    };

    // Calculate final score (weighted average)
    const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
    const score = totalWeight > 0 
      ? Object.values(weightedScores).reduce((sum, val) => sum + val, 0) / totalWeight
      : 0.5; // Default neutral score if no weights

    return {
      score: Math.min(Math.max(0, score), 1), // Clamp score between 0 and 1
      factors,
      weightedScores,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating AIS:', error, { 
      player: { 
        id: player?.id, 
        name: player?.name,
        position: player?.position,
        birthDate: player?.birth_date || player?.birthDate
      },
      ephemeris: {
        date: ephemeris?.date,
        moon_phase: ephemeris?.moon_phase,
        moon_sign: ephemeris?.moon_sign
      }
    });
    
    return {
      score: 0.5, // Default neutral score on error
      factors: {
        moon_phase: 0.5,
        moon_sign: 0.5,
        mercury_sign: 0.5,
        venus_sign: 0.5,
        mars_sign: 0.5,
        jupiter_sign: 0.5,
        mercury_retrograde: 1.0,
        sun_mars_aspect: 0.5,
        sun_saturn_aspect: 0.5,
        sun_jupiter_aspect: 0.5
      },
      weightedScores: {
        moon_phase: 0.5 * weights.moon_phase,
        moon_sign: 0.5 * weights.moon_sign,
        mercury_sign: 0.5 * weights.mercury_sign,
        venus_sign: 0.5 * weights.venus_sign,
        mars_sign: 0.5 * weights.mars_sign,
        jupiter_sign: 0.5 * weights.jupiter_sign,
        mercury_retrograde: 1.0 * weights.mercury_retrograde,
        sun_mars_aspect: 0.5 * weights.sun_mars_aspect,
        sun_saturn_aspect: 0.5 * weights.sun_saturn_aspect,
        sun_jupiter_aspect: 0.5 * weights.sun_jupiter_aspect
      },
      error: error instanceof Error ? error.message : 'Unknown error in calculateAIS',
      timestamp: new Date().toISOString()
    };
  }
};

// Helper function to calculate moon phase score
function calculateMoonPhaseScore(phase: number, position: string): number {
  // Implementation depends on your specific scoring logic
  // This is a placeholder implementation
  return Math.sin(phase * Math.PI * 2) * 0.5 + 0.5; // Returns value between 0 and 1
}

// Helper function to calculate sign compatibility
function calculateSignCompatibility(birthDate: string | undefined, currentSign: string): number {
  // Return neutral score if no birth date is provided
  if (!birthDate) {
    console.debug('No birth date provided for sign compatibility check');
    return 0.5;
  }

  try {
    // Parse the birth date
    const birthDateObj = new Date(birthDate);
    
    // Validate the date
    if (isNaN(birthDateObj.getTime())) {
      console.warn('Invalid birth date format:', birthDate);
      return 0.5;
    }
    
    // Check if the date is in the future (invalid)
    const now = new Date();
    if (birthDateObj > now) {
      console.warn('Future birth date provided:', birthDate);
      return 0.5;
    }
    
    // Extract month and day
    const birthMonth = birthDateObj.getMonth() + 1; // getMonth() is 0-indexed
    const birthDay = birthDateObj.getDate();
    
    // Determine the zodiac sign based on birth date
    let birthSign: string;
    
    if ((birthMonth === 3 && birthDay >= 21) || (birthMonth === 4 && birthDay <= 19)) birthSign = 'Aries';
    else if ((birthMonth === 4 && birthDay >= 20) || (birthMonth === 5 && birthDay <= 20)) birthSign = 'Taurus';
    else if ((birthMonth === 5 && birthDay >= 21) || (birthMonth === 6 && birthDay <= 20)) birthSign = 'Gemini';
    else if ((birthMonth === 6 && birthDay >= 21) || (birthMonth === 7 && birthDay <= 22)) birthSign = 'Cancer';
    else if ((birthMonth === 7 && birthDay >= 23) || (birthMonth === 8 && birthDay <= 22)) birthSign = 'Leo';
    else if ((birthMonth === 8 && birthDay >= 23) || (birthMonth === 9 && birthDay <= 22)) birthSign = 'Virgo';
    else if ((birthMonth === 9 && birthDay >= 23) || (birthMonth === 10 && birthDay <= 22)) birthSign = 'Libra';
    else if ((birthMonth === 10 && birthDay >= 23) || (birthMonth === 11 && birthDay <= 21)) birthSign = 'Scorpio';
    else if ((birthMonth === 11 && birthDay >= 22) || (birthMonth === 12 && birthDay <= 21)) birthSign = 'Sagittarius';
    else if ((birthMonth === 12 && birthDay >= 22) || (birthMonth === 1 && birthDay <= 19)) birthSign = 'Capricorn';
    else if ((birthMonth === 1 && birthDay >= 20) || (birthMonth === 2 && birthDay <= 18)) birthSign = 'Aquarius';
    else birthSign = 'Pisces';
    
    // If no current sign is provided, use the birth sign compatibility with the moon
    if (!currentSign) {
      console.debug('No current sign provided, using Moon for compatibility');
      return calculateElementalCompatibility(birthSign, 'Moon');
    }
    
    // Calculate compatibility between birth sign and current sign
    return calculateElementalCompatibility(birthSign, currentSign);
    
  } catch (error) {
    console.error('Error calculating sign compatibility:', error, { birthDate, currentSign });
    return 0.5; // Return neutral score on error
  }
}

export function calculateElementalCompatibility(sign1: string, sign2: string): number {
  const elements: Record<string, string> = {
    Aries: 'Fire',
    Leo: 'Fire',
    Sagittarius: 'Fire',
    Taurus: 'Earth',
    Virgo: 'Earth',
    Capricorn: 'Earth',
    Gemini: 'Air',
    Libra: 'Air',
    Aquarius: 'Air',
    Cancer: 'Water',
    Scorpio: 'Water',
    Pisces: 'Water'
  };

  const element1 = elements[sign1];
  const element2 = elements[sign2];

  if (!element1 || !element2) return 0.5;
  if (element1 === element2) return 1.0;

  // Compatible elements (Fire/Air, Earth/Water)
  if (
    (element1 === 'Fire' && element2 === 'Air') ||
    (element1 === 'Air' && element2 === 'Fire') ||
    (element1 === 'Earth' && element2 === 'Water') ||
    (element1 === 'Water' && element2 === 'Earth')
  ) {
    return 0.75;
  }

  return 0.25;
}

// Planet influence calculations
export function calculateMercuryInfluence(sign: string, position: string): number {
  // Base score from sign (0 to 1)
  const signScores: Record<string, number> = {
    'Aries': 0.8,
    'Taurus': 0.7,
    'Gemini': 0.9,  // Mercury rules Gemini
    'Cancer': 0.6,
    'Leo': 0.5,
    'Virgo': 0.9,  // Mercury rules Virgo
    'Libra': 0.7,
    'Scorpio': 0.6,
    'Sagittarius': 0.5,
    'Capricorn': 0.7,
    'Aquarius': 0.8,
    'Pisces': 0.6
  };

  // Position modifiers (higher = more influenced by Mercury)
  const positionModifiers: Record<string, number> = {
    // Basketball positions
    'PG': 1.2,  // Point guards benefit more from Mercury
    'SG': 1.0,
    'SF': 0.9,
    'PF': 0.8,
    'C': 0.7,
    // Football positions
    'QB': 1.3,  // Quarterbacks benefit greatly from Mercury
    'WR': 1.1,  // Wide receivers need good communication
    'RB': 0.8,
    'TE': 0.9,
    'OL': 0.7,
    'DL': 0.7,
    'LB': 0.8,
    'DB': 0.9,
    'K': 0.8,
    'P': 0.8,
    'default': 0.8
  };

  const baseScore = signScores[sign] || 0.5;
  const modifier = positionModifiers[position] || positionModifiers['default'];
  
  return Math.min(1, Math.max(0, baseScore * modifier));
}

export function calculateVenusInfluence(sign: string, position: string): number {
  // Simplified implementation - adjust based on your requirements
  return 0.6;
}

export function calculateMarsInfluence(sign: string, position: string): number {
  // Simplified implementation - adjust based on your requirements
  return 0.7;
}

export function calculateJupiterInfluence(sign: string, position: string): number {
  // Simplified implementation - adjust based on your requirements
  return 0.8;
}

// Utility functions
export function moneyLineToImpliedProbability(moneyLine: number): number {
  if (moneyLine > 0) {
    return 100 / (moneyLine + 100);
  } else {
    return -moneyLine / (-moneyLine + 100);
  }
}

function impliedProbabilityToMoneyLine(probability: number): number {
  if (probability < 0 || probability > 1) {
    throw new Error('Probability must be between 0 and 1');
  }
  
  if (probability > 0.5) {
    return (probability * 100) / (1 - probability);
  } else {
    return (100 / probability) - 100;
  }
}

function getBettingCategory(score: number): string {
  if (score >= 0.8) return 'Strong Bet';
  if (score >= 0.6) return 'Good Bet';
  if (score >= 0.4) return 'Fair Bet';
  if (score >= 0.2) return 'Risky Bet';
  return 'Avoid Bet';
}

function calculatePlanetSignInfluence(birthSign: string, planetSign: string, planet: string): number {
  // Implementation of calculatePlanetSignInfluence
  return 0;
}

function getAspectScore(aspect: string): number {
  // Implementation of getAspectScore
  return 0;
}

function calculateKPW(aisScore: number, winShares: number): number {
  // Simple formula: AIS * winShares, normalized to 0-10 range
  return Math.min(10, Math.max(0, aisScore * (winShares || 1)));
}

function runSamplePlayerCalculation(ephemeris: Ephemeris): AISResult {
  return {
    score: 0,
    factors: {
      moon_phase: 0,
      moon_sign: 0,
      mercury_sign: 0,
      venus_sign: 0,
      mars_sign: 0,
      jupiter_sign: 0,
      mercury_retrograde: 0,
      sun_mars_aspect: 0,
      sun_saturn_aspect: 0,
      sun_jupiter_aspect: 0
    },
    weightedScores: {
      moon_phase: 0,
      moon_sign: 0,
      mercury_sign: 0,
      venus_sign: 0,
      mars_sign: 0,
      jupiter_sign: 0,
      mercury_retrograde: 0,
      sun_mars_aspect: 0,
      sun_saturn_aspect: 0,
      sun_jupiter_aspect: 0
    }
  };
}

function runSampleTeamCalculation(): void {
  console.log('Running sample team calculation');
}

// Create the module object with all functions and properties
const formulaModule = {
  // Core functions
  calculateAIS,
  calculateMoonPhaseScore,
  calculateSignCompatibility,
  calculateElementalCompatibility,
  calculateMercuryInfluence,
  calculateVenusInfluence,
  calculateMarsInfluence,
  calculateJupiterInfluence,
  
  // Helper functions
  calculatePlanetSignInfluence,
  getAspectScore,
  moneyLineToImpliedProbability,
  impliedProbabilityToMoneyLine,
  getBettingCategory,
  calculateKPW,
  
  // Sample functions
  runSamplePlayerCalculation,
  runSampleTeamCalculation,
  
  // Initialize the module with default or saved weights
  initializeModule: async (): Promise<void> => {
    try {
      const savedWeights = await loadLatestWeights();
      if (savedWeights) {
        currentAstrologicalWeights = savedWeights;
      }
    } catch (error) {
      console.error('Failed to initialize module with saved weights:', error);
      // Fall back to default weights
      currentAstrologicalWeights = { ...DEFAULT_ASTROLOGICAL_WEIGHTS };
    }
    console.log('Formula module initialized');
  },
  updateWeights,
  validateWeights,
  saveWeightsToDatabase,
  loadLatestWeights,
  updateAstrologicalWeights: (newWeights: AstrologicalWeights) => {
    Object.assign(currentAstrologicalWeights, newWeights);
  },
  
  // Constants
  get ASTROLOGICAL_WEIGHTS() {
    return { ...currentAstrologicalWeights };
  },
  
  // Types
  types: {
    Player: {} as Player,
    Ephemeris: {} as Ephemeris,
    AISResult: {} as AISResult,
    TeamData: {} as TeamData,
    BettingOdds: {} as BettingOdds,
    AstrologicalWeights: {} as AstrologicalWeights,
    WeightStats: {} as WeightStats,
    WeightsData: {} as WeightsData
  }
};

// Export the module as default
export default formulaModule;

// Export types for type imports
export type FormulaTypes = {
  Player: Player;
  Ephemeris: Ephemeris;
  AISResult: AISResult;
  TeamData: TeamData;
  BettingOdds: BettingOdds;
  AstrologicalWeights: AstrologicalWeights;
  WeightStats: WeightStats;
  WeightsData: WeightsData;
};

// Export individual types for backward compatibility
// Explicitly export all types
export type { 
  AISResult, 
  TeamData, 
  BettingOdds, 
  AstrologicalWeights, 
  WeightStats, 
  WeightsData 
};

// Player and Ephemeris are now exported as interfaces above

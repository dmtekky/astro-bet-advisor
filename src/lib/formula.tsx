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

import { supabase } from '../integrations/supabase/client';
import { getZodiacSign, getMoonPhaseName } from '@/lib/astroCalc';
import { format } from 'date-fns';

// Import types from the main types file
import type { Player as BasePlayer } from '@/types';

// Extend the base Player type with any additional fields needed for calculations
// Re-export the BasePlayer type from types
export type { Player as BasePlayer } from '@/types';

// Extend the base Player type with additional fields
export interface Player extends Omit<BasePlayer, 'position'> {
  position?: string | string[];
  birthDate?: string; // Alias for birth_date
  birth_date?: string;
  team_id?: string;
  team?: string;
  stats?: any;
  image_url?: string;
  jersey_number?: number;
  height?: string;
  weight?: string;
  college?: string;
  experience?: number;
  // Astrological properties
  sun_sign?: string;
  moon_sign?: string;
  mercury_sign?: string;
  venus_sign?: string;
  mars_sign?: string;
  jupiter_sign?: string;
  saturn_sign?: string;
  uranus_sign?: string;
  neptune_sign?: string;
  pluto_sign?: string;
  ascendant?: string;
  midheaven?: string;
  nodes?: string;
  aspects?: any[];
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
  aspects?: {
    [key: string]: number | string | boolean;
  };
  metadata?: Record<string, any>;
  timestamp?: string;
  natal_to_transit_aspects?: number;
  elemental_balance?: number;
  modalities_balance?: number;
  natal_moon_sign?: string;
  elements?: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  modalities?: {
    cardinal: number;
    fixed: number;
    mutable: number;
  };
  moon?: {
    phase: string;
    phaseValue: number;
    sign: string;
    icon: string;
    degree: number;
    illumination: number;
  };
}

export type AISResult = {
  score: number;
  factors: {
    sun_sign: number;
    moon_sign: number;
    natal_to_transit_aspects: number;
    elemental_balance: number;
    modalities_balance: number;
    moon_phase: number;
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
    sun_sign: number;
    moon_sign: number;
    natal_to_transit_aspects: number;
    elemental_balance: number;
    modalities_balance: number;
    moon_phase: number;
    mercury_sign: number;
    venus_sign: number;
    mars_sign: number;
    jupiter_sign: number;
    mercury_retrograde: number;
    sun_mars_aspect: number;
    sun_saturn_aspect: number;
    sun_jupiter_aspect: number;
  };
  error?: string;
  timestamp?: string;
};

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
export type AstrologicalWeights = {
  sun_sign: number; // Natal vs. transit sun sign compatibility
  moon_sign: number; // Natal vs. transit moon sign compatibility
  natal_to_transit_aspects: number; // Major aspects between natal and transit planets
  elemental_balance: number; // Natal vs. transit elemental balance
  modalities_balance: number; // Natal vs. transit modalities
  moon_phase: number;
  mercury_sign: number;
  venus_sign: number;
  mars_sign: number;
  jupiter_sign: number;
  mercury_retrograde: number;
  sun_mars_aspect: number;
  sun_saturn_aspect: number;
  sun_jupiter_aspect: number;
};

// Default weights for astrological events
export const DEFAULT_ASTROLOGICAL_WEIGHTS: AstrologicalWeights = {
  sun_sign: 0.30,              // Natal vs. transit sun sign compatibility (highest)
  moon_sign: 0.25,             // Natal vs. transit moon sign compatibility (high)
  natal_to_transit_aspects: 0.13, // Unique aspects between player's natal and transit planets
  elemental_balance: 0.07,     // Natal vs. transit elements
  modalities_balance: 0.05,    // Natal vs. transit modalities
  moon_phase: 0.05,            // Lowered
  mercury_sign: 0.03,          // Lowered
  venus_sign: 0.03,            // Lowered
  mars_sign: 0.03,             // Lowered
  jupiter_sign: 0.02,          // Lowered
  mercury_retrograde: 0.02,    // Lowered
  sun_mars_aspect: 0.025,      // Lowered
  sun_saturn_aspect: 0.015,    // Lowered
  sun_jupiter_aspect: 0.015    // Lowered
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
    
    // Calculate individual factor scores using real astrological data
    const natalSunSign = getZodiacSign(new Date(birthDate));
    const transitSunSign = ephemeris.sun_sign;
    const transitMoonSign = ephemeris.moon_sign;
    const natalMoonSign = player.moon_sign;

    // Get ephemeris data from useAstroData if available
    // Check if we have aspects available via the aspects property
    const calculateAspect = (planet1: string, planet2: string, aspectData: Record<string, any>): number => {
      const aspectKey = `${planet1}_${planet2}_aspect`;
      
      // If we have explicit aspect data, use it
      if (aspectData && aspectData[aspectKey] !== undefined) {
        return aspectData[aspectKey];
      }
      
      // Otherwise calculate based on sign compatibility
      const planet1Sign = ephemeris[`${planet1}_sign`] as string;
      const planet2Sign = ephemeris[`${planet2}_sign`] as string;
      
      if (planet1Sign && planet2Sign) {
        return calculateSignCompatibility(planet1Sign, planet2Sign);
      }
      
      // Just in case we can't calculate, throw error rather than falling back
      throw new Error(`Cannot calculate aspect between ${planet1} and ${planet2}`);
    };
  
    // Calculate sun sign compatibility (player natal sun vs. transit sun)
    const sun_sign = calculateSignCompatibility(natalSunSign, transitSunSign);
    
    // Calculate moon sign compatibility (player natal moon vs. transit moon)
    const moon_sign = calculateSignCompatibility(natalMoonSign, transitMoonSign);
    
    // Calculate natal-to-transit aspects based on planetary positions
    // This function will throw if data is missing
    const natal_to_transit_aspects = calculateNatalToTransitAspects(player, ephemeris);
    
    // Calculate elemental balance
    const elements = {
      fire: 0, earth: 0, air: 0, water: 0
    };
    
    // If we have the elemental data directly
    if (ephemeris.elements) {
      elements.fire = ephemeris.elements.fire;
      elements.earth = ephemeris.elements.earth;
      elements.air = ephemeris.elements.air;
      elements.water = ephemeris.elements.water;
    } else {
      // Calculate from planet positions
      const getElementForSign = (sign: string): string => {
        const fireElements = ['aries', 'leo', 'sagittarius'];
        const earthElements = ['taurus', 'virgo', 'capricorn'];
        const airElements = ['gemini', 'libra', 'aquarius'];
        const waterElements = ['cancer', 'scorpio', 'pisces'];
        
        sign = sign.toLowerCase();
        if (fireElements.includes(sign)) return 'fire';
        if (earthElements.includes(sign)) return 'earth';
        if (airElements.includes(sign)) return 'air';
        if (waterElements.includes(sign)) return 'water';
        return '';
      };
      
      // Count elements from current planet positions
      ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(planet => {
        const sign = ephemeris[`${planet}_sign`] as string;
        if (sign) {
          const element = getElementForSign(sign);
          if (element) elements[element] += 1;
        }
      });
      
      // Convert to percentages
      const total = Object.values(elements).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        elements.fire = (elements.fire / total) * 100;
        elements.earth = (elements.earth / total) * 100;
        elements.air = (elements.air / total) * 100;
        elements.water = (elements.water / total) * 100;
      }
    }
    
    const elemental_balance = calculateElementalBalanceScore(elements);
      
    // Calculate modalities balance
    const modalities = {
      cardinal: 0, fixed: 0, mutable: 0
    };
    
    // If we have the modalities data directly
    if (ephemeris.modalities) {
      modalities.cardinal = ephemeris.modalities.cardinal;
      modalities.fixed = ephemeris.modalities.fixed;
      modalities.mutable = ephemeris.modalities.mutable;
    } else {
      // Calculate from planet positions
      const getModalityForSign = (sign: string): string => {
        const cardinalSigns = ['aries', 'cancer', 'libra', 'capricorn'];
        const fixedSigns = ['taurus', 'leo', 'scorpio', 'aquarius'];
        const mutableSigns = ['gemini', 'virgo', 'sagittarius', 'pisces'];
        
        sign = sign.toLowerCase();
        if (cardinalSigns.includes(sign)) return 'cardinal';
        if (fixedSigns.includes(sign)) return 'fixed';
        if (mutableSigns.includes(sign)) return 'mutable';
        return '';
      };
      
      // Count modalities from current planet positions
      ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(planet => {
        const sign = ephemeris[`${planet}_sign`] as string;
        if (sign) {
          const modality = getModalityForSign(sign);
          if (modality) modalities[modality] += 1;
        }
      });
      
      // Convert to percentages
      const total = Object.values(modalities).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        modalities.cardinal = (modalities.cardinal / total) * 100;
        modalities.fixed = (modalities.fixed / total) * 100;
        modalities.mutable = (modalities.mutable / total) * 100;
      }
    }
    
    const modalities_balance = calculateModalitiesBalanceScore(modalities);

    // Calculate moon phase score (0-1 scale where 0.5 is full moon, 0/1 is new moon)
    const moonPhaseScore = calculateMoonPhaseScore(ephemeris.moon_phase);

    // Calculate planetary influences based on current positions
    const sunSignScore = calculateSignInfluence(natalSunSign, transitSunSign);
    const moonSignScore = calculateSignInfluence(natalMoonSign, transitMoonSign);
    
    // Use actual player signs if available, otherwise calculate compatibility
    const mercurySignScore = player.mercury_sign
      ? calculatePlanetaryInfluence('mercury', player.mercury_sign, ephemeris.mercury_sign)
      : calculateSignInfluence(natalSunSign, ephemeris.mercury_sign); // fallback to sun sign
      
    const venusSignScore = player.venus_sign
      ? calculatePlanetaryInfluence('venus', player.venus_sign, ephemeris.venus_sign)
      : calculateSignInfluence(natalSunSign, ephemeris.venus_sign);
      
    const marsSignScore = player.mars_sign
      ? calculatePlanetaryInfluence('mars', player.mars_sign, ephemeris.mars_sign)
      : calculateSignInfluence(natalSunSign, ephemeris.mars_sign);
      
    const jupiterSignScore = player.jupiter_sign
      ? calculatePlanetaryInfluence('jupiter', player.jupiter_sign, ephemeris.jupiter_sign)
      : calculateSignInfluence(natalSunSign, ephemeris.jupiter_sign);
    
    // Calculate aspect influences
    const sunMarsAspect = calculateAspect('sun', 'mars', ephemeris.aspects || {});
    const sunSaturnAspect = calculateAspect('sun', 'saturn', ephemeris.aspects || {});
    const sunJupiterAspect = calculateAspect('sun', 'jupiter', ephemeris.aspects || {});

    const factors = {
      sun_sign: sunSignScore / 100,
      moon_sign: moonSignScore / 100,
      natal_to_transit_aspects: ephemeris.natal_to_transit_aspects || 0.5,
      elemental_balance: ephemeris.elemental_balance || 0.5,
      modalities_balance: ephemeris.modalities_balance || 0.5,
      moon_phase: moonPhaseScore / 100,
      mercury_sign: calculateMercuryInfluence(ephemeris.mercury_sign || ''),
      venus_sign: calculateVenusInfluence(ephemeris.venus_sign || ''),
      mars_sign: calculateMarsInfluence(ephemeris.mars_sign || ''),
      jupiter_sign: calculateJupiterInfluence(ephemeris.jupiter_sign || ''),
      mercury_retrograde: ephemeris.mercury_retrograde ? 1.0 : 0.0,
      sun_mars_aspect: ephemeris.sun_mars_aspect || 0.5,
      sun_saturn_aspect: ephemeris.sun_saturn_aspect || 0.5,
      sun_jupiter_aspect: ephemeris.sun_jupiter_aspect || 0.5
    };

    // Calculate weighted scores
    const weightedScores = {
      sun_sign: factors.sun_sign * weights.sun_sign,
      moon_sign: factors.moon_sign * weights.moon_sign,
      natal_to_transit_aspects: factors.natal_to_transit_aspects * weights.natal_to_transit_aspects,
      elemental_balance: factors.elemental_balance * weights.elemental_balance,
      modalities_balance: factors.modalities_balance * weights.modalities_balance,
      moon_phase: factors.moon_phase * weights.moon_phase,
      mercury_sign: factors.mercury_sign * weights.mercury_sign,
      venus_sign: factors.venus_sign * weights.venus_sign,
      mars_sign: factors.mars_sign * weights.mars_sign,
      jupiter_sign: factors.jupiter_sign * weights.jupiter_sign,
      mercury_retrograde: factors.mercury_retrograde * weights.mercury_retrograde,
      sun_mars_aspect: factors.sun_mars_aspect * weights.sun_mars_aspect,
      sun_saturn_aspect: factors.sun_saturn_aspect * weights.sun_saturn_aspect,
      sun_jupiter_aspect: factors.sun_jupiter_aspect * weights.sun_jupiter_aspect
    };

    // Calculate total weight and final score
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const score = totalWeight > 0 
      ? Object.values(weightedScores).reduce((sum, ws) => sum + ws, 0) / totalWeight 
      : 0.5; // Default to neutral score if no weights

    return {
      score: Math.min(Math.max(0, score), 1), // Ensure score is between 0 and 1
      factors,
      weightedScores,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in calculateAIS:', error);
    throw new Error(`Failed to calculate AIS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Helper function to calculate sign compatibility
  function calculateSignCompatibility(sign1: string | undefined, sign2: string | undefined): number {
    if (!sign1 || !sign2) return 0.5;
    
    // Simple compatibility: same sign is best, same element is good, otherwise neutral
    if (sign1 === sign2) return 1.0;
    
    const elements: Record<string, string[]> = {
      fire: ['Aries', 'Leo', 'Sagittarius'],
      earth: ['Taurus', 'Virgo', 'Capricorn'],
      air: ['Gemini', 'Libra', 'Aquarius'],
      water: ['Cancer', 'Scorpio', 'Pisces']
    };
    
    // Find elements for each sign
    let element1 = '';
    let element2 = '';
    
    for (const [element, signs] of Object.entries(elements)) {
      if (signs.includes(sign1)) element1 = element;
      if (signs.includes(sign2)) element2 = element;
      if (element1 && element2) break;
    }
    
    if (element1 === element2) return 0.8; // Same element
    
    // Compatible elements
    const compatiblePairs = [
      ['fire', 'air'],
      ['air', 'fire'],
      ['earth', 'water'],
      ['water', 'earth']
    ];
    
    if (compatiblePairs.some(([e1, e2]) => e1 === element1 && e2 === element2)) {
      return 0.6;
    }
    
    return 0.4; // Incompatible elements
  }
  
  // Planet influence calculations are now defined outside this function

  // Handle missing or undefined values in the ephemeris
  const safeEphemeris: Ephemeris = {
    ...ephemeris as Ephemeris,
    moon_phase: ephemeris.moon_phase ?? 0,
    mercury_retrograde: ephemeris.mercury_retrograde ?? false,
    sun_mars_aspect: ephemeris.sun_mars_aspect ?? 0,
    sun_saturn_aspect: ephemeris.sun_saturn_aspect ?? 0,
    sun_jupiter_aspect: ephemeris.sun_jupiter_aspect ?? 0,
    natal_to_transit_aspects: ephemeris.natal_to_transit_aspects ?? 0,
    elemental_balance: ephemeris.elemental_balance ?? 0,
    modalities_balance: ephemeris.modalities_balance ?? 0,
    date: ephemeris.date || new Date().toISOString(),
    moon_sign: ephemeris.moon_sign || '',
    mercury_sign: ephemeris.mercury_sign || '',
    venus_sign: ephemeris.venus_sign || '',
    mars_sign: ephemeris.mars_sign || '',
    jupiter_sign: ephemeris.jupiter_sign || '',
    saturn_sign: ephemeris.saturn_sign || '',
    sun_sign: ephemeris.sun_sign || ''
  };

  // Calculate sign scores (0-100 scale) after safeEphemeris is defined
  const sunSignScore = safeEphemeris.sun_sign ? 75 : 50; // Default score if no sun sign
  const moonSignScore = safeEphemeris.moon_sign ? 70 : 50; // Default score if no moon sign
  const moonPhaseScore = safeEphemeris.moon_phase ? (safeEphemeris.moon_phase * 100) : 50; // Convert 0-1 to 0-100

  try {
    // Calculate the final score using the safe ephemeris data
    const finalScore = calculateFinalScore(safeEphemeris, weights);
    
    return {
      score: finalScore,
      factors: {
        sun_sign: sunSignScore / 100,
        moon_sign: moonSignScore / 100,
        natal_to_transit_aspects: safeEphemeris.natal_to_transit_aspects,
        elemental_balance: safeEphemeris.elemental_balance,
        modalities_balance: safeEphemeris.modalities_balance,
        moon_phase: moonPhaseScore / 100,
        mercury_sign: calculateMercuryInfluence(safeEphemeris.mercury_sign || ''),
        venus_sign: calculateVenusInfluence(safeEphemeris.venus_sign || ''),
        mars_sign: calculateMarsInfluence(safeEphemeris.mars_sign || ''),
        jupiter_sign: calculateJupiterInfluence(safeEphemeris.jupiter_sign || ''),
        mercury_retrograde: safeEphemeris.mercury_retrograde ? 1 : 0,
        sun_mars_aspect: safeEphemeris.sun_mars_aspect,
        sun_saturn_aspect: safeEphemeris.sun_saturn_aspect,
        sun_jupiter_aspect: safeEphemeris.sun_jupiter_aspect
      },
      weightedScores: {
        sun_sign: (sunSignScore / 100) * weights.sun_sign,
        moon_sign: (moonSignScore / 100) * weights.moon_sign,
        natal_to_transit_aspects: safeEphemeris.natal_to_transit_aspects * weights.natal_to_transit_aspects,
        elemental_balance: safeEphemeris.elemental_balance * weights.elemental_balance,
        modalities_balance: safeEphemeris.modalities_balance * weights.modalities_balance,
        moon_phase: (moonPhaseScore / 100) * weights.moon_phase,
        mercury_sign: calculateMercuryInfluence(safeEphemeris.mercury_sign || '') * weights.mercury_sign,
        venus_sign: calculateVenusInfluence(safeEphemeris.venus_sign || '') * weights.venus_sign,
        mars_sign: calculateMarsInfluence(safeEphemeris.mars_sign || '') * weights.mars_sign,
        jupiter_sign: calculateJupiterInfluence(safeEphemeris.jupiter_sign || '') * weights.jupiter_sign,
        mercury_retrograde: (safeEphemeris.mercury_retrograde ? 1 : 0) * weights.mercury_retrograde,
        sun_mars_aspect: safeEphemeris.sun_mars_aspect * weights.sun_mars_aspect,
        sun_saturn_aspect: safeEphemeris.sun_saturn_aspect * weights.sun_saturn_aspect,
        sun_jupiter_aspect: safeEphemeris.sun_jupiter_aspect * weights.sun_jupiter_aspect
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in AIS calculation:', error);
    return {
      score: 0.5, // Neutral score on error
      factors: {
        sun_sign: 0.5,
        moon_sign: 0.5,
        natal_to_transit_aspects: 0.5,
        elemental_balance: 0.5,
        modalities_balance: 0.5,
        moon_phase: 0.5,
        mercury_sign: 0.5,
        venus_sign: 0.5,
        mars_sign: 0.5,
        jupiter_sign: 0.5,
        mercury_retrograde: 0.5,
        sun_mars_aspect: 0.5,
        sun_saturn_aspect: 0.5,
        sun_jupiter_aspect: 0.5
      },
      weightedScores: {
        sun_sign: 0.5 * weights.sun_sign,
        moon_sign: 0.5 * weights.moon_sign,
        natal_to_transit_aspects: 0.5 * weights.natal_to_transit_aspects,
        elemental_balance: 0.5 * weights.elemental_balance,
        modalities_balance: 0.5 * weights.modalities_balance,
        moon_phase: 0.5 * weights.moon_phase,
        mercury_sign: 0.5 * weights.mercury_sign,
        venus_sign: 0.5 * weights.venus_sign,
        mars_sign: 0.5 * weights.mars_sign,
        jupiter_sign: 0.5 * weights.jupiter_sign,
        mercury_retrograde: 0.5 * weights.mercury_retrograde,
        sun_mars_aspect: 0.5 * weights.sun_mars_aspect,
        sun_saturn_aspect: 0.5 * weights.sun_saturn_aspect,
        sun_jupiter_aspect: 0.5 * weights.sun_jupiter_aspect
      },
      error: error instanceof Error ? error.message : 'Unknown error in AIS calculation',
      timestamp: new Date().toISOString()
    };
  }
}

// Planet influence calculations - moved outside for better scoping
function calculateMercuryInfluence(sign: string): number {
  // Mercury rules Gemini and Virgo
  if (['Gemini', 'Virgo'].includes(sign)) return 0.9;
  return 0.5; // Neutral influence for other signs
}

function calculateVenusInfluence(sign: string): number {
  // Venus rules Taurus and Libra
  if (['Taurus', 'Libra'].includes(sign)) return 0.9;
  return 0.5; // Neutral influence for other signs
}

function calculateMarsInfluence(sign: string): number {
  // Mars rules Aries and co-rules Scorpio
  if (['Aries', 'Scorpio'].includes(sign)) return 0.9;
  return 0.5; // Neutral influence for other signs
}

function calculateJupiterInfluence(sign: string): number {
  // Jupiter rules Sagittarius and co-rules Pisces
  if (['Sagittarius', 'Pisces'].includes(sign)) return 0.9;
  return 0.5; // Neutral influence for other signs
}

// Helper function to calculate moon phase score (0-1 scale where 0.5 is full moon, 0/1 is new moon)
function calculateMoonPhaseScore(moonPhase: number): number {
  // Convert moon phase to a score where 0.5 (full moon) is best, 0/1 (new moon) is worst
  return 1 - Math.abs(moonPhase - 0.5) * 2;
}

// Calculate sign influence based on compatibility
function calculateSignInfluence(natalSign: string, transitSign: string): number {
  return calculateSignCompatibility(natalSign, transitSign);
}

// Calculate planetary influence based on sign and aspects
function calculatePlanetaryInfluence(
  planet: string,
  natalSign: string,
  transitSign: string
): number {
  
  // Base score from sign compatibility
  const signScore = calculateSignCompatibility(natalSign, transitSign);
  
  // Apply planet-specific adjustments
  switch (planet.toLowerCase()) {
    case 'mercury':
      return signScore * 1.1; // Slight boost for Mercury's influence
    case 'venus':
      return signScore * 1.05; // Small boost for Venus
    case 'mars':
      return signScore * 1.15; // Stronger influence from Mars
    case 'jupiter':
      return signScore * 1.2; // Strong positive influence
    default:
      return signScore;
  }
}

// Calculate natal-to-transit aspects
function calculateNatalToTransitAspects(
  player: Player,
  ephemeris: Partial<Ephemeris>
): number {
  
  // Ensure we have the required data
  if (!player.aspects || !ephemeris.aspects) {
    throw new Error('Missing required aspects data for natal-to-transit calculation');
  }

  // Count matching aspects between natal and transit
  let matchingAspects = 0;
  let totalAspects = 0;
  
  for (const [planet, aspects] of Object.entries(player.aspects)) {
    if (typeof aspects === 'object' && aspects !== null) {
      for (const [aspect, value] of Object.entries(aspects)) {
        if (ephemeris.aspects[`${planet}_${aspect}`] !== undefined) {
          matchingAspects++;
        }
        totalAspects++;
      }
    }
  }
  
  return totalAspects > 0 ? matchingAspects / totalAspects : 0.5;
}

// Calculate elemental balance score
function calculateElementalBalanceScore(elements: { fire: number; earth: number; air: number; water: number }): number {
  // Ideal balance would be 25% for each element
  const ideal = 25;
  const imbalances = [
    Math.abs(elements.fire - ideal),
    Math.abs(elements.earth - ideal),
    Math.abs(elements.air - ideal),
    Math.abs(elements.water - ideal)
  ];
  
  // Calculate average deviation from ideal
  const avgDeviation = imbalances.reduce((sum, d) => sum + d, 0) / 4;
  
  // Convert to 0-1 score (lower deviation is better)
  return 1 - (avgDeviation / 100);
}

// Calculate modalities balance score
function calculateModalitiesBalanceScore(modalities: { cardinal: number; fixed: number; mutable: number }): number {
  // Ideal balance would be ~33.3% for each modality
  const ideal = 33.3;
  const imbalances = [
    Math.abs(modalities.cardinal - ideal),
    Math.abs(modalities.fixed - ideal),
    Math.abs(modalities.mutable - ideal)
  ];
  
  // Calculate average deviation from ideal
  const avgDeviation = imbalances.reduce((sum, d) => sum + d, 0) / 3;
  
  // Convert to 0-1 score (lower deviation is better)
  return 1 - (avgDeviation / 100);
}

// Calculate sign compatibility between two signs (0-1 scale)
function calculateSignCompatibility(sign1: string, sign2: string): number {
  
  // Same sign is most compatible
  if (sign1.toLowerCase() === sign2.toLowerCase()) return 1.0;
  
  // Define sign elements
  const elements: Record<string, string[]> = {
    fire: ['aries', 'leo', 'sagittarius'],
    earth: ['taurus', 'virgo', 'capricorn'],
    air: ['gemini', 'libra', 'aquarius'],
    water: ['cancer', 'scorpio', 'pisces']
  };
  
  // Find elements for each sign
  let element1 = '';
  let element2 = '';
  
  for (const [element, signs] of Object.entries(elements)) {
    if (signs.includes(sign1.toLowerCase())) element1 = element;
    if (signs.includes(sign2.toLowerCase())) element2 = element;
    if (element1 && element2) break;
  }
  
  // Same element is highly compatible
  if (element1 === element2) return 0.8;
  
  // Compatible elements (fire/air, earth/water)
  const compatiblePairs = [
    ['fire', 'air'],
    ['air', 'fire'],
    ['earth', 'water'],
    ['water', 'earth']
  ];
  
  if (compatiblePairs.some(([e1, e2]) => e1 === element1 && e2 === element2)) {
    return 0.6;
  }
  
  // Incompatible elements
  return 0.4;
}

// Helper function to calculate the final score from all factors
function calculateFinalScore(ephemeris: Ephemeris, weights: AstrologicalWeights): number {
  // Sum all weighted scores
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0.5; // Neutral score if no weights
  
  // Calculate weighted sum of all factors
  const weightedSum = 
    (ephemeris.sun_sign ? 0.5 * weights.sun_sign : 0) + // Placeholder for sun sign
    (ephemeris.moon_sign ? 0.5 * weights.moon_sign : 0) + // Placeholder for moon sign
    (ephemeris.natal_to_transit_aspects * weights.natal_to_transit_aspects) +
    (ephemeris.elemental_balance * weights.elemental_balance) +
    (ephemeris.modalities_balance * weights.modalities_balance) +
    (ephemeris.moon_phase * weights.moon_phase) +
    (calculateMercuryInfluence(ephemeris.mercury_sign) * weights.mercury_sign) +
    (calculateVenusInfluence(ephemeris.venus_sign) * weights.venus_sign) +
    (calculateMarsInfluence(ephemeris.mars_sign) * weights.mars_sign) +
    (calculateJupiterInfluence(ephemeris.jupiter_sign) * weights.jupiter_sign) +
    ((ephemeris.mercury_retrograde ? 1 : 0) * weights.mercury_retrograde) +
    (ephemeris.sun_mars_aspect * weights.sun_mars_aspect) +
    (ephemeris.sun_saturn_aspect * weights.sun_saturn_aspect) +
    (ephemeris.sun_jupiter_aspect * weights.sun_jupiter_aspect);
  
  // Normalize to 0-1 range
  return Math.max(0, Math.min(1, weightedSum / totalWeight));
}

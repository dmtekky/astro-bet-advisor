/**
 * Standardized Astrological Score Calculator
 * 
 * This module provides a standardized implementation of player astrological influence scoring.
 * It is based on the comprehensive formula developed in histogramAstroScores.cjs.
 * The scoring is deterministic and takes into account:
 * - Planetary positions and weights
 * - Elemental and modal balance
 * - Moon phase
 * - Dynamic aspect bonuses by date
 * - Universal base point boost
 * - Full/new moon bonus
 */

import { generatePlayerAstroData } from './playerAstroService';

// ----------------------
// Type Definitions
// ----------------------

interface PlanetWeight {
  [key: string]: number;
}

interface AspectScore {
  [key: string]: number;
}

interface ElementalWeight {
  fire: number;
  earth: number;
  air: number;
  water: number;
}

interface ModalityWeight {
  cardinal: number;
  fixed: number;
  mutable: number;
}

interface SeasonalWeights {
  elements: ElementalWeight;
  modalities: ModalityWeight;
}

interface Element {
  percentage?: number;
  value?: number;
}

interface Elements {
  fire?: Element;
  earth?: Element;
  air?: Element;
  water?: Element;
  dominantElement?: string;
}

interface ElementalBalance {
  fire?: number | { percentage: number };
  earth?: number | { percentage: number };
  air?: number | { percentage: number };
  water?: number | { percentage: number };
  dominantElement?: string;
}

interface Modality {
  percentage?: number;
  value?: number;
}

interface Modalities {
  cardinal?: Modality;
  fixed?: Modality;
  mutable?: Modality;
}

interface DominantPlanet {
  planet?: string;
  score?: number;
}

interface DominantPlanets {
  primary?: string;
  secondary?: string;
}

interface Aspect {
  type?: string;
  orb?: number;
  orbValue?: number;
}

interface AstroData {
  elements?: Elements | Record<string, any>;
  modalities?: Modalities | Record<string, any>;
  dominantPlanets?: DominantPlanets | DominantPlanet[];
  moonPhase?: number | { value: number };
  value: number;
  aspects?: Array<Aspect | { pair: string; type: string | null }>;
}

interface Player {
  id?: number;
  player_id?: number;
  name?: string;
  player_name?: string;
  player_full_name?: string;
  player_first_name?: string;
  player_last_name?: string;
  birth_date?: string;
  player_birth_date?: string;
  birth_city?: string;
  player_birth_city?: string;
  birth_country?: string;
  player_birth_country?: string;
  birth_location?: any;
  stats_batting_average?: number;
  stats_era?: number;
  stats_avg?: number;
  astro_influence_score?: number;
}

// ----------------------
// Constants
// ----------------------

const PLANET_WEIGHTS: PlanetWeight = {
  sun: 4.5,
  moon: 4.0,
  mercury: 2.5,
  venus: 3.2,
  mars: 4.0,
  jupiter: 3.8,
  saturn: 3.5,
  uranus: 2.8,
  neptune: 2.5,
  pluto: 3.2,
};

const ASPECT_SCORES: AspectScore = {
  conjunction: 10,
  opposition: 8,
  square: 6,
  trine: 7,
  sextile: 4,
  quincunx: 3,
  'semi-sextile': 2,
  'semi-square': 2,
  'sesqui-quadrate': 2,
  quintile: 3,
  'bi-quintile': 3,
};

// ----------------------
// Function Implementations
// ----------------------

export function getCurrentSeason(date: Date): string {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // Northern hemisphere seasons
  if ((month === 3 && day >= 20) || (month === 4) || (month === 5) || (month === 6 && day < 21)) {
    return 'Spring';
  } else if ((month === 6 && day >= 21) || (month === 7) || (month === 8) || (month === 9 && day < 22)) {
    return 'Summer';
  } else if ((month === 9 && day >= 22) || (month === 10) || (month === 11) || (month === 12 && day < 21)) {
    return 'Fall';
  } else {
    return 'Winter';
  }
}

/**
 * Gets seasonal weights for elements and modalities
 * @param date - The date to check
 * @returns Object containing weights for elements and modalities
 */
export function getSeasonalWeights(date: Date): SeasonalWeights {
  const season = getCurrentSeason(date);
  
  // Base weights
  const elementWeights: ElementalWeight = {
    'fire': 1,
    'earth': 1,
    'air': 1,
    'water': 1
  };
  
  const modalityWeights: ModalityWeight = {
    'cardinal': 1,
    'fixed': 1,
    'mutable': 1
  };
  
  // Adjust weights based on season
  switch (season) {
    case 'Spring':
      elementWeights.fire = 1.2;
      elementWeights.water = 1.15;
      modalityWeights.cardinal = 1.2;
      break;
    case 'Summer':
      elementWeights.fire = 1.15;
      elementWeights.air = 1.1;
      modalityWeights.fixed = 1.15;
      break;
    case 'Fall':
      elementWeights.earth = 1.15;
      elementWeights.air = 1.2;
      modalityWeights.mutable = 1.15;
      break;
    case 'Winter':
      elementWeights.earth = 1.1;
      elementWeights.water = 1.2;
      modalityWeights.fixed = 1.1;
      break;
  }
  
  return { elements: elementWeights, modalities: modalityWeights };
}

/**
 * Calculate the astrological influence score for a player
 * 
 * @param player - The player data with birth_date
 * @param currentDate - Optional current date (defaults to now)
 * @returns - A score from 0-100 representing astrological influence
 */
export async function calculateAstroInfluenceScore(player: any, currentDate?: Date): Promise<number> {
  try {
    if (!player || !player.birth_date) {
      return 0;
    }

    const date = currentDate || new Date();
    
    // Generate astrological data for the player
    const astroData = await generatePlayerAstroData(player.birth_date, {
      city: player.birth_city,
      country: player.birth_country
    });

    if (!astroData) {
      return 0;
    }
    
    const seasonalWeights = getSeasonalWeights(date);
    const seasonFactor = 0.25; // Base season factor
    
    // Calculate moon phase score
    let moonPhaseValue = 0;
    let moonPhaseAdjusted = 0;
    
    if (astroData.moonPhase !== undefined) {
      moonPhaseValue = typeof astroData.moonPhase === 'number' 
        ? astroData.moonPhase 
        : (astroData.moonPhase as any)?.value || 0;
        
      // Adjust moon phase based on season
      moonPhaseAdjusted = moonPhaseValue * (1 + seasonFactor);
    }

    // Calculate elemental score
    let elementalScore = 0;
    
    // Defensive extraction for elemental balance
    const elements = (astroData.elements && typeof astroData.elements === 'object') 
      ? astroData.elements 
      : {} as Record<string, any>;
    const getElementValue = (element: any): number => {
      if (element && typeof element === 'object' && 'percentage' in element) {
        return Number(element.percentage) || 0;
      }
      return 0;
    };
    
    const fireValue = getElementValue(elements.fire);
    const earthValue = getElementValue(elements.earth);
    const airValue = getElementValue(elements.air);
    const waterValue = getElementValue(elements.water);

    // Convert to array of element values with seasonal weights
    const elementalScores = [
      { element: 'fire', value: fireValue, power: seasonalWeights.elements.fire },
      { element: 'earth', value: earthValue, power: seasonalWeights.elements.earth },
      { element: 'air', value: airValue, power: seasonalWeights.elements.air },
      { element: 'water', value: waterValue, power: seasonalWeights.elements.water }
    ];

    // Get dominant element
    let dominantElement: string | undefined;
    
    // Safely access dominantElement from elements object
    if (elements && typeof elements === 'object') {
      const elementsRecord = elements as Record<string, any>;
      if (elementsRecord.dominantElement && typeof elementsRecord.dominantElement === 'string') {
        dominantElement = elementsRecord.dominantElement.toLowerCase();
      } else if (Array.isArray(elements)) {
        // If elements is an array, get the highest valued one
        const sorted = elements
          .filter((el): el is { element: string; value: number } => 
            el && typeof el === 'object' && 'element' in el && 'value' in el
          )
          .sort((a, b) => (b.value || 0) - (a.value || 0));
        dominantElement = sorted[0]?.element?.toLowerCase();
      } else if ('fire' in elements || 'earth' in elements || 'air' in elements || 'water' in elements) {
        // Handle object with element values
        const elementValues = [
          { element: 'fire', value: getElementValue(elements.fire) },
          { element: 'earth', value: getElementValue(elements.earth) },
          { element: 'air', value: getElementValue(elements.air) },
          { element: 'water', value: getElementValue(elements.water) }
        ];
        const sorted = elementValues.sort((a, b) => (b.value || 0) - (a.value || 0));
        dominantElement = sorted[0]?.element;
      }
    }
    
    if (dominantElement) {
      const dominantScore = elementalScores.find(e => e.element === dominantElement);
      if (dominantScore) {
        elementalScore = (dominantScore.value / 100) * dominantScore.power;
      }
    }
        
    if (elementalScore === 0) {
      // Fallback if no dominant element
      elementalScore = Math.max(...elementalScores.map(e => (e.value / 100) * e.power));
    }
    
    // Calculate modal score
    let modalScore = 0;
    if (astroData.modalities && typeof astroData.modalities === 'object') {
      const modalities: Record<string, any> = astroData.modalities;
      // Defensive extraction for modalities
      const cardinalValue = (modalities.cardinal && typeof modalities.cardinal === 'object' && 'percentage' in modalities.cardinal) 
        ? Number(modalities.cardinal.percentage) || 0 
        : 0;
      const fixedValue = (modalities.fixed && typeof modalities.fixed === 'object' && 'percentage' in modalities.fixed) 
        ? Number(modalities.fixed.percentage) || 0 
        : 0;
      const mutableValue = (modalities.mutable && typeof modalities.mutable === 'object' && 'percentage' in modalities.mutable) 
        ? Number(modalities.mutable.percentage) || 0 
        : 0;
      // Modality scores with seasonal weights
      modalScore = Math.max(
        (cardinalValue / 100) * seasonalWeights.modalities.cardinal,
        (fixedValue / 100) * seasonalWeights.modalities.fixed,
        (mutableValue / 100) * seasonalWeights.modalities.mutable
      );
    } else {
      // Default modal score if not available
      modalScore = 0.5;
    }
    
    // Calculate planet score
    let dominantPlanetScore = 0;
    const planetScores: Record<string, number> = {};
    let totalPlanetScore = 0;
    
    if (astroData.dominantPlanets) {
      // Safely handle different data structures for dominant planets
      let primaryPlanet: string | undefined;
      let secondaryPlanet: string | undefined;
      
      // Handle array-style dominant planets
      if (Array.isArray(astroData.dominantPlanets) && astroData.dominantPlanets.length > 0) {
        // Sort by score if available
        const sorted = [...astroData.dominantPlanets].sort((a, b) => 
          (b.score || 0) - (a.score || 0)
        );
        primaryPlanet = sorted[0]?.planet?.toLowerCase();
        secondaryPlanet = sorted[1]?.planet?.toLowerCase();
      } 
      // Handle object-style dominant planets
      else if (typeof astroData.dominantPlanets === 'object') {
        const domPlanets = astroData.dominantPlanets as any;
        primaryPlanet = domPlanets.primary?.toLowerCase();
        secondaryPlanet = domPlanets.secondary?.toLowerCase();
      }
      
      // Calculate score for each planet
      Object.entries(PLANET_WEIGHTS).forEach(([planetName, weight]) => {
        // Base score is the weight
        const baseScore = weight;
        
        // Add significant bonuses for primary and secondary planets
        const isPrimary = primaryPlanet === planetName;
        const isSecondary = secondaryPlanet === planetName;
        const primaryBonus = isPrimary ? baseScore * 0.5 : 0;
        const secondaryBonus = isSecondary ? baseScore * 0.25 : 0;
        
        const score = baseScore + primaryBonus + secondaryBonus;
        
        planetScores[planetName] = score;
        totalPlanetScore += score;
      });
      
      // Enhanced aspect bonus with dynamic date-based weighting
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate dynamic aspect bonus based on current date (cycles every 30 days)
      const aspectCycle = (dayOfYear % 30) / 30; // 0-1 value that cycles every month
      const dynamicAspectMultiplier = 0.8 + (Math.sin(aspectCycle * Math.PI * 2) * 0.2); // 0.8-1.0 multiplier
      
      // Calculate aspect bonus with dynamic weighting
      const aspectBonus = (astroData.aspects || []).reduce((total, aspect) => {
        if (!aspect) return total;
        
        // Handle different aspect types
        let baseScore = 1;
        if (typeof aspect === 'object' && 'type' in aspect && aspect.type) {
          const aspectType = typeof aspect.type === 'string' ? aspect.type.toLowerCase() : '';
          baseScore = ASPECT_SCORES[aspectType] || 1;
        }
        
        // Safely handle orb value
        let orbValue = 0;
        if (aspect && typeof aspect === 'object' && 'orb' in aspect) {
          orbValue = typeof aspect.orb === 'number' ? aspect.orb : 0;
        } else if (aspect && typeof aspect === 'object' && 'orbValue' in aspect) {
          orbValue = typeof (aspect as any).orbValue === 'number' ? (aspect as any).orbValue : 0;
        }
        
        // Apply orb penalty (closer to exact = stronger)
        const orbPenalty = 1 - (Math.min(orbValue, 10) / 20); // Max 10° orb, 50% penalty at max orb
        return total + (baseScore * orbPenalty * dynamicAspectMultiplier);
      }, 0);
      
      // Cap aspect bonus at 30 points (10% of max score)
      totalPlanetScore += Math.min(aspectBonus, 30);
      
      // Apply seasonal multiplier (deterministic based on date)
      const seasonMultiplier = 0.6 + (seasonFactor * 0.8); // 0.6-1.4 multiplier based on season
      totalPlanetScore *= seasonMultiplier;
      
      // Normalize to 0-1 range with higher potential max
      dominantPlanetScore = Math.min(1, totalPlanetScore / 40);
    }
    
    // Calculate aspect score
    let aspectsScore = 0;
    if (astroData.aspects && astroData.aspects.length > 0) {
      aspectsScore = Math.min(astroData.aspects.length / 10, 1);
    }
    
    // Define component weights
    const weights = {
      elemental: 0.175, // 17.5%
      planets: 0.825,   // 82.5%
      aspects: 0.03,    // 3%
      moon: 0.05,       // 5%
      modal: 0.02       // 2%
    };
    
    // Combine all scores with appropriate weighting
    let playerFactor = 1.0;
    if ((player && typeof player === 'object') && (player.stats_batting_average || player.stats_era || player.stats_avg)) {
      // Player performance adjustment - milder effect
      playerFactor = 1.0 + Math.max(
        (typeof player.stats_batting_average === 'number' ? player.stats_batting_average : 0) * 0.5,
        (typeof player.stats_era === 'number' && player.stats_era > 0 ? (1 / player.stats_era) * 0.1 : 0),
        (typeof player.stats_avg === 'number' ? player.stats_avg : 0) * 0.3
      );
      playerFactor = Math.min(1.3, Math.max(0.9, playerFactor));
    }
    
    // Calculate combined score
    const combinedScore = (
      (elementalScore * weights.elemental) +
      (modalScore * weights.modal) +
      (dominantPlanetScore * weights.planets) +
      (moonPhaseAdjusted * weights.moon) +
      (aspectsScore * weights.aspects)
    ) * 100 * playerFactor;
    
    // ---- Universal Base Point Boost & Full/New Moon Check ----
    // Note: In a real production environment, we'd need to:
    // 1. Query the DB for the max score to calculate the base boost
    // 2. Check if today is a full/new moon for the bonus
    // For this implementation, we'll just add a fixed boost
    
    // Apply universal boost (to push max scores to ~96)
    const universalBoost = 10; // Fixed boost, in production would be dynamic
    
    // Check for full/new moon bonus
    let moonBonus = 0;
    
    // Full moon: +5 points on phase = 0.5 ± 0.03 (about 1.5 days around full moon)
    const isFullMoon = Math.abs(moonPhaseValue - 0.5) < 0.03;
    
    // New moon: +5 points on phase < 0.03 or > 0.97 (about 1.5 days around new moon)
    const isNewMoon = moonPhaseValue < 0.03 || moonPhaseValue > 0.97;
    
    if (isFullMoon || isNewMoon) {
      moonBonus = 5;
    }
    
    // Final score with all bonuses
    const finalScore = Math.max(0, Math.min(100, combinedScore + universalBoost + moonBonus));
    
    return finalScore;
  } catch (error: any) {
    console.error('Error calculating astro influence score:', error);
    return 0; // Return a neutral score on error
  }
}

/**
 * Calculate the astrological influence score for a team
 * 
 * @param teamId - The team ID
 * @param players - Array of players on the team
 * @returns - A score from 0-100
 */
export async function calculateTeamAstroScore(teamId: string, players: any[]): Promise<number> {
  if (!players || players.length === 0) {
    return 50; // Neutral score for unknown team
  }
  
  try {
    // Calculate individual scores
    const playerScores: number[] = [];
    const currentDate = new Date();
    
    for (const player of players) {
      // Use cached score if available
      if (player.astro_influence_score !== undefined && player.astro_influence_score !== null) {
        playerScores.push(Number(player.astro_influence_score));
      } else if (player.birth_date) {
        const score = await calculateAstroInfluenceScore(player, currentDate);
        playerScores.push(score);
      }
    }
    
    if (playerScores.length === 0) {
      return 50; // Neutral score if no players have scores
    }
    
    // Weight starters higher in team calculation
    const weightedScores = playerScores.map((score, index) => {
      const isStarter = index < 9; // First 9 players are considered starters
      return score * (isStarter ? 1.5 : 1.0);
    });
    
    // Calculate team score (weighted average)
    const totalWeight = weightedScores.length * 1.0 + Math.min(9, weightedScores.length) * 0.5;
    const teamScore = weightedScores.reduce((sum, score) => sum + score, 0) / totalWeight;
    
    return Math.max(0, Math.min(100, teamScore));
  } catch (error) {
    console.error('Error calculating team astro score:', error);
    return 50; // Return a neutral score on error
  }
}

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

const { generatePlayerAstroData } = require('../scripts/playerAstroService.cjs');

// Planetary weights
const PLANET_WEIGHTS = {
  'sun': 4.5,
  'moon': 4.0,
  'mercury': 2.5,
  'venus': 3.2,
  'mars': 4.0,
  'jupiter': 3.8,
  'saturn': 3.5,
  'uranus': 2.8,
  'neptune': 2.5,
  'pluto': 3.2
};

// Aspect scores by type
const ASPECT_SCORES = {
  'conjunction': 10,  // Strongest aspect
  'opposition': 8,
  'square': 6,
  'trine': 7,
  'sextile': 4,
  'quincunx': 3,
  'semi-sextile': 2,
  'semi-square': 2,
  'sesqui-quadrate': 2,
  'quintile': 3,
  'bi-quintile': 3
};

/**
 * Gets the current season based on date
 * @param {Date} date - The date to check
 * @returns {string} - The current season (Spring, Summer, Fall, Winter)
 */
function getCurrentSeason(date) {
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
 * @param {Date} date - The date to check
 * @returns {Object} - Object containing weights for elements and modalities
 */
function getSeasonalWeights(date) {
  const season = getCurrentSeason(date);
  
  // Base weights
  const elementWeights = {
    'fire': 1,
    'earth': 1,
    'air': 1,
    'water': 1
  };
  
  const modalityWeights = {
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
 * @param {Object} player - The player data with birth_date
 * @param {Date} [currentDate] - Optional current date (defaults to now)
 * @returns {Promise<number>} - A score from 0-100 representing astrological influence
 */
async function calculateAstroInfluenceScore(player, currentDate) {
  try {
    // Handle different possible field names for birth date
    const playerBirthDate = player.player_birth_date || player.birth_date;
    
    if (!playerBirthDate) {
      return 0;
    }

    const date = currentDate || new Date();
    
    // Generate astrological data for the player
    const astroData = generatePlayerAstroData(
      playerBirthDate,
      {
        city: player.birth_city || player.player_birth_city,
        country: player.birth_country || player.player_birth_country
      },
      date
    );

    if (!astroData) {
      return 0;
    }
    
    // Get seasonal weights
    const seasonalWeights = getSeasonalWeights(date);
    const seasonFactor = 0.25; // Base season factor
    
    // Calculate moon phase score
    let moonPhaseValue = 0.5; // Default to half moon if not available
    
    if (astroData.moonPhase) {
      // Handle different potential formats
      if (typeof astroData.moonPhase === 'number') {
        moonPhaseValue = astroData.moonPhase;
      } else if (typeof astroData.moonPhase === 'object' && astroData.moonPhase.value !== undefined) {
        moonPhaseValue = astroData.moonPhase.value;
      }
    }
    
    const moonPhaseScore = (moonPhaseValue <= 0.5) 
      ? moonPhaseValue * 2 // Waxing (0-1.0)
      : (1 - moonPhaseValue) * 2; // Waning (1.0-0)
    
    // Apply seasonal adjustment to moon phase
    const seasonAdjustment = 0.6 + (seasonFactor * 0.4); // 0.6-1.0 adjustment
    const moonPhaseAdjusted = moonPhaseScore * seasonAdjustment;
    
    // Calculate elemental score
    let elementalScore = 0;
    
    if (astroData.elements) {
      // Extract element data safely
      const elements = astroData.elements;
      const fireValue = elements.fire ? (elements.fire.percentage || 0) : 0;
      const earthValue = elements.earth ? (elements.earth.percentage || 0) : 0;
      const airValue = elements.air ? (elements.air.percentage || 0) : 0;
      const waterValue = elements.water ? (elements.water.percentage || 0) : 0;
      
      // Convert to array of element values with seasonal weights
      const elementalScores = [
        { element: 'fire', value: fireValue, power: seasonalWeights.elements.fire },
        { element: 'earth', value: earthValue, power: seasonalWeights.elements.earth },
        { element: 'air', value: airValue, power: seasonalWeights.elements.air },
        { element: 'water', value: waterValue, power: seasonalWeights.elements.water }
      ];
      
      // Get dominant element
      let dominantElement;
      
      if (elements.dominantElement) {
        dominantElement = elements.dominantElement.toLowerCase();
      } else {
        // If no dominant element specified, use the highest value
        const maxElement = [...elementalScores].sort((a, b) => b.value - a.value)[0];
        dominantElement = maxElement.element;
      }
      
      // Scale by dominant element
      const dominantScore = elementalScores.find(e => e.element === dominantElement);
      if (dominantScore) {
        elementalScore = (dominantScore.value / 100) * dominantScore.power;
      } else {
        // Fallback if no dominant element
        elementalScore = Math.max(...elementalScores.map(e => (e.value / 100) * e.power));
      }
    }
    
    // Calculate modal score
    let modalScore = 0;
    if (astroData.modalities) {
      const modalities = astroData.modalities;
      
      // Safely extract modality values
      const cardinalValue = modalities.cardinal ? (modalities.cardinal.percentage || 0) : 0;
      const fixedValue = modalities.fixed ? (modalities.fixed.percentage || 0) : 0;
      const mutableValue = modalities.mutable ? (modalities.mutable.percentage || 0) : 0;
      
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
    const planetScores = {};
    let totalPlanetScore = 0;
    
    if (astroData.dominantPlanets) {
      // Safely handle different data structures for dominant planets
      let primaryPlanet;
      let secondaryPlanet;
      
      // Handle array-style dominant planets
      if (Array.isArray(astroData.dominantPlanets) && astroData.dominantPlanets.length > 0) {
        // Sort by score if available
        const sorted = [...astroData.dominantPlanets].sort((a, b) => 
          (b.score || 0) - (a.score || 0)
        );
        primaryPlanet = sorted[0] && sorted[0].planet ? sorted[0].planet.toLowerCase() : null;
        secondaryPlanet = sorted[1] && sorted[1].planet ? sorted[1].planet.toLowerCase() : null;
      } 
      // Handle object-style dominant planets
      else if (typeof astroData.dominantPlanets === 'object') {
        primaryPlanet = astroData.dominantPlanets.primary ? 
          astroData.dominantPlanets.primary.toLowerCase() : null;
        secondaryPlanet = astroData.dominantPlanets.secondary ? 
          astroData.dominantPlanets.secondary.toLowerCase() : null;
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
      
      // Calculate total aspect bonus with dynamic weighting
      const aspectBonus = (astroData.aspects || []).reduce((total, aspect) => {
        if (!aspect || !aspect.type) return total;
        const baseScore = ASPECT_SCORES[aspect.type.toLowerCase()] || 1;
        
        // Safely handle orb value
        let orbValue = 0;
        if (aspect.orb !== undefined) {
          // Direct orb value
          orbValue = typeof aspect.orb === 'number' ? aspect.orb : 0;
        } else if (typeof aspect === 'object') {
          // Try to find orb in the aspect object
          orbValue = aspect.orbValue || 0;
        }
        
        // Apply orb penalty (closer to exact = stronger)
        const orbPenalty = 1 - (Math.min(orbValue, 10) / 20); // Max 10° orb, 50% penalty at max orb
        return total + (baseScore * orbPenalty * dynamicAspectMultiplier);
      }, 0);
      
      // Cap aspect bonus at 30 points
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
    if (player.stats_batting_average || player.stats_era || player.stats_avg) {
      // Player performance adjustment - milder effect
      playerFactor = 1.0 + Math.max(
        (player.stats_batting_average || 0) * 0.5,
        (player.stats_era ? (1 / player.stats_era) * 0.1 : 0),
        (player.stats_avg || 0) * 0.3
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
    let finalScore = Math.max(0, Math.min(100, combinedScore + universalBoost + moonBonus));
    
    return finalScore;
  } catch (error) {
    console.error('Error calculating astro influence score:', error);
    return 50; // Return a neutral score on error
  }
}

/**
 * Calculate the astrological influence score for a team
 * @param {string} teamId - The team ID
 * @param {Array} players - Array of players on the team
 * @param {Date} [currentDate] - Optional current date (defaults to now)
 * @returns {Promise<number>} - A score from 0-100
 */
async function calculateTeamAstroScore(teamId, players, currentDate) {
  if (!players || players.length === 0) {
    return 50; // Neutral score for unknown team
  }
  
  try {
    // Calculate individual scores
    const playerScores = [];
    const date = currentDate || new Date();
    
    for (const player of players) {
      // Use cached score if available
      if (player.astro_influence_score !== undefined && player.astro_influence_score !== null) {
        playerScores.push(Number(player.astro_influence_score));
      } else if (player.birth_date || player.player_birth_date) {
        const score = await calculateAstroInfluenceScore(player, date);
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

module.exports = {
  calculateAstroInfluenceScore,
  calculateTeamAstroScore,
  getCurrentSeason,
  getSeasonalWeights
};

// Team Chemistry Calculation Utilities
import { getZodiacSign } from './zodiacUtils.js';

/**
 * INFRASTRUCTURE ENHANCEMENT: Team chemistry calculation now supports:
 * - Player role/position weighting
 * - Availability/injury status filtering/down-weighting
 * - Synergy/diversity bonuses for elemental distribution
 * - Hooks for astrological transits (stub)
 * - Hooks for historical chemistry calibration (stub)
 * - Extensible metadata for future features
 *
 * Player object should include:
 *   impact_score, astro_influence, birth_date, position/role, is_active, injury_status, etc.
 *
 * TODO: Implement real transit and historical logic where marked.
 */

// Define zodiac element mappings
const zodiacElements = {
  aries: 'fire',
  taurus: 'earth',
  gemini: 'air',
  cancer: 'water',
  leo: 'fire',
  virgo: 'earth',
  libra: 'air',
  scorpio: 'water',
  sagittarius: 'fire',
  capricorn: 'earth',
  aquarius: 'air',
  pisces: 'water'
};

// Define zodiac compatibility scores (-5 to 5, where positive is harmonious and negative is challenging)
const elementCompatibility = {
  fire: { fire: 3, earth: -3, air: 4, water: -4 },
  earth: { fire: -3, earth: 3, air: -2, water: 4 },
  air: { fire: 4, earth: -2, air: 3, water: -3 },
  water: { fire: -4, earth: 4, air: -3, water: 3 }
};

// Aspect types and their weights (in degrees)
const ASPECTS = {
  CONJUNCTION: { degrees: 0, orb: 8, weight: 0.8 },
  SEXTILE: { degrees: 60, orb: 4, weight: 1.2 },
  SQUARE: { degrees: 90, orb: 6, weight: -1.0 },
  TRINE: { degrees: 120, orb: 6, weight: 1.5 },
  OPPOSITION: { degrees: 180, orb: 8, weight: -1.2 }
};

// Calculate weighted player scores with role and availability support
export function calculatePlayerWeights(players) {
  if (!players || players.length === 0) return [];

  // Filter out unavailable players or down-weight them
  // (Set is_active=false or injury_status='out' to zero weight, or <1 for partial)
  // You may adjust this logic as needed.
  const AVAILABILITY_WEIGHTS = {
    active: 1.0,
    questionable: 0.7,
    day_to_day: 0.5,
    out: 0.0
  };

  // Role/position weighting (customize as needed)
  const ROLE_WEIGHTS = {
    pitcher: 1.2,
    catcher: 1.1,
    shortstop: 1.1,
    first_base: 1.05,
    second_base: 1.05,
    third_base: 1.05,
    outfield: 1.0,
    default: 1.0
  };

  // Normalize impact and astro influence
  const impactScores = players.map(p => p.impact_score || 0).filter(score => score > 0);
  const astroScores = players.map(p => p.astro_influence || 0).filter(score => score > 0);
  const minImpact = impactScores.length > 0 ? Math.min(...impactScores) : 0;
  const maxImpact = impactScores.length > 0 ? Math.max(...impactScores) : 100;
  const minAstro = astroScores.length > 0 ? Math.min(...astroScores) : 0;
  const maxAstro = astroScores.length > 0 ? Math.max(...astroScores) : 100;
  const impactRange = maxImpact - minImpact || 1;
  const astroRange = maxAstro - minAstro || 1;

  return players.map(player => {
    // Availability weighting
    let availabilityKey = 'active';
    if (player.injury_status && AVAILABILITY_WEIGHTS[player.injury_status] !== undefined) {
      availabilityKey = player.injury_status;
    } else if (player.is_active === false) {
      availabilityKey = 'out';
    }
    const availabilityWeight = AVAILABILITY_WEIGHTS[availabilityKey] ?? 1.0;

    // Role/position weighting
    let roleKey = 'default';
    if (player.position) {
      const pos = String(player.position).toLowerCase();
      if (pos.includes('pitcher') || pos === 'p') roleKey = 'pitcher';
      else if (pos.includes('catcher') || pos === 'c') roleKey = 'catcher';
      else if (pos.includes('shortstop') || pos === 'ss') roleKey = 'shortstop';
      else if (pos.includes('first') || pos === '1b') roleKey = 'first_base';
      else if (pos.includes('second') || pos === '2b') roleKey = 'second_base';
      else if (pos.includes('third') || pos === '3b') roleKey = 'third_base';
      else if (pos.includes('outfield') || pos.includes('of')) roleKey = 'outfield';
    }
    const roleWeight = ROLE_WEIGHTS[roleKey] ?? 1.0;

    // Normalize impact and astro
    const normalizedImpact = impactRange > 0 
      ? ((player.impact_score || 0) - minImpact) / impactRange 
      : 0.5;
    const normalizedAstro = astroRange > 0
      ? ((player.astro_influence || 0) - minAstro) / astroRange
      : 0.5;
    // Combined score (customize weighting)
    const combinedScore = (normalizedImpact * 0.6) + (normalizedAstro * 0.4);
    // Final player weight
    let weight = 0.2 + (0.8 * combinedScore);
    weight *= availabilityWeight * roleWeight;

    // Zodiac info
    let zodiacSign = null;
    let element = null;
    if (player.birth_date) {
      zodiacSign = getZodiacSign(player.birth_date);
      element = zodiacSign ? zodiacElements[zodiacSign.toLowerCase()] : null;
    }

    return {
      ...player,
      normalizedImpact,
      normalizedAstro,
      combinedScore,
      weight,
      zodiacSign,
      element,
      availabilityWeight,
      roleWeight
    };
  });
}

// Calculate elemental balance with synergy/diversity bonuses
export function calculateElementalBalance(weightedPlayers) {
  // Filter players that have astrological data
  const playersWithElements = weightedPlayers.filter(p => p.element);
  
  if (playersWithElements.length === 0) {
    return {
      fire: 25, 
      earth: 25, 
      air: 25, 
      water: 25, 
      balance: 50
    };
  }
  
  // Calculate weighted elemental distribution
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  let totalWeight = 0;

  playersWithElements.forEach(player => {
    if (player.element) {
      elements[player.element] += player.weight;
      totalWeight += player.weight;
    }
  });

  // Calculate raw percentages that add up to 100%
  const total = elements.fire + elements.earth + elements.air + elements.water;
  
  // Calculate raw percentages
  const rawPercentages = {
    fire: (elements.fire / total) * 100,
    earth: (elements.earth / total) * 100,
    air: (elements.air / total) * 100,
    water: (elements.water / total) * 100
  };

  // Round the percentages while ensuring they add up to 100%
  const rounded = {
    fire: Math.round(rawPercentages.fire),
    earth: Math.round(rawPercentages.earth),
    air: Math.round(rawPercentages.air),
    water: Math.round(rawPercentages.water)
  };

  // Adjust for rounding errors
  const sum = Object.values(rounded).reduce((a, b) => a + b, 0);
  const diff = 100 - sum;
  
  // Adjust the largest element to make the sum 100
  if (diff !== 0) {
    const maxElement = Object.entries(rounded).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    rounded[maxElement] += diff;
  }

  // Calculate balance score (how close to 25% each)
  const ideal = 25;
  const deviations = [
    Math.abs(rounded.fire - ideal),
    Math.abs(rounded.earth - ideal),
    Math.abs(rounded.air - ideal),
    Math.abs(rounded.water - ideal)
  ];
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / 4;
  const balance = Math.max(0, 100 - (avgDeviation * 4)); // Scale to 0-100

  // Synergy: Bonus for high concentration in one element
  const maxElement = Math.max(...Object.values(rounded));
  let synergyBonus = 0;
  if (maxElement >= 60) synergyBonus = 5; // e.g. "all-fire" team
  
  // Diversity: Bonus for all elements present
  let diversityBonus = 0;
  if (Object.values(rounded).every(x => x > 10)) diversityBonus = 5;

  // Total chemistry element score
  const chemistryElementScore = Math.min(100, balance + synergyBonus + diversityBonus);

  return {
    ...rounded,
    balance,
    synergyBonus,
    diversityBonus,
    chemistryElementScore
  };
}

// Calculate aspects between players
export function calculateTeamAspects(weightedPlayers) {
  // Filter players with zodiac data
  const playersWithZodiac = weightedPlayers.filter(p => p.zodiacSign && p.element);
  
  if (playersWithZodiac.length < 2) {
    return {
      harmonyScore: 50,
      challengeScore: 20,
      netHarmony: 50,
      aspects: []
    };
  }

  let totalHarmony = 0;
  let totalChallenge = 0;
  let totalAspectWeight = 0;
  const aspects = [];

  // Get player zodiac positions (simplified to 30° per sign)
  const playerPositions = playersWithZodiac.map(player => ({
    ...player,
    position: (['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
               'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
              .indexOf(player.zodiacSign.toLowerCase()) * 30) + 15
  }));

  // Compare each player with every other player
  for (let i = 0; i < playerPositions.length; i++) {
    for (let j = i + 1; j < playerPositions.length; j++) {
      const player1 = playerPositions[i];
      const player2 = playerPositions[j];
      
      // Calculate angular distance between players (0-180°)
      const angleDiff = Math.abs(player1.position - player2.position) % 180;
      
      // Find closest aspect
      let bestAspect = null;
      let smallestDiff = 180;
      
      for (const [aspectName, aspect] of Object.entries(ASPECTS)) {
        const diff = Math.min(
          Math.abs(angleDiff - aspect.degrees),
          Math.abs(360 - angleDiff - aspect.degrees)
        );
        
        if (diff <= aspect.orb && diff < smallestDiff) {
          smallestDiff = diff;
          bestAspect = { name: aspectName, ...aspect };
        }
      }
      
      // If no aspect found, skip
      if (!bestAspect) continue;
      
      // Calculate aspect strength (1.0 at exact aspect, decreasing with orb)
      const strength = 1 - (smallestDiff / (bestAspect.orb * 2));
      
      // Get element compatibility (-5 to 5)
      const elementScore = elementCompatibility[player1.element][player2.element];
      
      // Calculate final score (-1 to 1) considering both aspect and elements
      const aspectEffect = bestAspect.weight * strength;
      const elementEffect = elementScore * 0.2; // Scale element effect
      let finalScore = (aspectEffect * 0.7) + (elementEffect * 0.3);
      
      // Apply player weights (impact scores)
      const weight = Math.sqrt(player1.weight * player2.weight); // Geometric mean
      const weightedScore = finalScore * weight;
      
      // Track harmony and challenges
      if (finalScore > 0) {
        totalHarmony += Math.abs(weightedScore);
      } else {
        totalChallenge += Math.abs(weightedScore);
      }
      totalAspectWeight += weight;
      
      // Record this aspect
      aspects.push({
        player1: player1.full_name,
        player2: player2.full_name,
        aspect: bestAspect.name,
        element1: player1.element,
        element2: player2.element,
        angle: angleDiff,
        strength: strength.toFixed(2),
        score: finalScore.toFixed(2),
        weight: weight.toFixed(2)
      });
    }
  }

  // Normalize scores (0-100)
  const aspectCount = aspects.length;
  
  // Calculate harmony and challenge scores with better distribution
  const harmonyScore = aspectCount > 0 
    ? Math.min(100, Math.round(50 + (totalHarmony / totalAspectWeight) * 50))
    : 50;
    
  const challengeScore = aspectCount > 0 
    ? Math.min(100, Math.round((totalChallenge / totalAspectWeight) * 100))
    : 20;
    
  // Calculate net harmony (0-100) with 70/30 weighting
  const netHarmony = Math.max(0, Math.min(100, 
    (harmonyScore * 0.7) - (challengeScore * 0.3)
  ));
  
  // Calculate base harmony and challenge scores with non-linear scaling
  const scaledHarmony = Math.pow(harmonyScore / 100, 1.5) * 100;
  const scaledChallenge = Math.pow(challengeScore / 100, 1.5) * 100;
  
  // Calculate base score with very strong emphasis on harmony over challenge
  const baseScore = (scaledHarmony * 0.9) - (scaledChallenge * 0.6);
  
  // Apply an extremely aggressive curve to create maximum spread
  const transformScore = (score) => {
    const normalized = Math.max(0, Math.min(100, score)) / 100;
    // Extremely steep curve to create maximum separation
    return 100 * (1 / (1 + Math.exp(-20 * (normalized - 0.65))));
  };
  
  // Calculate initial score with transform and scaling
  let finalScore = transformScore(baseScore * 1.05);
  
  // Add team size adjustment (smaller teams get a significant boost)
  const teamSizeFactor = Math.min(1, 15 / playerPositions.length);
  finalScore = finalScore * (0.7 + (teamSizeFactor * 0.6));
  
  // Add very significant random variation based on score level
  let randomVariation = 0;
  if (finalScore > 90) {
    randomVariation = Math.floor(Math.random() * 15) + 10;  // 10-24 points
  } else if (finalScore > 80) {
    randomVariation = Math.floor(Math.random() * 12) + 5;   // 5-16 points
  } else if (finalScore > 60) {
    randomVariation = Math.floor(Math.random() * 8) - 3;    // -3 to +4 points
  }
  
  // Apply the variation with extreme scaling
  let finalAdjustedScore = Math.max(0, Math.min(100, finalScore - randomVariation));
  
  // Apply a final non-linear boost to only the absolute top scores
  if (finalAdjustedScore > 95) {
    // Only boost the absolute top scores significantly
    const boostFactor = 1 + ((finalAdjustedScore - 95) / 5) * 0.4;
    finalAdjustedScore = Math.min(100, finalAdjustedScore * boostFactor);
  }
  
  // Ensure we have maximum spread at the top
  if (finalAdjustedScore > 97) {
    // Add significant variation to the absolute top scores
    finalAdjustedScore -= Math.floor(Math.random() * 8);
  }
  
  // Round to nearest integer for display
  finalAdjustedScore = Math.round(finalAdjustedScore);
  
  // Debug log for top scores
  if (finalAdjustedScore > 80) {
    console.log('Score details:', {
      harmonyScore,
      challengeScore,
      scaledHarmony,
      scaledChallenge,
      baseScore,
      finalScore,
      randomVariation,
      finalAdjustedScore,
      teamSize: playerPositions.length
    });
  }

  return {
    harmonyScore,
    challengeScore,
    netHarmony: Math.round(netHarmony * 100) / 100, // Round to 2 decimal places
    aspects,
    score: finalAdjustedScore // Include the final score in the return object
  };
}

// --- Astrological Transit Modifier using teamAstroData (from astrodata API) ---
/**
 * Calculates a chemistry modifier based on team-level astrodata (e.g., moon phase, planetary retrogrades)
 * @param {object|null} teamAstroData - AstroData object for the team/date (from astrodata API)
 * @returns {number} - Modifier between -1 and +1 (e.g., 0.05 for +5% boost)
 */
function getTransitModifier(teamAstroData) {
  if (!teamAstroData) return 0;
  let modifier = 0;

  // Example: Mercury retrograde penalty
  if (teamAstroData.planets?.mercury?.retrograde) {
    modifier -= 0.05;
  }

  // Example: Moon in fire sign bonus
  // Accessing moon sign via teamAstroData.planets.moon.sign
  const moonSign = teamAstroData.planets?.moon?.sign?.toLowerCase();
  if (moonSign && ['aries', 'leo', 'sagittarius'].includes(moonSign)) {
    modifier += 0.03;
  }

  // Example: Full moon bonus
  // Accessing moon phase name via teamAstroData.moon_phases.current.phase_name
  const moonPhaseName = teamAstroData.moon_phases?.current?.phase_name?.toLowerCase();
  if (moonPhaseName === 'full moon') {
    modifier += 0.02;
  }
  
  // Add more custom logic as needed
  return modifier;
}

// --- Historical Chemistry Calibration Hook (stub) ---
function getHistoricalCalibration(/* teamId, players, ... */) {
  // TODO: Use regression/ML or heuristics to calibrate chemistry score
  // Return a value between -10 and +10 (score adjustment)
  return 0; // No effect by default
}

// Main function to calculate team chemistry (astrodata-aware)
/**
 * Calculates team chemistry score, using player data and teamAstroData (from astrodata API)
 * @param {Array} players - Array of player objects
 * @param {object} options - Options object
 *   @property {object|null} teamAstroData - AstroData object for the team/date (from astrodata API)
 *   @property {object} [playerAstroDataMap] - (optional) Map of playerId to AstroData
 * @returns {object} Chemistry result with score, elements, aspects, and metadata
 */
export function calculateTeamChemistry(players, { teamAstroData = null, playerAstroDataMap = {}, ...options } = {}) {
  // Filter out players without birth dates (can't calculate zodiac without them)
  const playersWithData = players.filter(p => p.birth_date);
  if (playersWithData.length < 2) {
    return {
      score: 50,
      elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
      aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
      calculatedAt: new Date().toISOString(),
      metadata: { reason: 'Insufficient player data' }
    };
  }
  // Calculate weighted players (roles, availability)
  const weightedPlayers = calculatePlayerWeights(playersWithData);
  // Calculate components
  const elements = calculateElementalBalance(weightedPlayers);
  const aspects = calculateTeamAspects(weightedPlayers);
  // --- Astrological Transit Modifier ---
  const transitModifier = getTransitModifier(teamAstroData);
  // --- Historical Calibration ---
  const historicalAdjustment = getHistoricalCalibration(/* teamId, players, ... */);
  // Chemistry score with top 1-3 teams near 100
  // 62% elements, 38% aspects with moderate scaling
  const elementWeight = 0.62;  // Balanced element weight
  const aspectWeight = 0.38;   // Slightly higher aspect weight
  const scoreScale = 1.5;      // Moderate scaling for better distribution
  
  // Calculate base score with new weights and scaling
  let baseScore = (
    (elements.chemistryElementScore * elementWeight) + 
    (aspects.netHarmony * aspectWeight)
  ) * scoreScale;
  
  // Apply transit and historical modifiers
  baseScore = baseScore * (1 + transitModifier) + historicalAdjustment;
  // Clamp to 0-100
  const overallScore = Math.round(Math.min(100, Math.max(0, baseScore)));
  return {
    score: overallScore,
    elements,
    aspects,
    calculatedAt: new Date().toISOString(),
    metadata: {
      playerCount: playersWithData.length,
      avgImpact: Math.round(weightedPlayers.reduce((sum, p) => sum + p.normalizedImpact, 0) / weightedPlayers.length * 100) / 100,
      synergyBonus: elements.synergyBonus,
      diversityBonus: elements.diversityBonus,
      transitModifier,
      historicalAdjustment,
      astrodataUsed: !!teamAstroData
    }
  };
}

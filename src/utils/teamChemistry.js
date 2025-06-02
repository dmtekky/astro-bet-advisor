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

// Define zodiac compatibility scores (0-5, 5 being most compatible)
const elementCompatibility = {
  fire: { fire: 4, earth: 1, air: 5, water: 2 },
  earth: { fire: 1, earth: 4, air: 2, water: 5 },
  air: { fire: 5, earth: 2, air: 4, water: 1 },
  water: { fire: 2, earth: 5, air: 1, water: 4 }
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

  // Normalize to percentages
  const normalize = (value) => 
    totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 25;

  const normalizedElements = {
    fire: normalize(elements.fire),
    earth: normalize(elements.earth),
    air: normalize(elements.air),
    water: normalize(elements.water)
  };

  // Calculate balance score (higher when elements are more evenly distributed)
  const idealPercentage = 25; // Perfect balance is 25% for each element
  const deviations = Object.values(normalizedElements).map(
    value => Math.abs(value - idealPercentage)
  );
  const avgDeviation = deviations.reduce((sum, val) => sum + val, 0) / deviations.length;
  const balance = Math.max(0, Math.min(100, 100 - (avgDeviation * 2)));

  // --- Synergy/Diversity Bonuses ---
  // Synergy: Bonus for high concentration in one element
  const maxElement = Math.max(...Object.values(normalizedElements));
  let synergyBonus = 0;
  if (maxElement >= 60) synergyBonus = 5; // e.g. "all-fire" team
  // Diversity: Bonus for all elements present
  let diversityBonus = 0;
  if (Object.values(normalizedElements).every(x => x > 10)) diversityBonus = 5;

  // Total chemistry element score
  const chemistryElementScore = Math.min(100, balance + synergyBonus + diversityBonus);

  return {
    ...normalizedElements,
    balance,
    synergyBonus,
    diversityBonus,
    chemistryElementScore
  };
}

// Calculate aspects between players
export function calculateTeamAspects(weightedPlayers) {
  // Filter players with zodiac data
  const playersWithZodiac = weightedPlayers.filter(p => p.zodiacSign);
  
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
  let aspectCount = 0;
  const aspects = [];

  // Compare each player with every other player
  for (let i = 0; i < playersWithZodiac.length; i++) {
    for (let j = i + 1; j < playersWithZodiac.length; j++) {
      const player1 = playersWithZodiac[i];
      const player2 = playersWithZodiac[j];
      
      // Skip if either player doesn't have an element
      if (!player1.element || !player2.element) continue;
      
      // Calculate compatibility score between the two elements (0-5)
      const compatibilityScore = elementCompatibility[player1.element][player2.element];
      
      // Weight based on both players' weights
      const relationshipWeight = (player1.weight + player2.weight) / 2;
      const weightedScore = compatibilityScore * relationshipWeight;
      
      // Track harmony vs challenge
      if (compatibilityScore >= 3) {
        totalHarmony += weightedScore;
      } else {
        totalChallenge += (5 - weightedScore); // Invert for challenge score
      }
      
      // Record this aspect
      aspects.push({
        player1: player1.full_name,
        player2: player2.full_name,
        element1: player1.element,
        element2: player2.element,
        compatibilityScore,
        relationshipWeight,
        weightedScore
      });
      
      aspectCount++;
    }
  }

  // Calculate normalized scores (0-100)
  const maxPossibleScore = 5 * aspectCount; // Max score is 5 per aspect
  
  const harmonyScore = aspectCount > 0 
    ? Math.round((totalHarmony / maxPossibleScore) * 100) 
    : 50;
    
  const challengeScore = aspectCount > 0 
    ? Math.round((totalChallenge / maxPossibleScore) * 100)
    : 20;
    
  // Net harmony is weighted toward harmony, but challenges reduce the score
  const netHarmony = Math.max(0, Math.min(100, 
    harmonyScore - (challengeScore * 0.5)
  ));

  return {
    harmonyScore,
    challengeScore,
    netHarmony,
    aspects
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
  // Chemistry base score (50% elements, 50% aspects)
  let baseScore = (elements.chemistryElementScore * 0.5) + (aspects.netHarmony * 0.5);
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

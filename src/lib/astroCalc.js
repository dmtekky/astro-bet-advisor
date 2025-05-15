
/**
 * astroCalc.js - Astrological impact calculation module for sports betting
 * 
 * This module calculates the astrological impact on a player's performance
 * based on their birth date and current ephemeris data. It retrieves
 * ephemeris data from Supabase and performs astrological calculations
 * to determine a player's favorable/unfavorable conditions.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Zodiac sign information with dates and qualities
 */
const ZODIAC_SIGNS = {
  Aries: { 
    element: 'fire', 
    quality: 'cardinal',
    startMonth: 3, startDay: 21,
    endMonth: 4, endDay: 19,
    ruler: 'Mars'
  },
  Taurus: { 
    element: 'earth', 
    quality: 'fixed',
    startMonth: 4, startDay: 20,
    endMonth: 5, endDay: 20,
    ruler: 'Venus'
  },
  Gemini: { 
    element: 'air', 
    quality: 'mutable',
    startMonth: 5, startDay: 21,
    endMonth: 6, endDay: 20,
    ruler: 'Mercury'
  },
  Cancer: { 
    element: 'water', 
    quality: 'cardinal',
    startMonth: 6, startDay: 21,
    endMonth: 7, endDay: 22,
    ruler: 'Moon'
  },
  Leo: { 
    element: 'fire', 
    quality: 'fixed',
    startMonth: 7, startDay: 23,
    endMonth: 8, endDay: 22,
    ruler: 'Sun'
  },
  Virgo: { 
    element: 'earth', 
    quality: 'mutable',
    startMonth: 8, startDay: 23,
    endMonth: 9, endDay: 22,
    ruler: 'Mercury'
  },
  Libra: { 
    element: 'air', 
    quality: 'cardinal',
    startMonth: 9, startDay: 23,
    endMonth: 10, endDay: 22,
    ruler: 'Venus'
  },
  Scorpio: { 
    element: 'water', 
    quality: 'fixed',
    startMonth: 10, startDay: 23,
    endMonth: 11, endDay: 21,
    ruler: 'Mars'
  },
  Sagittarius: { 
    element: 'fire', 
    quality: 'mutable',
    startMonth: 11, startDay: 22,
    endMonth: 12, endDay: 21,
    ruler: 'Jupiter'
  },
  Capricorn: { 
    element: 'earth', 
    quality: 'cardinal',
    startMonth: 12, startDay: 22,
    endMonth: 1, endDay: 19,
    ruler: 'Saturn'
  },
  Aquarius: { 
    element: 'air', 
    quality: 'fixed',
    startMonth: 1, startDay: 20,
    endMonth: 2, endDay: 18,
    ruler: 'Saturn'
  },
  Pisces: { 
    element: 'water', 
    quality: 'mutable',
    startMonth: 2, startDay: 19,
    endMonth: 3, endDay: 20,
    ruler: 'Jupiter'
  }
};

/**
 * Aspect types and their astrological meanings
 */
const ASPECT_MEANINGS = {
  conjunction: { type: 'major', effect: 'powerful', value: 15 },
  opposition: { type: 'major', effect: 'challenging', value: -10 },
  trine: { type: 'major', effect: 'harmonious', value: 12 },
  square: { type: 'major', effect: 'tense', value: -8 },
  sextile: { type: 'major', effect: 'favorable', value: 8 }
};

/**
 * Moon phase influence values
 */
const MOON_PHASE_INFLUENCE = {
  new: { range: [0, 0.05], value: 10, description: 'New beginnings, fresh energy' },
  waxing_crescent: { range: [0.05, 0.20], value: 5, description: 'Building momentum' },
  first_quarter: { range: [0.20, 0.30], value: 8, description: 'Overcoming challenges' },
  waxing_gibbous: { range: [0.30, 0.45], value: 3, description: 'Refining approach' },
  full: { range: [0.45, 0.55], value: 12, description: 'Peak performance, maximum energy' },
  waning_gibbous: { range: [0.55, 0.70], value: 2, description: 'Sharing success' },
  last_quarter: { range: [0.70, 0.80], value: -3, description: 'Reflection, possible fatigue' },
  waning_crescent: { range: [0.80, 0.95], value: -5, description: 'Releasing, lower energy' },
  dark: { range: [0.95, 1], value: -8, description: 'Conserving energy, rest period' }
};

/**
 * Planet retrograde effects
 */
const RETROGRADE_EFFECTS = {
  mercury: -15
};

/**
 * Get zodiac sign from birth date
 * @param {Date} birthDate - Player's birth date
 * @return {String} Zodiac sign name
 */
export function getZodiacSign(birthDate) {
  const month = birthDate.getMonth() + 1; // JavaScript months are 0-based
  const day = birthDate.getDate();
  
  for (const [sign, data] of Object.entries(ZODIAC_SIGNS)) {
    // Check if birth date falls within sign's date range
    if (
      (month === data.startMonth && day >= data.startDay) || 
      (month === data.endMonth && day <= data.endDay) ||
      // Special case for Capricorn (spans December-January)
      (sign === 'Capricorn' && 
        ((month === 12 && day >= data.startDay) || (month === 1 && day <= data.endDay)))
    ) {
      return sign;
    }
  }
  
  return 'Unknown';
}

/**
 * Get moon phase description
 * @param {Number} moonPhase - Moon phase value (0-1)
 * @return {Object} Moon phase information
 */
export function getMoonPhaseInfo(moonPhase) {
  for (const [phase, info] of Object.entries(MOON_PHASE_INFLUENCE)) {
    if (moonPhase >= info.range[0] && moonPhase < info.range[1]) {
      return {
        phase,
        value: info.value,
        description: info.description
      };
    }
  }
  
  return { phase: 'unknown', value: 0, description: 'Unknown moon phase' };
}

/**
 * Check element compatibility between player's sign and current moon sign
 * @param {String} birthSign - Player's zodiac sign
 * @param {String} moonSign - Current moon sign
 * @return {Number} Compatibility score
 */
function calculateElementalCompatibility(birthSign, moonSign) {
  const birthElement = ZODIAC_SIGNS[birthSign]?.element;
  const moonElement = ZODIAC_SIGNS[moonSign]?.element;
  
  if (!birthElement || !moonElement) return 0;
  
  // Same element - harmonious
  if (birthElement === moonElement) return 10;
  
  // Complementary elements
  const complementary = {
    fire: 'air',
    air: 'fire',
    water: 'earth',
    earth: 'water'
  };
  
  if (complementary[birthElement] === moonElement) return 8;
  
  // Challenging elements
  const challenging = {
    fire: 'water',
    water: 'fire',
    air: 'earth',
    earth: 'air'
  };
  
  if (challenging[birthElement] === moonElement) return -5;
  
  // Neutral
  return 0;
}

/**
 * Calculate ruling planet influence
 * @param {String} birthSign - Player's zodiac sign
 * @param {Object} ephemeris - Daily ephemeris data
 * @return {Object} Ruling planet influence data
 */
function calculateRulingPlanetInfluence(birthSign, ephemeris) {
  const ruler = ZODIAC_SIGNS[birthSign]?.ruler;
  if (!ruler) return { value: 0, description: "No ruling planet data" };
  
  // Check Mercury retrograde effect for Mercury-ruled signs
  if (ruler === 'Mercury' && ephemeris.mercury_retrograde) {
    return { 
      value: RETROGRADE_EFFECTS.mercury, 
      description: "Mercury retrograde disrupts performance for Mercury-ruled sign"
    };
  }
  
  // Check planetary aspects
  let influence = 0;
  let descriptions = [];
  
  switch (ruler) {
    case 'Sun':
      // Sun aspects are already calculated in ephemeris
      break;
    case 'Moon':
      const moonPhaseInfo = getMoonPhaseInfo(ephemeris.moon_phase);
      influence += moonPhaseInfo.value;
      descriptions.push(`Moon phase (${moonPhaseInfo.phase}): ${moonPhaseInfo.description}`);
      break;
    case 'Mercury':
      // Mercury sign position
      if (ephemeris.mercury_sign === birthSign) {
        influence += 8;
        descriptions.push("Mercury in home sign: enhanced mental acuity");
      }
      break;
    case 'Venus':
      // Venus sign position
      if (ephemeris.venus_sign === birthSign) {
        influence += 8;
        descriptions.push("Venus in home sign: enhanced coordination and rhythm");
      }
      break;
    case 'Mars':
      // Mars influences (check aspects to Sun)
      const sunMarsAspect = ephemeris.aspects.sun_mars;
      if (sunMarsAspect && ASPECT_MEANINGS[sunMarsAspect]) {
        const aspectEffect = ASPECT_MEANINGS[sunMarsAspect].value;
        influence += aspectEffect;
        descriptions.push(`Sun-Mars ${sunMarsAspect}: ${ASPECT_MEANINGS[sunMarsAspect].effect} energy`);
      }
      break;
    case 'Jupiter':
      // Jupiter influences (check aspects to Sun)
      const sunJupiterAspect = ephemeris.aspects.sun_jupiter;
      if (sunJupiterAspect && ASPECT_MEANINGS[sunJupiterAspect]) {
        const aspectEffect = ASPECT_MEANINGS[sunJupiterAspect].value;
        influence += aspectEffect;
        descriptions.push(`Sun-Jupiter ${sunJupiterAspect}: ${ASPECT_MEANINGS[sunJupiterAspect].effect} expansion`);
      }
      break;
    case 'Saturn':
      // Saturn influences (check aspects to Sun)
      const sunSaturnAspect = ephemeris.aspects.sun_saturn;
      if (sunSaturnAspect && ASPECT_MEANINGS[sunSaturnAspect]) {
        const aspectEffect = ASPECT_MEANINGS[sunSaturnAspect].value;
        influence += aspectEffect;
        descriptions.push(`Sun-Saturn ${sunSaturnAspect}: ${ASPECT_MEANINGS[sunSaturnAspect].effect} discipline`);
      }
      break;
  }
  
  return {
    value: influence,
    descriptions
  };
}

/**
 * Retrieve ephemeris data for a specific date
 * @param {String} date - Date in ISO format (YYYY-MM-DD)
 * @return {Promise<Object>} Ephemeris data
 */
export async function getEphemerisData(date) {
  try {
    const { data, error } = await supabase
      .from('ephemeris')
      .select('*')
      .eq('date', date)
      .single();
      
    if (error) {
      console.error('Error fetching ephemeris data:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception fetching ephemeris data:', err);
    return null;
  }
}

/**
 * Check if the calculation exists in cache
 * @param {String} playerId - Player ID
 * @param {String} date - Date in ISO format (YYYY-MM-DD)
 * @return {Promise<Object>} Cached calculation or null
 */
export async function getCachedCalculation(playerId, date) {
  try {
    const { data, error } = await supabase
      .from('astrological_calculations')
      .select('*')
      .eq('player_id', playerId)
      .eq('date', date)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching cached calculation:', error);
      return null;
    }
    
    return data || null;
  } catch (err) {
    console.error('Exception fetching cached calculation:', err);
    return null;
  }
}

/**
 * Store calculation results in cache
 * @param {String} playerId - Player ID
 * @param {String} date - Date in ISO format (YYYY-MM-DD)
 * @param {Object} calculationData - Detailed calculation results
 * @param {Number} score - Overall favorability score
 * @return {Promise<Boolean>} Success status
 */
export async function storeCalculation(playerId, date, calculationData, score) {
  try {
    const { data, error } = await supabase
      .from('astrological_calculations')
      .upsert({
        player_id: playerId,
        date: date,
        calculation_data: calculationData,
        score: score
      })
      .select();
      
    if (error) {
      console.error('Error storing calculation:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception storing calculation:', err);
    return false;
  }
}

/**
 * Calculate astrological influences for a player on a specific date
 * @param {Object} player - Player object with birth_date
 * @param {String} date - Date to calculate for (YYYY-MM-DD)
 * @return {Promise<Object>} Astrological influence results
 */
export async function calculateAstrologicalInfluence(player, date = new Date().toISOString().split('T')[0]) {
  // Check input validity
  if (!player || !player.birth_date) {
    return {
      score: 50, // Neutral score
      influences: ["Birth date unavailable"],
      details: "Cannot calculate astrological influence without birth date."
    };
  }
  
  // Check cache first
  const cachedResult = await getCachedCalculation(player.id, date);
  if (cachedResult) {
    return {
      score: cachedResult.score,
      influences: cachedResult.calculation_data.influences,
      details: cachedResult.calculation_data.details
    };
  }
  
  // Get ephemeris data for the date
  const ephemeris = await getEphemerisData(date);
  if (!ephemeris) {
    return {
      score: 50, // Neutral score
      influences: ["Ephemeris data unavailable"],
      details: "Cannot calculate astrological influence without ephemeris data."
    };
  }
  
  // Parse birth date
  const birthDate = new Date(player.birth_date);
  
  // Get player's zodiac sign
  const birthSign = getZodiacSign(birthDate);
  
  // Calculate base influences
  let totalScore = 50; // Start with neutral score
  const influences = [];
  let details = "";
  
  // 1. Moon phase influence
  const moonPhaseInfo = getMoonPhaseInfo(ephemeris.moon_phase);
  totalScore += moonPhaseInfo.value;
  influences.push(`Moon phase: ${moonPhaseInfo.phase}`);
  details += `Moon phase (${moonPhaseInfo.phase}): ${moonPhaseInfo.description} (${moonPhaseInfo.value > 0 ? '+' : ''}${moonPhaseInfo.value} points)\n`;
  
  // 2. Moon sign elemental compatibility
  const elementalScore = calculateElementalCompatibility(birthSign, ephemeris.moon_sign);
  totalScore += elementalScore;
  if (elementalScore !== 0) {
    influences.push(`${ephemeris.moon_sign} moon ${elementalScore > 0 ? 'boosts' : 'challenges'} ${birthSign}`);
    details += `${birthSign} (${ZODIAC_SIGNS[birthSign].element}) and ${ephemeris.moon_sign} moon (${ZODIAC_SIGNS[ephemeris.moon_sign].element}): ${elementalScore > 0 ? 'harmonious' : 'challenging'} (${elementalScore > 0 ? '+' : ''}${elementalScore} points)\n`;
  }
  
  // 3. Mercury retrograde (general effect)
  if (ephemeris.mercury_retrograde) {
    const retrogradeEffect = -5; // General negative effect for all signs
    totalScore += retrogradeEffect;
    influences.push("Mercury retrograde");
    details += `Mercury retrograde: Communication and coordination challenges (${retrogradeEffect} points)\n`;
  }
  
  // 4. Ruling planet influence
  const rulingPlanetInfluence = calculateRulingPlanetInfluence(birthSign, ephemeris);
  totalScore += rulingPlanetInfluence.value;
  if (rulingPlanetInfluence.descriptions && rulingPlanetInfluence.descriptions.length > 0) {
    influences.push(...rulingPlanetInfluence.descriptions.map(d => d.split(':')[0]));
    details += `Ruling planet influences:\n`;
    rulingPlanetInfluence.descriptions.forEach(desc => {
      details += `- ${desc} (${rulingPlanetInfluence.value > 0 ? '+' : ''}${rulingPlanetInfluence.value} points)\n`;
    });
  }
  
  // 5. Check major aspects for general influence
  Object.entries(ephemeris.aspects).forEach(([aspectName, aspectType]) => {
    if (aspectType && ASPECT_MEANINGS[aspectType]) {
      const aspectEffect = ASPECT_MEANINGS[aspectType].value / 2; // Reduced general effect
      totalScore += aspectEffect;
      influences.push(`${aspectName.replace('_', '-')} ${aspectType}`);
      details += `${aspectName.replace('_', '-')} ${aspectType}: ${ASPECT_MEANINGS[aspectType].effect} influence (${aspectEffect > 0 ? '+' : ''}${aspectEffect} points)\n`;
    }
  });
  
  // Ensure score is within 0-100 range
  totalScore = Math.max(0, Math.min(100, totalScore));
  
  // Create result object
  const result = {
    score: Math.round(totalScore),
    influences: influences.slice(0, 5), // Limit to top 5 influences
    details: details
  };
  
  // Store in cache
  await storeCalculation(player.id, date, {
    influences: result.influences,
    details: result.details
  }, result.score);
  
  return result;
}

/**
 * Update astrological data for a player in the astrological_data table
 * This is typically called when wanting to store the current calculation
 * for display in the UI
 * 
 * @param {String} playerId - Player ID
 * @param {Object} astroData - Astrological data object
 * @return {Promise<Boolean>} Success status
 */
export async function updateAstrologicalData(playerId, astroData) {
  try {
    const { data, error } = await supabase
      .from('astrological_data')
      .upsert({
        player_id: playerId,
        favorability: astroData.score,
        influences: astroData.influences,
        details: astroData.details,
        timestamp: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error('Error updating astrological data:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception updating astrological data:', err);
    return false;
  }
}

/**
 * Get current astrological data for a player
 * This retrieves the last calculated astrological data
 * 
 * @param {String} playerId - Player ID
 * @return {Promise<Object>} Astrological data or null
 */
export async function getAstrologicalData(playerId) {
  try {
    const { data, error } = await supabase
      .from('astrological_data')
      .select('*')
      .eq('player_id', playerId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error('Error fetching astrological data:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception fetching astrological data:', err);
    return null;
  }
}

/**
 * Calculate and store astrological data for multiple players
 * Useful for batch processing
 * 
 * @param {Array} players - Array of player objects
 * @param {String} date - Date to calculate for (YYYY-MM-DD)
 * @return {Promise<Object>} Results with success and failure counts
 */
export async function batchCalculateAstrological(players, date = new Date().toISOString().split('T')[0]) {
  const results = {
    total: players.length,
    success: 0,
    failure: 0,
    processed: []
  };
  
  for (const player of players) {
    try {
      // Only process players with birth dates
      if (player && player.id && player.birth_date) {
        const astroData = await calculateAstrologicalInfluence(player, date);
        const updateSuccess = await updateAstrologicalData(player.id, astroData);
        
        if (updateSuccess) {
          results.success++;
          results.processed.push({
            playerId: player.id,
            name: player.name,
            status: 'success',
            score: astroData.score
          });
        } else {
          results.failure++;
          results.processed.push({
            playerId: player.id,
            name: player.name,
            status: 'update_failed'
          });
        }
      } else {
        results.failure++;
        results.processed.push({
          playerId: player?.id || 'unknown',
          name: player?.name || 'unknown',
          status: 'missing_birth_date'
        });
      }
    } catch (err) {
      console.error(`Error processing player ${player?.id}:`, err);
      results.failure++;
      results.processed.push({
        playerId: player?.id || 'unknown',
        name: player?.name || 'unknown',
        status: 'error',
        error: err.message
      });
    }
  }
  
  return results;
}

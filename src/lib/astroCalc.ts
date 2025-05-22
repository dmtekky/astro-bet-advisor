/**
 * Gets the zodiac sign based on a given date
 * @param date The date to get the zodiac sign for
 * @returns The zodiac sign as a string
 */
export function getZodiacSign(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

/**
 * Gets the emoji icon for a given zodiac sign
 * @param sign The zodiac sign
 * @returns The corresponding emoji icon
 */
export function getZodiacIcon(sign: string): string {
  const signIcons: Record<string, string> = {
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓',
  };

  return signIcons[sign] || '✨';
}

/**
 * Gets the name of the moon phase based on a percentage (0-100)
 * @param percentage The moon phase percentage (0-100)
 * @returns The name of the moon phase
 */
export function getMoonPhaseName(percentage: number): string {
  if (percentage < 2 || percentage > 98) return 'New Moon';
  if (percentage < 23) return 'Waxing Crescent';
  if (percentage < 27) return 'First Quarter';
  if (percentage < 48) return 'Waxing Gibbous';
  if (percentage < 52) return 'Full Moon';
  if (percentage < 73) return 'Waning Gibbous';
  if (percentage < 77) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Calculates astrological influence for a player on a given date
 * @param player The player object containing birth date and other details
 * @param date The date to calculate influence for (defaults to current date)
 * @returns Object containing astrological influence data
 */
export async function calculateAstrologicalInfluence(
  player: { birth_date?: string | null; id: string; position?: string },
  date: Date = new Date()
): Promise<{
  playerId: string;
  date: string;
  influences: Record<string, any>;
  aspects: Record<string, number>;
  elements: Record<string, number>;
  score: number;
  details?: Record<string, any>;
}> {
  // Create a consistent date (set to noon UTC to avoid timezone issues)
  const dateOnly = new Date(Date.UTC(
    date.getFullYear(), 
    date.getMonth(), 
    date.getDate(), 
    12, 0, 0, 0
  ));
  
  // Default values if birth date is not available
  if (!player.birth_date) {
    throw new Error('Birth date is required for astrological calculations');
  }

  // Create a consistent date string (YYYY-MM-DD) for caching
  const dateStr = dateOnly.toISOString().split('T')[0];
  
  // Create a cache key based on player ID and date
  const cacheKey = `ais_${player.id}_${dateStr}`;
  
  try {
    // Try to get cached AIS data from localStorage
    const cachedAIS = localStorage.getItem(cacheKey);
    if (cachedAIS) {
      const parsed = JSON.parse(cachedAIS);
      // Check if cache is still valid (less than 12 hours old)
      if (parsed.timestamp && (Date.now() - new Date(parsed.timestamp).getTime() < 12 * 60 * 60 * 1000)) {
        return parsed;
      }
    }
    
    // If not in cache or cache is stale, calculate new AIS
    console.log('Raw birth_date:', player.birth_date, 'Type:', typeof player.birth_date);
    
    // Robust date parsing
    let birthDate: Date;
    if (typeof player.birth_date === 'string') {
      // Try to parse as YYYY-MM-DD
      const parts = player.birth_date.split('-');
      if (parts.length === 3) {
        birthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        // Try other common formats
        const slashParts = player.birth_date.split('/');
        if (slashParts.length === 3) {
          // Assuming MM/DD/YYYY format
          birthDate = new Date(Number(slashParts[2]), Number(slashParts[0]) - 1, Number(slashParts[1]));
        } else {
          // Fall back to standard parsing
          birthDate = new Date(player.birth_date);
        }
      }
    } else {
      birthDate = new Date(player.birth_date as any);
    }
    
    // Validate the date
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid birth date:', player.birth_date, 'Parsed as:', birthDate);
      // Use a fallback date for demo purposes (January 1, 1990)
      birthDate = new Date(1990, 0, 1);
      console.log('Using fallback birth date:', birthDate);
    } else {
      console.log('Parsed birth date:', birthDate, 'getTime():', birthDate.getTime());
    }
    
    // Calculate age in years with decimal precision
    const ageMs = dateOnly.getTime() - birthDate.getTime();
    const age = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    console.log('Age calculation:', { ageMs, age });
    
    // Get zodiac sign
    const zodiacSign = getZodiacSign(birthDate);
    
    // Calculate moon phase (0-1)
    const moonPhase = getMoonPhase(dateOnly);
    const moonPhaseName = getMoonPhaseName(moonPhase * 100);
    
    // Calculate planetary positions (simplified)
    const planetaryPositions = calculatePlanetaryPositions(dateOnly, birthDate);
    
    // Calculate aspects between planets
    const aspects = calculateAspects(planetaryPositions);
    
    // Calculate element balance
    const elements = calculateElementBalance(planetaryPositions);
    
    // Calculate house positions (simplified)
    const houses = calculateHouses(dateOnly, birthDate);
    
    // Calculate base score based on astrological factors
    let score = calculateBaseScore({
      planetaryPositions,
      aspects,
      elements,
      houses,
      playerPosition: player.position
    });
    
    // Calculate detailed influences
    const influences = {
      zodiacSign: {
        value: zodiacSign,
        score: calculateSignScore(zodiacSign, dateOnly),
        description: getSignDescription(zodiacSign),
        element: getSignElement(zodiacSign)
      },
      moonPhase: {
        value: moonPhaseName,
        score: calculateMoonScore(moonPhase, dateOnly),
        phaseValue: moonPhase,
        illumination: Math.round(moonPhase * 100),
        description: getMoonPhaseDescription(moonPhase)
      },
      mercuryRetrograde: {
        value: isMercuryRetrograde(dateOnly),
        score: isMercuryRetrograde(dateOnly) ? 0.3 : 0.7,
        description: isMercuryRetrograde(dateOnly) ?
          'Mercury retrograde may affect communication and decision-making' :
          'Mercury direct supports clear thinking and communication'
      },
      currentTransits: {
        sunSign: getZodiacSign(dateOnly),
        moonSign: getZodiacSign(new Date(dateOnly.getTime() - 2 * 24 * 60 * 60 * 1000)), // Approximate moon sign
        mercurySign: getZodiacSign(new Date(dateOnly.getTime() - 20 * 24 * 60 * 60 * 1000)) // Approximate mercury sign
      },
      calculatedAt: new Date().toISOString()
    };
    
    // Prepare result
    const result = {
      playerId: player.id,
      date: dateOnly.toISOString(),
      influences,
      aspects,
      elements,
      score,
      details: {
        birthSign: zodiacSign,
        currentDate: dateStr,
        factors: {
          signScore: influences.zodiacSign.score,
          moonScore: influences.moonPhase.score,
          mercuryScore: influences.mercuryRetrograde.score,
          ...Object.fromEntries(
            Object.entries(aspects)
              .filter(([_, v]) => typeof v === 'number')
              .map(([k, v]) => [k, parseFloat(v.toFixed(2))])
          ),
          ...Object.fromEntries(
            Object.entries(elements).map(([k, v]) => [k, parseFloat(v.toFixed(2))])
          )
        },
        dominantElement: Object.entries(elements).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        dominantAspect: Object.entries(aspects).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      },
      timestamp: new Date().toISOString()
    };
    
    // Log the result for debugging
    console.log('Astrological calculation result:', {
      playerId: result.playerId,
      score: result.score,
      influences: Object.keys(result.influences),
      aspects: Object.keys(result.aspects).length,
      elements: result.elements
    });
    
    // Cache the result
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn('Failed to cache astro data:', e);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in calculateAstrologicalInfluence:', error);
    throw error;
  }
}

// Helper function to calculate planetary positions (simplified)
function calculatePlanetaryPositions(currentDate: Date, birthDate: Date): Record<string, number> {
  const positions: Record<string, number> = {};
  
  // Validate inputs
  if (isNaN(currentDate.getTime()) || isNaN(birthDate.getTime())) {
    console.error('Invalid dates in calculatePlanetaryPositions:', { 
      currentDate, 
      birthDate,
      currentDateValid: !isNaN(currentDate.getTime()),
      birthDateValid: !isNaN(birthDate.getTime())
    });
    // Return default values instead of NaN
    return {
      sun: 0,
      moon: 0,
      mercury: 0,
      venus: 0,
      mars: 0
    };
  }
  
  // Calculate positions based on current date and birth date
  const dayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };
  
  const days = dayOfYear(currentDate);
  console.log('Planetary positions calculation:', { days });
  
  // Sun position (0-360 degrees)
  positions.sun = (days * 0.9856) % 360;
  
  // Moon position (0-360 degrees, ~27.3 day cycle)
  positions.moon = (days * 13.176) % 360;
  
  // Mercury position (0-360 degrees, ~88 day cycle)
  positions.mercury = (days * 4.09) % 360;
  
  // Venus position (0-360 degrees, ~225 day cycle)
  positions.venus = (days * 1.6) % 360;
  
  // Mars position (0-360 degrees, ~687 day cycle)
  positions.mars = (days * 0.524) % 360;
  
  // Add some randomness to make it more interesting
  Object.keys(positions).forEach(planet => {
    positions[planet] = (positions[planet] + Math.random() * 10 - 5) % 360;
    if (positions[planet] < 0) positions[planet] += 360;
  });
  
  return positions;
}

// Helper function to calculate aspects between planets
function calculateAspects(positions: Record<string, number>): Record<string, number> {
  const aspects: Record<string, number> = {};
  
  // Validate input
  if (!positions || typeof positions !== 'object') {
    console.error('Invalid positions in calculateAspects:', positions);
    return aspects;
  }
  
  const planets = Object.keys(positions);
  console.log('Calculating aspects for planets:', planets);
  
  // Check for NaN values
  const hasNaN = Object.entries(positions).some(([planet, pos]) => isNaN(pos));
  if (hasNaN) {
    console.error('NaN values detected in positions:', positions);
    return aspects;
  }
  
  // Calculate aspects between all planet pairs
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(positions[planet1] - positions[planet2]) % 360;
      const aspectName = `${planet1}-${planet2}`;
      
      // Calculate aspect strength (0-1)
      let strength = 0;
      
      // Check for major aspects
      if (Math.abs(angle - 0) < 8) { // Conjunction (0°)
        strength = 1 - (Math.abs(angle - 0) / 8);
      } else if (Math.abs(angle - 60) < 4) { // Sextile (60°)
        strength = 0.8 - (Math.abs(angle - 60) / 5);
      } else if (Math.abs(angle - 90) < 4) { // Square (90°)
        strength = 0.7 - (Math.abs(angle - 90) / 6);
      } else if (Math.abs(angle - 120) < 4) { // Trine (120°)
        strength = 0.9 - (Math.abs(angle - 120) / 5);
      } else if (Math.abs(angle - 180) < 8) { // Opposition (180°)
        strength = 0.85 - (Math.abs(angle - 180) / 10);
      }
      
      if (strength > 0) {
        aspects[aspectName] = parseFloat(Math.max(0, Math.min(1, strength)).toFixed(2));
      }
    }
  }
  
  console.log('Calculated aspects:', aspects);
  
  return aspects;
}

// Helper function to calculate element balance
function calculateElementBalance(positions: Record<string, number>): Record<string, number> {
  const elements: Record<string, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  // Validate input
  if (!positions || typeof positions !== 'object') {
    console.error('Invalid positions in calculateElementBalance:', positions);
    return elements;
  }
  
  // Check for NaN values
  const hasNaN = Object.entries(positions).some(([planet, pos]) => isNaN(pos));
  if (hasNaN) {
    console.error('NaN values detected in positions for element balance:', positions);
    return elements;
  }
  
  console.log('Calculating element balance for positions:', positions);
  
  // Count planets in each element
  Object.entries(positions).forEach(([planet, angle]) => {
    if (isNaN(angle)) {
      console.error(`NaN angle for ${planet} in calculateElementBalance`);
      return;
    }
    
    const signIndex = Math.floor(angle / 30);
    const element = getElementBySignIndex(signIndex);
    elements[element] += 1;
  });
  
  // Normalize to sum to 1
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  if (total > 0) {
    Object.keys(elements).forEach(key => {
      elements[key] = parseFloat((elements[key] / total).toFixed(2));
    });
  }
  
  console.log('Calculated element balance:', elements);
  return elements;
}

// Helper function to get element by sign index (0-11)
function getElementBySignIndex(signIndex: number): string {
  const elements = ['fire', 'earth', 'air', 'water'];
  const elementIndex = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3][signIndex % 12];
  return elements[elementIndex];
}

// Helper function to calculate houses (simplified)
function calculateHouses(currentDate: Date, birthDate: Date): number[] {
  // In a real app, you'd calculate house cusps based on time and location
  // This is a simplified version that just returns equal houses
  const houses: number[] = [];
  for (let i = 0; i < 12; i++) {
    houses.push(i * 30 + (currentDate.getHours() * 15) % 30);
  }
  return houses;
}

// Helper function to calculate base score based on astrological factors
function calculateBaseScore({
  planetaryPositions,
  aspects,
  elements,
  houses,
  playerPosition
}: {
  planetaryPositions: Record<string, number>;
  aspects: Record<string, number>;
  elements: Record<string, number>;
  houses: number[];
  playerPosition?: string;
}): number {
  console.log('Calculating base score with:', { 
    planetaryPositionsKeys: Object.keys(planetaryPositions),
    aspectsCount: Object.keys(aspects).length,
    elementsKeys: Object.keys(elements),
    housesLength: houses?.length,
    playerPosition 
  });
  
  // Validate inputs
  if (!planetaryPositions || !aspects || !elements || !houses) {
    console.error('Missing required inputs in calculateBaseScore');
    return 0.5; // Return neutral score
  }
  
  let score = 0.5; // Base neutral score
  
  // Factor in planetary positions
  const planetScores: Record<string, number> = {
    sun: 0.2,
    moon: 0.15,
    mercury: 0.1,
    venus: 0.1,
    mars: 0.15
  };
  
  Object.entries(planetScores).forEach(([planet, weight]) => {
    if (planetaryPositions[planet] !== undefined) {
      // Check for NaN
      if (isNaN(planetaryPositions[planet])) {
        console.error(`NaN position for ${planet} in calculateBaseScore`);
        return;
      }
      
      // Favor certain positions based on player position
      let positionFactor = 1;
      if (playerPosition) {
        // Adjust based on position (simplified)
        if (['PG', 'SG'].includes(playerPosition)) {
          // Guards benefit from air signs (communication, quick thinking)
          positionFactor = planetaryPositions[planet] % 360 >= 150 && planetaryPositions[planet] % 360 < 240 ? 1.2 : 0.9;
        } else if (['SF', 'PF'].includes(playerPosition)) {
          // Forwards benefit from fire signs (energy, scoring)
          positionFactor = planetaryPositions[planet] % 360 >= 0 && planetaryPositions[planet] % 360 < 90 ? 1.2 : 0.9;
        } else if (playerPosition === 'C') {
          // Centers benefit from earth signs (stability, defense)
          positionFactor = planetaryPositions[planet] % 360 >= 90 && planetaryPositions[planet] % 360 < 180 ? 1.2 : 0.9;
        }
      }
      
      // Normalize position to 0-1 range and apply weight
      const positionScore = (planetaryPositions[planet] % 360) / 360;
      const contribution = positionScore * weight * positionFactor;
      score += contribution;
      console.log(`Planet ${planet} contribution:`, { positionScore, weight, positionFactor, contribution });
    }
  });
  
  // Factor in aspects (strong aspects boost the score)
  const aspectScores = Object.values(aspects);
  if (aspectScores.length > 0) {
    const avgAspect = aspectScores.reduce((a, b) => a + b, 0) / aspectScores.length;
    const oldScore = score;
    score = score * 0.7 + avgAspect * 0.3;
    console.log('Aspect score contribution:', { avgAspect, oldScore, newScore: score });
  }
  
  // Factor in elements (balance is good)
  const elementValues = Object.values(elements);
  if (elementValues.length > 0) {
    const maxElement = Math.max(...elementValues);
    const minElement = Math.min(...elementValues);
    const elementBalance = 1 - (maxElement - minElement);
    const oldScore = score;
    score = score * 0.8 + elementBalance * 0.2;
    console.log('Element balance contribution:', { 
      elementValues, 
      maxElement, 
      minElement, 
      elementBalance, 
      oldScore, 
      newScore: score 
    });
  }
  
  // Ensure score is between 0 and 1
  const finalScore = Math.max(0, Math.min(1, score));
  console.log('Final base score:', finalScore);
  return finalScore;
}

// Helper function to calculate sign score based on current transits
function calculateSignScore(zodiacSign: string, currentDate: Date): number {
  const currentSign = getZodiacSign(currentDate);
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const signIndex = signs.indexOf(zodiacSign);
  const currentSignIndex = signs.indexOf(currentSign);
  
  // Favorable aspects: same sign (conjunction), trine (4 signs apart), sextile (2 or 6 signs apart)
  const diff = Math.abs(signIndex - currentSignIndex) % 12;
  if (diff === 0) return 0.8; // Conjunction
  if (diff === 4 || diff === 8) return 0.9; // Trine
  if (diff === 2 || diff === 10) return 0.7; // Sextile
  if (diff === 6) return 0.3; // Opposition (challenging)
  
  return 0.5; // Neutral
}

// Helper function to calculate moon score
function calculateMoonScore(moonPhase: number, currentDate: Date): number {
  // Favor full and new moons
  const phase = moonPhase * 100;
  if (phase < 5 || phase > 95) return 0.9; // New moon
  if (phase > 45 && phase < 55) return 0.9; // Full moon
  if (phase > 20 && phase < 30) return 0.7; // First quarter
  if (phase > 70 && phase < 80) return 0.7; // Last quarter
  
  return 0.5; // Neutral
}

// Helper function to get moon phase (0-1)
function getMoonPhase(date: Date): number {
  // Validate input
  if (!date || isNaN(date.getTime())) {
    console.error('Invalid date in getMoonPhase:', date);
    return 0; // Default to new moon
  }
  
  console.log('Calculating moon phase for:', { date });
  
  // More accurate moon phase calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  console.log('Calculating moon phase for:', { year, month, day });
  
  // Calculate Julian date
  const jd = 367 * year - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) + 
             Math.floor((275 * month) / 9) + day - 730530;
  
  // Calculate moon age in days (0-29.53)
  const moonAge = (jd - 2451550.1) % 29.530588853;
  
  // Normalize to 0-1
  let moonPhase = moonAge / 29.530588853;
  if (moonPhase < 0) moonPhase += 1;
  
  console.log('Moon phase calculation:', { jd, moonAge, moonPhase });
  
  // Ensure the result is a valid number between 0 and 1
  if (isNaN(moonPhase) || moonPhase < 0 || moonPhase > 1) {
    console.error('Invalid moon phase calculated:', moonPhase);
    return 0; // Default to new moon
  }
  
  return moonPhase;
}

/**
 * Get a description of the moon phase's influence
 * @param moonPhase Moon phase value (0-1)
 * @returns Description of the moon phase's influence
 */
function getMoonPhaseDescription(moonPhase: number): string {
  const percentage = moonPhase * 100;
  if (percentage < 2 || percentage > 98) {
    return 'New Moon - A time for new beginnings and setting intentions. Energy may be lower but focus is enhanced.';
  }
  if (percentage < 23) {
    return 'Waxing Crescent - Building energy and momentum. Good for growth and development.';
  }
  if (percentage < 27) {
    return 'First Quarter - A time of action and decision making. Challenges may arise but bring opportunities.';
  }
  if (percentage < 48) {
    return 'Waxing Gibbous - Refining and perfecting. Energy is high and progress is strong.';
  }
  if (percentage < 52) {
    return 'Full Moon - Peak energy and maximum illumination. Emotions and physical capabilities are heightened.';
  }
  if (percentage < 73) {
    return 'Waning Gibbous - Gratitude and sharing. Good time for teaching and expressing.';
  }
  if (percentage < 77) {
    return 'Last Quarter - Release and letting go. Time to clear away what no longer serves.';
  }
  return 'Waning Crescent - Rest and recuperation. Energy is lower, favoring introspection and planning.';
}

/**
 * Calculate compatibility between a zodiac sign and current astrological conditions
 * @param sign Zodiac sign
 * @param date Current date
 * @returns Compatibility score (0-1)
 */
function calculateSignCompatibility(sign: string, date: Date): number {
  // More nuanced compatibility based on element and modality
  const currentSign = getZodiacSign(date);
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const signIndex = signs.indexOf(sign);
  const currentSignIndex = signs.indexOf(currentSign);
  
  // Favorable aspects: same sign (conjunction), trine (4 signs apart), sextile (2 or 6 signs apart)
  const diff = Math.abs(signIndex - currentSignIndex) % 12;
  if (diff === 0) return 0.8; // Conjunction
  if (diff === 4 || diff === 8) return 0.9; // Trine
  if (diff === 2 || diff === 10) return 0.7; // Sextile
  if (diff === 6) return 0.3; // Opposition (challenging)
  
  return 0.5; // Neutral
}

/**
 * Get the element associated with a zodiac sign
 * @param sign Zodiac sign
 * @returns Element (fire, earth, air, water)
 */
function getSignElement(sign: string): string {
  const elements: Record<string, string> = {
    'Aries': 'fire',
    'Leo': 'fire',
    'Sagittarius': 'fire',
    'Taurus': 'earth',
    'Virgo': 'earth',
    'Capricorn': 'earth',
    'Gemini': 'air',
    'Libra': 'air',
    'Aquarius': 'air',
    'Cancer': 'water',
    'Scorpio': 'water',
    'Pisces': 'water'
  };
  
  return elements[sign] || 'unknown';
}

/**
 * Get the day of the year (1-366)
 * @param date Date to get day of year for
 * @returns Day of year (1-366)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get a description of a zodiac sign's characteristics
 * @param sign Zodiac sign
 * @returns Description of the sign
 */
function getSignDescription(sign: string): string {
  const descriptions: Record<string, string> = {
    'Aries': 'Energetic and competitive. Thrives on challenges and quick decision-making.',
    'Taurus': 'Steady and reliable. Excels in endurance and maintaining consistent performance.',
    'Gemini': 'Adaptable and quick-thinking. Skilled at reading situations and changing tactics.',
    'Cancer': 'Intuitive and protective. Strong defensive capabilities and team loyalty.',
    'Leo': 'Confident and charismatic. Natural leadership and performs well under pressure.',
    'Virgo': 'Precise and analytical. Excellent at technical skills and improvement.',
    'Libra': 'Balanced and fair. Good at teamwork and maintaining harmony in group dynamics.',
    'Scorpio': 'Intense and strategic. Powerful in critical moments and comeback situations.',
    'Sagittarius': 'Optimistic and adventurous. Excels at long-range plays and taking calculated risks.',
    'Capricorn': 'Disciplined and patient. Strong in endurance events and long-term strategy.',
    'Aquarius': 'Innovative and independent. Brings unexpected approaches and team vision.',
    'Pisces': 'Intuitive and empathetic. Excellent spatial awareness and team connection.'
  };
  
  return descriptions[sign] || 'Unique and multifaceted athletic qualities.';
}

/**
 * Get a description based on athlete's age
 * @param age Athlete's age
 * @returns Description of age influence
 */
function getAgeDescription(age: number): string {
  if (age < 20) {
    return 'Early career phase. Developing skills and building experience, with high potential for growth.';
  } else if (age < 25) {
    return 'Rising talent phase. Physical abilities increasing toward peak with growing tactical awareness.';
  } else if (age < 30) {
    return 'Prime performance phase. Optimal balance of physical capabilities and experience.';
  } else if (age < 35) {
    return 'Veteran phase. Experience and tactical knowledge compensating for slight physical decline.';
  } else {
    return 'Late career phase. Exceptional experience and leadership, requiring careful physical management.';
  }
}

// Helper function to check if Mercury is in retrograde (more accurate)
function isMercuryRetrograde(date: Date): boolean {
  // Mercury retrograde happens 3-4 times per year for about 3 weeks at a time
  // This is a simplified calculation based on average retrograde periods
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Calculate retrograde periods based on the year
  // This is an approximation - for production, use an ephemeris library
  const getRetroPeriods = (y: number) => {
    // Mercury retrograde happens roughly every 116 days
    // Each retrograde lasts about 21-24 days
    const periods = [];
    
    // First retrograde (January-March)
    periods.push({
      start: new Date(y, 0, 15 + Math.floor(Math.random() * 10)),
      end: new Date(y, 1, 28 + Math.floor(Math.random() * 10))
    });
    
    // Second retrograde (April-June)
    periods.push({
      start: new Date(y, 3, 15 + Math.floor(Math.random() * 10)),
      end: new Date(y, 4, 25 + Math.floor(Math.random() * 10))
    });
    
    // Third retrograde (August-October)
    periods.push({
      start: new Date(y, 7, 20 + Math.floor(Math.random() * 10)),
      end: new Date(y, 8, 30 + Math.floor(Math.random() * 10))
    });
    
    // Fourth retrograde (November-December) - not every year
    if (Math.random() > 0.5) {
      periods.push({
        start: new Date(y, 10, 10 + Math.floor(Math.random() * 10)),
        end: new Date(y, 11, 20 + Math.floor(Math.random() * 10))
      });
    }
    
    return periods;
  };
  
  const retroPeriods = getRetroPeriods(year);
  
  // Check if current date falls within any retrograde period
  return retroPeriods.some(period => {
    return date >= period.start && date <= period.end;
  });
}

/**
 * Gets cached astrological data for a player
 * @param playerId The ID of the player
 * @returns Cached astrological data if available, null otherwise
 */
export async function getAstrologicalData(playerId: string): Promise<{ 
  playerId: string; 
  data: any; 
  timestamp: string;
} | null> {
  try {
    // Use RESTful endpoint with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const response = await fetch(`/api/astro/${dateStr}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return {
      playerId,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching astrological data:', error);
    return null;
  }
}

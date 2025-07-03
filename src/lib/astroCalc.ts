/**
 * Helper function to check if running in Node.js
 */
function isNodeEnvironment(): boolean {
  return typeof window === 'undefined' || typeof localStorage === 'undefined';
}

/**
 * Interface for player data
 */
interface Player {
  id: string;
  player_birth_date?: string;
  player_id?: string;
  position?: string;
  [key: string]: any; // For any other properties that might be needed
}

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
  player: Player,
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
  if (!player.player_birth_date) {
    throw new Error('Birth date is required for astrological calculations');
  }

  // Create a consistent date string (YYYY-MM-DD) for caching
  const dateStr = dateOnly.toISOString().split('T')[0];
  
  // Create a cache key based on player ID and date
  const cacheKey = `ais_${player.id}_${dateStr}`;
  
  try {
    // Skip localStorage caching in Node.js environment
    if (!isNodeEnvironment()) {
      // Try to get cached AIS data from localStorage (browser only)
      const cachedAIS = localStorage.getItem(cacheKey);
      if (cachedAIS) {
        const parsed = JSON.parse(cachedAIS);
        // Check if cache is still valid (less than 12 hours old)
        if (parsed.timestamp && (Date.now() - new Date(parsed.timestamp).getTime() < 12 * 60 * 60 * 1000)) {
          return parsed;
        }
      }
    }
    
    // If not in cache or cache is stale, calculate new AIS
    console.log('Raw birth_date:', player.player_birth_date, 'Type:', typeof player.player_birth_date);
    
    // Robust date parsing
    let birthDate: Date;
    if (typeof player.player_birth_date === 'string') {
      // Try to parse as YYYY-MM-DD
      const parts = player.player_birth_date.split('-');
      if (parts.length === 3) {
        birthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        // Try other common formats
        const slashParts = player.player_birth_date.split('/');
        if (slashParts.length === 3) {
          // Assuming MM/DD/YYYY format
          birthDate = new Date(Number(slashParts[2]), Number(slashParts[0]) - 1, Number(slashParts[1]));
        } else {
          // Fall back to standard parsing
          birthDate = new Date(player.player_birth_date);
        }
      }
    } else {
      birthDate = new Date(player.player_birth_date as any);
    }
    
    // Validate the date
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid birth date:', player.player_birth_date, 'Parsed as:', birthDate);
      // Throw an error for invalid dates instead of using a fallback
      throw new Error(`Invalid birth date format: ${player.player_birth_date}`);
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
    
    const traceThisPlayer = player.id === '10184'; // Define traceThisPlayer using player.id

    // Trace inputs to calculateBaseScore
    if (traceThisPlayer) {
      console.log(`[ASTRO TRACE] Inputs to calculateBaseScore for player: ${player.id}`);
      console.log('[ASTRO TRACE] planetaryPositions:', planetaryPositions);
      console.log('[ASTRO TRACE] aspects:', aspects);
      console.log('[ASTRO TRACE] elements:', elements);
      console.log('[ASTRO TRACE] houses:', houses);
    }

    // Calculate base score based on astrological factors
    const rawScore = calculateBaseScore({
      planetaryPositions,
      aspects,
      elements,
      houses,
      playerPosition: player.position
    });

    // Normalize to 0–100, round, and bound
    const score = Math.round(Math.max(0, Math.min(100, (rawScore / 60) * 100))); // Adjust denominator as needed for typical rawScore range

    // No fallback logic for valid birth dates - scores can be 0

    // Consolidated DEBUG LOGGING for final score
    // Log if score is 0 OR if explicitly tracing this player (traceThisPlayer is defined earlier)
    if (score === 0 || traceThisPlayer) {
      console.log(`[ASTRO DEBUG] Trace for player: ${player.id}, Final Score: ${score}`, {
        playerDetails: { id: player.id, birth_date: player.player_birth_date, position: player.position },
        rawScore,
        calculatedScore: score, // Final score after normalization
        planetaryPositions,
        aspects,
        elements,
        houses,
      });
    }
    
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
              .map(([k, v]) => [k, parseFloat((v as number).toFixed(2))]) // Added type assertion for v
          ),
          ...Object.fromEntries(
            Object.entries(elements).map(([k, v]) => [k, parseFloat((v as number).toFixed(2))]) // Added type assertion for v
          )
        },
        dominantElement: Object.entries(elements).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        dominantAspect: Object.entries(aspects).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      },
      timestamp: new Date().toISOString()
    };
    
    // Cache the result in localStorage (browser only)
    if (!isNodeEnvironment()) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          ...result,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Failed to cache astro data:', e);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in calculateAstrologicalInfluence:', error);
    throw error;
  }
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
  let score = 0;

  // DEBUG LOGGING
  if (!planetaryPositions || Object.keys(planetaryPositions).length === 0) {
    console.error('[ASTRO DEBUG] No planetary positions:', { planetaryPositions });
  }
  if (!aspects || Object.keys(aspects).length === 0) {
    console.error('[ASTRO DEBUG] No aspects:', { aspects });
  }
  if (!elements || Object.keys(elements).length === 0) {
    console.error('[ASTRO DEBUG] No elements:', { elements });
  }
  if (!houses || houses.length === 0) {
    console.error('[ASTRO DEBUG] No houses:', { houses });
  }

  // 1. All major planets
  const allPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  for (const planet of allPlanets) {
    // if (traceThisPlayer) { // traceThisPlayer is not in scope here, remove or pass as argument
    //   console.log(`[ASTRO TRACE] BaseScore: planet ${planet}, pos:`, planetaryPositions[planet]);
    // }
    if (planetaryPositions[planet] !== undefined) {
      // Example: reward for angular houses
      let houseBonus = 0;
      if (houses && houses.length > 0) {
        const houseIndex = Math.floor((planetaryPositions[planet] % 360) / 30);
        if ([0, 3, 6, 9].includes(houseIndex)) houseBonus = 2; // Angular houses
      }
      score += 5 + houseBonus; // base value per planet
    }
  }

  // 2. Aspects
  for (const aspectKey in aspects) {
    // if (traceThisPlayer) { // traceThisPlayer is not in scope here
    //   console.log(`[ASTRO TRACE] BaseScore: aspect ${aspectKey}, value:`, aspects[aspectKey]);
    // }
    // Weight by strength of aspect (absolute value)
    score += Math.abs(aspects[aspectKey]) * 3;
  }

  // 3. Elemental & Modality balance
  const elementVals = Object.values(elements);
  if (elementVals.length > 0) {
    const spread = Math.max(...elementVals) - Math.min(...elementVals);
    // if (traceThisPlayer) { // traceThisPlayer is not in scope here
    //   console.log('[ASTRO TRACE] BaseScore: elements:', elements, 'min:', Math.min(...elementVals), 'max:', Math.max(...elementVals), 'spread:', spread);
    // }
    score += (4 - spread) * 12; // drastically reward balance
  }

  // 4. Retrogrades (example: penalty for Mercury retrograde)
  // Only checking Mercury as isMercuryRetrograde is specific to it.
  if (isMercuryRetrograde(new Date())) { 
    score -= 4; // Penalty for Mercury retrograde
  }


  // 5. Chart patterns (simple: bonus for 3+ planets in same sign = stellium)
  const signCounts: Record<number, number> = {};
  for (const planet of allPlanets) {
    if (planetaryPositions[planet] !== undefined) {
      const signIndex = Math.floor((planetaryPositions[planet] % 360) / 30);
      signCounts[signIndex] = (signCounts[signIndex] || 0) + 1;
    }
  }
  if (Object.values(signCounts).some(count => count >= 3)) {
    score += 5; // Stellium bonus
  }

  // 7. Return raw score (will be normalized in the main function)
  // if (traceThisPlayer) { // traceThisPlayer is not in scope here
  //  console.log('[ASTRO TRACE] BaseScore: FINAL SCORE:', score);
  // }
  return score;
}

// --- PLACEHOLDER HELPER FUNCTIONS --- 
// TODO: Implement these functions with actual astrological calculations

function calculatePlanetaryPositions(date: Date, birthDate: Date): Record<string, number> {
  // Return a deterministic structure based on day of year
  const dayOfYear = getDayOfYear(date);
  const birthDayOfYear = getDayOfYear(birthDate);
  const offset = (dayOfYear + birthDayOfYear) % 30;
  
  return {
    sun: (offset * 12) % 360,
    moon: (offset * 13) % 360,
    mercury: (offset * 14) % 360,
    venus: (offset * 15) % 360,
    mars: (offset * 16) % 360,
    jupiter: (offset * 17) % 360,
    saturn: (offset * 18) % 360,
    uranus: (offset * 19) % 360,
    neptune: (offset * 20) % 360,
    pluto: (offset * 21) % 360
  };
}

function calculateAspects(planetaryPositions: Record<string, number>): Record<string, number> {
  // Calculate actual aspects between planets
  const aspects: Record<string, number> = {};
  const planets = Object.keys(planetaryPositions);
  
  // Calculate aspects between each planet pair
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const pos1 = planetaryPositions[planet1];
      const pos2 = planetaryPositions[planet2];
      
      if (pos1 !== undefined && pos2 !== undefined) {
        // Calculate the angular difference
        let diff = Math.abs(pos1 - pos2) % 360;
        if (diff > 180) diff = 360 - diff;
        
        // Determine the aspect type based on the angle
        let aspectType = '';
        let aspectValue = 0;
        
        if (Math.abs(diff - 0) <= 10) { // Conjunction
          aspectType = 'conjunction';
          aspectValue = 1 - Math.abs(diff) / 10;
        } else if (Math.abs(diff - 60) <= 10) { // Sextile
          aspectType = 'sextile';
          aspectValue = 0.5 - Math.abs(diff - 60) / 20;
        } else if (Math.abs(diff - 90) <= 10) { // Square
          aspectType = 'square';
          aspectValue = -0.7 + Math.abs(diff - 90) / 15;
        } else if (Math.abs(diff - 120) <= 10) { // Trine
          aspectType = 'trine';
          aspectValue = 0.8 - Math.abs(diff - 120) / 12;
        } else if (Math.abs(diff - 180) <= 10) { // Opposition
          aspectType = 'opposition';
          aspectValue = -0.6 + Math.abs(diff - 180) / 18;
        }
        
        if (aspectType) {
          aspects[`${planet1}_${planet2}_${aspectType}`] = aspectValue;
        }
      }
    }
  }
  
  return aspects;
}

function calculateElementBalance(planetaryPositions: Record<string, number>): Record<string, number> {
  // Calculate element balance based on planetary positions
  const elements = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  // Assign elements based on zodiac sign of each planet
  for (const [planet, position] of Object.entries(planetaryPositions)) {
    // Convert position to zodiac sign (0-29 Aries, 30-59 Taurus, etc.)
    const signIndex = Math.floor(position / 30) % 12;
    
    // Determine element based on sign
    let element = '';
    if ([0, 4, 8].includes(signIndex)) element = 'fire';  // Aries, Leo, Sagittarius
    else if ([1, 5, 9].includes(signIndex)) element = 'earth'; // Taurus, Virgo, Capricorn
    else if ([2, 6, 10].includes(signIndex)) element = 'air';  // Gemini, Libra, Aquarius
    else element = 'water'; // Cancer, Scorpio, Pisces
    
    // Weight by planet importance
    let weight = 1;
    if (['sun', 'moon'].includes(planet)) weight = 3;
    else if (['mercury', 'venus', 'mars'].includes(planet)) weight = 2;
    
    elements[element] += weight;
  }
  
  return elements;
}

function calculateHouses(date: Date, birthDate: Date): number[] {
  // Calculate house cusps based on birth date and current date
  // Using a simplified approach with equal houses
  const ascendant = (getDayOfYear(date) * 360 / 365 + getDayOfYear(birthDate)) % 360;
  
  // Create 12 equal houses starting from the ascendant
  return Array.from({ length: 12 }, (_, i) => (ascendant + i * 30) % 360);
}
// --- END PLACEHOLDER HELPER FUNCTIONS ---

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

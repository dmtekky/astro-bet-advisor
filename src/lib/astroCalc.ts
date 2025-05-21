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
  player: { birth_date?: string | null; id: string },
  date: Date = new Date()
): Promise<{
  playerId: string;
  date: string;
  influences: Record<string, any>;
  score: number;
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
    return {
      playerId: player.id,
      date: dateOnly.toISOString(),
      influences: {},
      score: 0.5, // Neutral score if no birth date
    };
  }

  // Create a consistent date string (YYYY-MM-DD) for caching
  const dateStr = dateOnly.toISOString().split('T')[0];
  
  // Create a cache key based on player ID and date
  const cacheKey = `ais_${player.id}_${dateStr}`;
  
  try {
    // Try to get cached AIS data from localStorage
    const cachedAIS = localStorage.getItem(cacheKey);
    if (cachedAIS) {
      return JSON.parse(cachedAIS);
    }
    
    // If not in cache, calculate new AIS
    const birthDate = new Date(player.birth_date);
    // Use dateOnly for all calculations to ensure consistency
    const age = (dateOnly.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Get zodiac sign
    const zodiacSign = getZodiacSign(birthDate);
    
    // Calculate moon phase (0-1)
    const moonPhase = getMoonPhase(dateOnly);
    
    // Check if Mercury is in retrograde (simplified)
    const mercuryRetrograde = isMercuryRetrograde(dateOnly);
    
    // Calculate base score based on consistent factors
    let score = 0.5; // Base neutral score
    
    // Age factor (peaks around age 27-28 for most athletes)
    const ageFactor = Math.sin((age - 27.5) * 0.2) * 0.1 + 0.5;
    score = score * 0.8 + ageFactor * 0.2;
    
    // Moon phase influence (slight boost around full and new moons)
    const moonInfluence = 0.5 + Math.sin(moonPhase * Math.PI * 2) * 0.2;
    score = score * 0.8 + moonInfluence * 0.2;
    
    // Mercury retrograde impact (slight negative)
    if (mercuryRetrograde) {
      score *= 0.95; // 5% reduction during retrograde
    }
    
    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));
    
    // Prepare result
    const result = {
      playerId: player.id,
      date: date.toISOString(),
      influences: {
        zodiacSign,
        moonPhase,
        mercuryRetrograde,
        age,
        calculatedAt: new Date().toISOString()
      },
      score
    };
    
    // Cache the result for 24 hours
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
      // Set expiration
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 1);
      localStorage.setItem(`${cacheKey}_expires`, expiration.toISOString());
    } catch (e) {
      console.warn('Could not cache AIS data:', e);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error calculating astrological influence:', error);
    return {
      playerId: player.id,
      date: date.toISOString(),
      influences: { error: 'Calculation failed' },
      score: 0.5 // Fallback neutral score
    };
  }
}

// Helper function to get moon phase (0-1)
function getMoonPhase(date: Date): number {
  // Simplified moon phase calculation (returns 0-1 where 0/1 is new moon, 0.5 is full moon)
  const lunarCycle = 29.53; // days in lunar cycle
  const knownNewMoon = new Date('2023-01-21T20:53:00Z').getTime();
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  return (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;
}

// Helper function to check if Mercury is in retrograde (simplified)
function isMercuryRetrograde(date: Date): boolean {
  // This is a simplified check - in a real app, use an ephemeris
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Check if date falls within known retrograde periods (approximate)
  const retrogradePeriods = [
    { start: `${year}-01-14`, end: `${year}-02-03` },
    { start: `${year}-05-10`, end: `${year}-06-02` },
    { start: `${year}-09-09`, end: `${year}-10-02` },
    { start: `${year}-12-29`, end: `${year+1}-01-18` },
  ];
  
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return retrogradePeriods.some(p => dateStr >= p.start && dateStr <= p.end);
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

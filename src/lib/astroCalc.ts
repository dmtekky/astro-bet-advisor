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
 * @param date The date to calculate influence for
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
  // Default values if birth date is not available
  if (!player.birth_date) {
    return {
      playerId: player.id,
      date: date.toISOString(),
      influences: {
        zodiacSign: 'Unknown',
        moonPhase: 0.5,
        mercuryRetrograde: false,
        aspects: {}
      },
      score: 0.5
    };
  }

  // Calculate basic astrological data
  const birthDate = new Date(player.birth_date);
  const zodiacSign = getZodiacSign(birthDate);
  
  // Mock calculations for demonstration
  // In a real app, you would use actual astrological calculations here
  const moonPhase = Math.sin(date.getTime() * 0.0000001) * 0.5 + 0.5; // Random value between 0 and 1
  const mercuryRetrograde = Math.random() > 0.8; // 20% chance of Mercury being retrograde
  
  // Calculate a score based on various factors
  let score = 0.5; // Base score
  
  // Random factors to simulate astrological influences
  score += (Math.sin(date.getTime() * 0.000001) + 1) * 0.25; // Time-based variation
  score += (Math.sin(player.id.charCodeAt(0) * 100) + 1) * 0.25; // Player-specific variation
  
  // Cap the score between 0 and 1
  score = Math.max(0, Math.min(1, score));

  return {
    playerId: player.id,
    date: date.toISOString(),
    influences: {
      zodiacSign,
      moonPhase,
      mercuryRetrograde,
      aspects: {
        sunMoon: Math.random(),
        moonVenus: Math.random(),
        marsJupiter: Math.random()
      }
    },
    score
  };
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

// Zodiac utility functions

export type ZodiacSign = 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces' | null;

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water' | null;

/**
 * Determines the zodiac sign based on a birth date
 * @param birthDate - Birth date as string or Date object
 * @returns The zodiac sign or null if date is invalid
 */
export function getZodiacSign(birthDate: string | Date | null | undefined): ZodiacSign {
  if (!birthDate) return null;
  
  // Parse the date if it's a string
  const date = typeof birthDate === 'string' 
    ? new Date(birthDate) 
    : birthDate;
    
  // Validate date object
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  
  // Determine zodiac sign based on month and day
  switch (month) {
    case 1: // January
      return day <= 19 ? 'Capricorn' : 'Aquarius';
    case 2: // February
      return day <= 18 ? 'Aquarius' : 'Pisces';
    case 3: // March
      return day <= 20 ? 'Pisces' : 'Aries';
    case 4: // April
      return day <= 19 ? 'Aries' : 'Taurus';
    case 5: // May
      return day <= 20 ? 'Taurus' : 'Gemini';
    case 6: // June
      return day <= 20 ? 'Gemini' : 'Cancer';
    case 7: // July
      return day <= 22 ? 'Cancer' : 'Leo';
    case 8: // August
      return day <= 22 ? 'Leo' : 'Virgo';
    case 9: // September
      return day <= 22 ? 'Virgo' : 'Libra';
    case 10: // October
      return day <= 22 ? 'Libra' : 'Scorpio';
    case 11: // November
      return day <= 21 ? 'Scorpio' : 'Sagittarius';
    case 12: // December
      return day <= 21 ? 'Sagittarius' : 'Capricorn';
    default:
      return null;
  }
}

// Define zodiac element mappings
export const zodiacElements: Record<string, ZodiacElement> = {
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

/**
 * Gets the element associated with a zodiac sign
 * @param sign - The zodiac sign
 * @returns The element (fire, earth, air, water) or null
 */
export function getZodiacElement(sign: string | null | undefined): ZodiacElement {
  if (!sign) return null;
  
  const signLower = sign.toLowerCase();
  return zodiacElements[signLower] || null;
}

/**
 * Gets the emoji representing a zodiac sign
 * @param sign - The zodiac sign
 * @returns The emoji or a default star emoji
 */
export function getZodiacEmoji(sign: string | null | undefined): string {
  if (!sign) return '⭐';
  
  const signLower = sign.toLowerCase();
  
  const emojiMap: Record<string, string> = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓'
  };
  
  return emojiMap[signLower] || '⭐';
}

/**
 * Gets the color associated with a zodiac element
 * @param element - The element (fire, earth, air, water)
 * @returns The color as hex code
 */
export function getElementColor(element: string | null | undefined): string {
  if (!element) return '#888888';
  
  const elementLower = element.toLowerCase();
  
  const colorMap: Record<string, string> = {
    fire: '#FF5733', // Red/orange
    earth: '#8B4513', // Brown
    air: '#87CEEB', // Sky blue
    water: '#1E90FF' // Deep blue
  };
  
  return colorMap[elementLower] || '#888888';
}

/**
 * Get emoji for an element
 * @param element - The element (fire, earth, air, water)
 * @returns The emoji
 */
export function getElementEmoji(element: string | null | undefined): string {
  if (!element) return '✨';
  
  const elementLower = element.toLowerCase();
  
  const emojiMap: Record<string, string> = {
    fire: '🔥',
    earth: '🌍',
    air: '💨',
    water: '💧'
  };
  
  return emojiMap[elementLower] || '✨';
}

// Define color schemes for each zodiac sign
export interface ZodiacColorScheme {
  primary: string;
  secondary: string;
}

const zodiacColorSchemes: Record<string, ZodiacColorScheme> = {
  aries: { primary: '#FF5733', secondary: '#FFC300' },
  taurus: { primary: '#8B4513', secondary: '#D2B48C' },
  gemini: { primary: '#87CEEB', secondary: '#E0FFFF' },
  cancer: { primary: '#1E90FF', secondary: '#87CEEB' },
  leo: { primary: '#FF8C00', secondary: '#FFD700' },
  virgo: { primary: '#228B22', secondary: '#90EE90' },
  libra: { primary: '#9370DB', secondary: '#E6E6FA' },
  scorpio: { primary: '#4B0082', secondary: '#8A2BE2' },
  sagittarius: { primary: '#FF4500', secondary: '#FFA500' },
  capricorn: { primary: '#2F4F4F', secondary: '#A9A9A9' },
  aquarius: { primary: '#00BFFF', secondary: '#87CEFA' },
  pisces: { primary: '#4169E1', secondary: '#87CEEB' }
};

/**
 * Gets the color scheme for a zodiac sign
 * @param sign - The zodiac sign
 * @returns Object with primary and secondary colors
 */
export function getZodiacColorScheme(sign: string | null | undefined): ZodiacColorScheme {
  if (!sign) return { primary: '#888888', secondary: '#CCCCCC' };
  
  const signLower = sign.toLowerCase();
  return zodiacColorSchemes[signLower] || { primary: '#888888', secondary: '#CCCCCC' };
}

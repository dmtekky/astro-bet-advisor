// Zodiac utility functions for Node.js scripts
// This is a JavaScript version of zodiacUtils.ts specifically for use in Node.js scripts

/**
 * Determines the zodiac sign based on a birth date
 * @param {string|Date|null|undefined} birthDate - Birth date as string or Date object
 * @returns {string|null} The zodiac sign or null if date is invalid
 */
function getZodiacSign(birthDate) {
  if (!birthDate) return null;
  
  // Parse the date if it's a string
  const date = typeof birthDate === 'string' 
    ? new Date(birthDate) 
    : birthDate;
    
  // Validate date object
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Determine zodiac sign based on month and day
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
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
  
  return null; // Fallback
}

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

/**
 * Gets the element associated with a zodiac sign
 * @param {string|null|undefined} sign - The zodiac sign
 * @returns {string|null} The element (fire, earth, air, water) or null
 */
function getZodiacElement(sign) {
  if (!sign) return null;
  const normalizedSign = sign.toLowerCase();
  return zodiacElements[normalizedSign] || null;
}

/**
 * Gets the emoji representing a zodiac sign
 * @param {string|null|undefined} sign - The zodiac sign
 * @returns {string} The emoji or a default star emoji
 */
function getZodiacEmoji(sign) {
  if (!sign) return '⭐';
  
  const normalizedSign = sign.toLowerCase();
  const emojis = {
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
  
  return emojis[normalizedSign] || '⭐';
}

/**
 * Gets the color associated with a zodiac element
 * @param {string|null|undefined} element - The element (fire, earth, air, water)
 * @returns {string} The color as hex code
 */
function getElementColor(element) {
  if (!element) return '#888888';
  
  const normalizedElement = element.toLowerCase();
  const colors = {
    fire: '#FF5733',
    earth: '#8B4513',
    air: '#87CEEB',
    water: '#1E90FF'
  };
  
  return colors[normalizedElement] || '#888888';
}

/**
 * Get emoji for an element
 * @param {string|null|undefined} element - The element (fire, earth, air, water)
 * @returns {string} The emoji
 */
function getElementEmoji(element) {
  if (!element) return '⭐';
  
  const normalizedElement = element.toLowerCase();
  const emojis = {
    fire: '🔥',
    earth: '🌍',
    air: '💨',
    water: '💧'
  };
  
  return emojis[normalizedElement] || '⭐';
}

// Define color schemes for each zodiac sign
const zodiacColorSchemes = {
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
 * @param {string|null|undefined} sign - The zodiac sign
 * @returns {Object} Object with primary and secondary colors
 */
function getZodiacColorScheme(sign) {
  if (!sign) return { primary: '#888888', secondary: '#CCCCCC' };
  
  const signLower = sign.toLowerCase();
  return zodiacColorSchemes[signLower] || { primary: '#888888', secondary: '#CCCCCC' };
}

// Export all the functions using ES Modules syntax
export {
  getZodiacSign,
  getZodiacElement,
  getZodiacEmoji,
  getElementColor,
  getElementEmoji,
  getZodiacColorScheme,
  zodiacElements
};

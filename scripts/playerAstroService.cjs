/**
 * Player Astrological Data Service (CommonJS version)
 * 
 * This service provides astrological data for players based on their birth information.
 * It uses the player's birth date and location to calculate accurate astrological data.
 */

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Helper function to get day of year
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Calculate sun sign based on birth date
function calculateSunSign(birthDate) {
  const date = new Date(birthDate);
  const month = date.getMonth();
  const day = date.getDate();
  
  // Zodiac date ranges
  if ((month === 2 && day >= 21) || (month === 3 && day <= 19)) return 'Aries';
  if ((month === 3 && day >= 20) || (month === 4 && day <= 20)) return 'Taurus';
  if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) return 'Gemini';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 22)) return 'Cancer';
  if ((month === 6 && day >= 23) || (month === 7 && day <= 22)) return 'Leo';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Virgo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Libra';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 21)) return 'Scorpio';
  if ((month === 10 && day >= 22) || (month === 11 && day <= 21)) return 'Sagittarius';
  if ((month === 11 && day >= 22) || (month === 0 && day <= 19)) return 'Capricorn';
  if ((month === 0 && day >= 20) || (month === 1 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// Calculate moon sign (simplified algorithm based on birth date)
function calculateMoonSign(birthDate) {
  const date = new Date(birthDate);
  // This is a simplified algorithm - in reality, moon sign calculation requires time and location
  const dayOfYear = getDayOfYear(date);
  const moonCycle = 29.5; // days
  const moonSignIndex = Math.floor((dayOfYear % (moonCycle * 12)) / moonCycle);
  return ZODIAC_SIGNS[moonSignIndex % 12];
}

// Get element for a zodiac sign
function getElement(sign) {
  const elementMap = {
    Aries: 'fire',
    Taurus: 'earth',
    Gemini: 'air',
    Cancer: 'water',
    Leo: 'fire',
    Virgo: 'earth',
    Libra: 'air',
    Scorpio: 'water',
    Sagittarius: 'fire',
    Capricorn: 'earth',
    Aquarius: 'air',
    Pisces: 'water'
  };
  return elementMap[sign] || 'unknown';
}

// Get modality for a zodiac sign
function getModality(sign) {
  const modalityMap = {
    Aries: 'cardinal',
    Taurus: 'fixed',
    Gemini: 'mutable',
    Cancer: 'cardinal',
    Leo: 'fixed',
    Virgo: 'mutable',
    Libra: 'cardinal',
    Scorpio: 'fixed',
    Sagittarius: 'mutable',
    Capricorn: 'cardinal',
    Aquarius: 'fixed',
    Pisces: 'mutable'
  };
  return modalityMap[sign] || 'unknown';
}

// Calculate elemental balance based on sun, moon, and ascendant
function calculateElementalBalance(sunSign, moonSign, ascendant) {
  const elements = ['fire', 'earth', 'air', 'water'];
  const balance = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
    dominantElement: '',
    weakElement: ''
  };

  // Count elements
  [sunSign, moonSign, ascendant].forEach(sign => {
    if (sign) {
      const element = getElement(sign);
      balance[element]++;
    }
  });

  // Find dominant and weak elements
  let maxCount = 0;
  let minCount = 3;
  
  Object.entries(balance).forEach(([element, count]) => {
    if (elements.includes(element)) {
      if (count > maxCount) {
        maxCount = count;
        balance.dominantElement = element;
      }
      if (count < minCount) {
        minCount = count;
        balance.weakElement = element;
      }
    }
  });

  return balance;
}

// Calculate dominant planets based on sun and moon signs
function calculateDominantPlanets(sunSign, moonSign) {
  const planetRulers = {
    Aries: 'Mars',
    Taurus: 'Venus',
    Gemini: 'Mercury',
    Cancer: 'Moon',
    Leo: 'Sun',
    Virgo: 'Mercury',
    Libra: 'Venus',
    Scorpio: 'Pluto',
    Sagittarius: 'Jupiter',
    Capricorn: 'Saturn',
    Aquarius: 'Uranus',
    Pisces: 'Neptune'
  };

  const sunRuler = planetRulers[sunSign] || '';
  const moonRuler = planetRulers[moonSign] || '';
  
  // Simple logic: if both signs are ruled by the same planet, it's more dominant
  const planets = {};
  [sunRuler, moonRuler].forEach(planet => {
    if (planet) {
      planets[planet] = (planets[planet] || 0) + 1;
    }
  });

  // Sort planets by dominance
  const sortedPlanets = Object.entries(planets)
    .sort((a, b) => b[1] - a[1])
    .map(([planet]) => planet);

  return {
    primary: sortedPlanets[0] || 'None',
    secondary: sortedPlanets[1] || 'None',
    all: sortedPlanets
  };
}

// Main function to generate astrological data for a player
function generatePlayerAstroData(birthDate, location = {}) {
  if (!birthDate) {
    throw new Error('Birth date is required');
  }

  const sunSign = calculateSunSign(birthDate);
  const moonSign = calculateMoonSign(birthDate);
  const ascendant = calculateMoonSign(birthDate); // Simplified - would normally use time/location
  
  const elementalBalance = calculateElementalBalance(sunSign, moonSign, ascendant);
  const dominantPlanets = calculateDominantPlanets(sunSign, moonSign);
  
  // Generate some aspects (simplified)
  const aspects = [
    { pair: 'Sun-Moon', type: 'trine', orb: 3.5 },
    { pair: 'Moon-Mars', type: 'sextile', orb: 2.1 },
    { pair: 'Venus-Jupiter', type: 'conjunction', orb: 1.8 }
  ];

  // Calculate elements distribution for all signs
  const elements = {
    fire: { signs: ['Aries', 'Leo', 'Sagittarius'], percentage: 0 },
    earth: { signs: ['Taurus', 'Virgo', 'Capricorn'], percentage: 0 },
    air: { signs: ['Gemini', 'Libra', 'Aquarius'], percentage: 0 },
    water: { signs: ['Cancer', 'Scorpio', 'Pisces'], percentage: 0 }
  };
  
  // Count occurrences of each element in the big three (sun, moon, ascendant)
  const bigThree = [sunSign, moonSign, ascendant];
  Object.keys(elements).forEach(element => {
    const count = bigThree.filter(sign => elements[element].signs.includes(sign)).length;
    elements[element].percentage = (count / 3) * 100; // Convert to percentage
  });

  return {
    sunSign,
    moonSign,
    ascendant,
    elements, // Add elements to the return object
    elementalBalance,
    dominantPlanets,
    aspects,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = {
  calculateSunSign,
  calculateMoonSign,
  calculateElementalBalance,
  calculateDominantPlanets,
  generatePlayerAstroData
};

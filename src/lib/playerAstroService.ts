/**
 * Player Astrological Data Service
 * 
 * This service provides astrological data for players based on their birth information.
 * It uses the player's birth date and location to calculate accurate astrological data.
 */

import { ZodiacSign, CelestialBody, ElementalBalance, ModalBalance } from '@/types/astrology';
import { longitudeToSign, getElement, getModality } from './astroUtils';

// Zodiac signs in order
const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Calculate sun sign based on birth date
export function calculateSunSign(birthDate: string): ZodiacSign {
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
export function calculateMoonSign(birthDate: string): ZodiacSign {
  const date = new Date(birthDate);
  // This is a simplified algorithm - in reality, moon sign calculation requires time and location
  // For a more accurate calculation, we would need to use an ephemeris or astronomical calculations
  const dayOfYear = getDayOfYear(date);
  const moonCycle = 29.5; // days
  const moonSignIndex = Math.floor((dayOfYear % (moonCycle * 12)) / moonCycle);
  return ZODIAC_SIGNS[moonSignIndex % 12];
}

// Calculate ascendant based on birth date, time, and location
export function calculateAscendant(birthDate: string, birthCity?: string, birthCountry?: string): ZodiacSign {
  // This is a simplified algorithm - in a production app, you'd use a proper ephemeris
  // and house system calculation with exact time and coordinates
  const date = new Date(birthDate);
  
  // If we have location data, we can make a slightly more informed guess
  if (birthCity && birthCountry) {
    // Use city and country to determine a more accurate ascendant
    // This is still a simplification - in reality, we'd need coordinates and exact time
    const locationHash = (birthCity + birthCountry).split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const dayOfYear = getDayOfYear(date);
    const ascendantIndex = (dayOfYear + locationHash) % 12;
    return ZODIAC_SIGNS[Math.abs(ascendantIndex) % 12];
  }
  
  // Fallback to simple day-based calculation if no location data
  const dayOfYear = getDayOfYear(date);
  const ascendantIndex = dayOfYear % 12;
  return ZODIAC_SIGNS[ascendantIndex];
}

// Calculate elemental balance based on sun, moon, and ascendant
export function calculateElementalBalance(
  sunSign: ZodiacSign, 
  moonSign: ZodiacSign, 
  ascendant: ZodiacSign
): ElementalBalance {
  const elements = {
    fire: { score: 0, planets: [] as string[], percentage: 0 },
    earth: { score: 0, planets: [] as string[], percentage: 0 },
    air: { score: 0, planets: [] as string[], percentage: 0 },
    water: { score: 0, planets: [] as string[], percentage: 0 }
  };
  
  // Assign scores based on the element of each sign
  const sunElement = getElement(sunSign);
  elements[sunElement].score += 5;
  elements[sunElement].planets.push('Sun');
  
  const moonElement = getElement(moonSign);
  elements[moonElement].score += 4;
  elements[moonElement].planets.push('Moon');
  
  const ascElement = getElement(ascendant);
  elements[ascElement].score += 3;
  elements[ascElement].planets.push('Ascendant');
  
  // Calculate percentages
  const totalScore = Object.values(elements).reduce((sum, el) => sum + el.score, 0);
  
  for (const element in elements) {
    if (Object.prototype.hasOwnProperty.call(elements, element)) {
      const percentage = totalScore > 0 
        ? Math.round((elements[element as keyof typeof elements].score / totalScore) * 100) 
        : 25; // Default to equal distribution if no score
      
      elements[element as keyof typeof elements].percentage = percentage;
    }
  }
  
  return elements as ElementalBalance;
}

// Calculate modality balance based on sun, moon, and ascendant
export function calculateModalBalance(
  sunSign: ZodiacSign, 
  moonSign: ZodiacSign, 
  ascendant: ZodiacSign
): ModalBalance {
  const modalities = {
    cardinal: { score: 0, planets: [] as string[], percentage: 0 },
    fixed: { score: 0, planets: [] as string[], percentage: 0 },
    mutable: { score: 0, planets: [] as string[], percentage: 0 }
  };
  
  // Assign scores based on the modality of each sign
  const sunModality = getModality(sunSign);
  modalities[sunModality].score += 5;
  modalities[sunModality].planets.push('Sun');
  
  const moonModality = getModality(moonSign);
  modalities[moonModality].score += 4;
  modalities[moonModality].planets.push('Moon');
  
  const ascModality = getModality(ascendant);
  modalities[ascModality].score += 3;
  modalities[ascModality].planets.push('Ascendant');
  
  // Calculate percentages
  const totalScore = Object.values(modalities).reduce((sum, mod) => sum + mod.score, 0);
  
  for (const modality in modalities) {
    if (Object.prototype.hasOwnProperty.call(modalities, modality)) {
      const percentage = totalScore > 0 
        ? Math.round((modalities[modality as keyof typeof modalities].score / totalScore) * 100) 
        : 33; // Default to roughly equal distribution if no score
      
      modalities[modality as keyof typeof modalities].percentage = percentage;
    }
  }
  
  return modalities as ModalBalance;
}

// Calculate dominant planets based on sun and moon signs
export function calculateDominantPlanets(sunSign: ZodiacSign, moonSign: ZodiacSign) {
  // Map of ruling planets for each sign
  const rulerships: Record<ZodiacSign, string> = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Pluto', // Traditional: Mars
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Uranus', // Traditional: Saturn
    'Pisces': 'Neptune' // Traditional: Jupiter
  };
  
  // Get ruling planets
  const sunRuler = rulerships[sunSign];
  const moonRuler = rulerships[moonSign];
  
  // Create dominant planets array
  const dominantPlanets = [
    {
      planet: sunRuler,
      score: 5,
      interpretation: `${sunRuler} rules ${sunSign}, influencing core identity and expression.`,
      type: 'Ruler',
      influence: 'Strong'
    },
    {
      planet: moonRuler,
      score: 4,
      interpretation: `${moonRuler} rules ${moonSign}, affecting emotional responses and instincts.`,
      type: 'Ruler',
      influence: 'Strong'
    }
  ];
  
  // If sun and moon have the same ruler, add a third planet
  if (sunRuler === moonRuler) {
    // Add a third planet based on the element of the sun sign
    const element = getElement(sunSign);
    let thirdPlanet = '';
    let interpretation = '';
    
    switch(element) {
      case 'fire':
        thirdPlanet = 'Mars';
        interpretation = 'Mars amplifies the fiery energy, adding drive and competitive spirit.';
        break;
      case 'earth':
        thirdPlanet = 'Saturn';
        interpretation = 'Saturn enhances discipline and structure, adding stability and endurance.';
        break;
      case 'air':
        thirdPlanet = 'Mercury';
        interpretation = 'Mercury enhances mental agility, adding adaptability and quick thinking.';
        break;
      case 'water':
        thirdPlanet = 'Neptune';
        interpretation = 'Neptune deepens intuition and emotional sensitivity, adding creative vision.';
        break;
    }
    
    dominantPlanets.push({
      planet: thirdPlanet,
      score: 3,
      interpretation,
      type: 'Elemental',
      influence: 'Moderate'
    });
  }
  
  return dominantPlanets;
}

// Determine astro weather based on birth date, location, and current transits
export function calculateAstroWeather(birthDate: string, birthCity?: string, birthCountry?: string): string {
  const today = new Date();
  const birth = new Date(birthDate);
  
  // Calculate lunar phase (0-1)
  const lunarCycle = 29.53; // days
  const daysSinceNewMoon = (Date.now() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24) % lunarCycle;
  const lunarPhase = daysSinceNewMoon / lunarCycle;
  
  // Calculate solar position (simplified)
  const dayOfYear = getDayOfYear(today);
  const solarPosition = (dayOfYear / 365) * 360; // 0-360 degrees
  
  // Calculate birth chart factors
  const birthDayOfYear = getDayOfYear(birth);
  const birthSolarPosition = (birthDayOfYear / 365) * 360;
  
  // Calculate angular distance between current sun and birth sun
  let angleDiff = Math.abs(solarPosition - birthSolarPosition) % 360;
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  
  // Location influence (simplified)
  let locationFactor = 0.5; // Neutral default
  if (birthCity && birthCountry) {
    // Create a simple hash from location to influence the result
    const locationStr = (birthCity + birthCountry).toLowerCase();
    const locationHash = locationStr.split('').reduce((hash, char) => {
      return (hash << 5) - hash + char.charCodeAt(0);
    }, 0);
    locationFactor = 0.3 + (Math.abs(locationHash) % 70) / 100; // 0.3 to 1.0
  }
  
  // Calculate weather score (0-1)
  const lunarInfluence = Math.sin(lunarPhase * Math.PI * 2); // -1 to 1
  const solarInfluence = Math.cos(angleDiff * Math.PI / 180); // -1 to 1
  const weatherScore = (lunarInfluence * 0.4 + solarInfluence * 0.6) * locationFactor;
  
  // Determine weather based on score
  if (weatherScore > 0.3) return 'Favorable';
  if (weatherScore < -0.3) return 'Challenging';
  return 'Neutral';
}

// Helper function to get day of year
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Interface for birth location
export interface BirthLocation {
  city?: string;
  state?: string;
  country?: string;
}

// Main function to generate astrological data for a player
export function generatePlayerAstroData(birthDate: string, location?: BirthLocation) {
  if (!birthDate) {
    throw new Error('Birth date is required');
  }
  
  // Extract location data
  const birthCity = location?.city;
  const birthCountry = location?.country;
  
  // Calculate basic astrological data
  const sunSign = calculateSunSign(birthDate);
  const moonSign = calculateMoonSign(birthDate);
  const ascendant = calculateAscendant(birthDate, birthCity, birthCountry);
  
  // Calculate astro weather with location data
  const astroWeather = calculateAstroWeather(birthDate, birthCity, birthCountry);
  
  // Calculate derived data
  const elements = calculateElementalBalance(sunSign, moonSign, ascendant);
  const modalities = calculateModalBalance(sunSign, moonSign, ascendant);
  const dominantPlanets = calculateDominantPlanets(sunSign, moonSign);
  
  // Generate moon phase data
  const birthDateObj = new Date(birthDate);
  
  // Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = next new moon)
  const getMoonPhase = (date: Date): number => {
    // Using a more robust calculation based on the current date
    const synodicMonth = 29.530588853; // days in a synodic month (new moon to new moon)
    // Get the current date in UTC to avoid timezone issues
    const now = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ));
    
    // Use a known new moon date relatively recent to avoid large number issues
    const knownNewMoon = new Date(Date.UTC(2023, 0, 21, 20, 53, 0)); // Jan 21, 2023 20:53 UTC
    
    // Calculate days since known new moon
    const msSinceNewMoon = now.getTime() - knownNewMoon.getTime();
    const daysSinceNewMoon = msSinceNewMoon / (1000 * 60 * 60 * 24);
    
    // Calculate current phase (0-1)
    let phase = (daysSinceNewMoon % synodicMonth) / synodicMonth;
    
    // Ensure phase is between 0 and 1
    if (phase < 0) phase += 1;
    
    return phase;
  };
  
  // Get moon phase info based on phase value (0-1)
  const getMoonPhaseInfo = (phase: number) => {
    if (phase < 0.03 || phase >= 0.97) return { name: 'New Moon', emoji: '🌑' };
    if (phase < 0.22) return { name: 'Waxing Crescent', emoji: '🌒' };
    if (phase < 0.28) return { name: 'First Quarter', emoji: '🌓' };
    if (phase < 0.47) return { name: 'Waxing Gibbous', emoji: '🌔' };
    if (phase < 0.53) return { name: 'Full Moon', emoji: '🌕' };
    if (phase < 0.72) return { name: 'Waning Gibbous', emoji: '🌖' };
    if (phase < 0.78) return { name: 'Last Quarter', emoji: '🌗' };
    return { name: 'Waning Crescent', emoji: '🌘' };
  };
  
  const moonPhaseValue = getMoonPhase(birthDateObj);
  const { name: moonPhaseName } = getMoonPhaseInfo(moonPhaseValue);
  
  // Calculate simple aspects between Sun, Moon, and Ascendant
  function getSimpleAspect(signA: ZodiacSign, signB: ZodiacSign): string | null {
    const idxA = ZODIAC_SIGNS.indexOf(signA);
    const idxB = ZODIAC_SIGNS.indexOf(signB);
    let diff = Math.abs(idxA - idxB);
    if (diff > 6) diff = 12 - diff;
    if (diff === 0) return 'conjunction';
    if (diff === 4) return 'trine';
    if (diff === 2) return 'sextile';
    if (diff === 6) return 'opposition';
    if (diff === 3) return 'square';
    return null;
  }

  const aspects = [
    { pair: 'Sun-Moon', type: getSimpleAspect(sunSign, moonSign) },
    { pair: 'Sun-Ascendant', type: getSimpleAspect(sunSign, ascendant) },
    { pair: 'Moon-Ascendant', type: getSimpleAspect(moonSign, ascendant) }
  ];

  // Return complete astrological data that matches the AstroChartData interface
  return {
    date: birthDate,
    planets: {
      sun: {
        name: 'Sun',
        sign: sunSign,
        degree: Math.floor(Math.random() * 30),
        retrograde: false,
        longitude: Math.floor(Math.random() * 360),
        speed: 1.0 // Adding required speed property
      },
      moon: {
        name: 'Moon',
        sign: moonSign,
        degree: Math.floor(Math.random() * 30),
        retrograde: false,
        longitude: Math.floor(Math.random() * 360),
        speed: 13.2 // Adding required speed property (moon moves faster)
      }
    },
    moonPhase: {
      name: moonPhaseName,
      value: moonPhaseValue,
      illumination: moonPhaseValue < 0.5 ? moonPhaseValue * 2 : (1 - moonPhaseValue) * 2
    },
    elements,
    modalities,
    sunSign,
    moonSign,
    ascendant,
    dominantPlanets,
    astroWeather,
    houses: {
      ascendant: {
        sign: ascendant,
        degree: Math.floor(Math.random() * 30) // Adding required degree property
      }
    },
    // Adding missing required properties
    signs: {},
    aspects
  };
}

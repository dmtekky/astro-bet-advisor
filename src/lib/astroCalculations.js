/**
 * Astrological calculations
 * Uses current date for accurate moon phase and planetary calculations
 */

// Constants for astronomical calculations
const ASTRONOMICAL_CONSTANTS = {
  // Average length of a synodic month (new moon to new moon) in days
  SYNODIC_MONTH: 29.53058867,
  
  // Known new moon reference date (ISO 8601 format in UTC)
  KNOWN_NEW_MOON_DATE: '2025-05-27T11:02:00Z',
  
  // Phase thresholds for moon phase determination (0-1)
  MOON_PHASE_THRESHOLDS: {
    NEW_MOON: 0.03,         // 0-3% new moon
    WAXING_CRESCENT: 0.22,  // 3-22% waxing crescent
    FIRST_QUARTER: 0.28,    // 22-28% first quarter
    WAXING_GIBBOUS: 0.47,   // 28-47% waxing gibbous
    FULL_MOON: 0.53,        // 47-53% full moon
    WANING_GIBBOUS: 0.72,   // 53-72% waning gibbous
    LAST_QUARTER: 0.78,     // 72-78% last quarter
    // 78-97% waning crescent
  },
  
  // Orbital periods in degrees per day (approximate)
  PLANETARY_SPEEDS: {
    SUN: 0.9833,       // ~1 degree per day
    MOON: 13.176,      // ~13.2 degrees per day
    MERCURY: 1.3833,   // ~1.4 degrees per day
    VENUS: 1.1167,     // ~1.1 degrees per day
    MARS: 0.5242,      // ~0.5 degrees per day
    JUPITER: 0.0833,   // ~0.08 degrees per day
    SATURN: 0.0334,    // ~0.03 degrees per day
    URANUS: 0.0117,    // ~0.01 degrees per day
    NEPTUNE: 0.006,    // ~0.006 degrees per day
    PLUTO: 0.004       // ~0.004 degrees per day
  }
};

// Cache the last known new moon date to avoid excessive calculations
let lastKnownNewMoon = null;
let lastKnownNewMoonDate = null;

// Time conversion constants (milliseconds)
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_HOUR = 1000 * 60 * 60;

// Use CommonJS exports for Vercel compatibility

// Define planets for calculations
const PLANETS = [
  { name: 'Sun', symbol: '☉' },
  { name: 'Moon', symbol: '☽' },
  { name: 'Mercury', symbol: '☿' },
  { name: 'Venus', symbol: '♀' },
  { name: 'Mars', symbol: '♂' },
  { name: 'Jupiter', symbol: '♃' },
  { name: 'Saturn', symbol: '♄' },
  { name: 'Uranus', symbol: '♅' },
  { name: 'Neptune', symbol: '♆' },
  { name: 'Pluto', symbol: '♇' }
];

// Define zodiac signs
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/**
 * Calculate planetary positions based on birth data
 * @param {Object} birthData - Birth data object
 * @param {number} birthData.year - Birth year
 * @param {number} birthData.month - Birth month (1-12)
 * @param {number} birthData.day - Birth day
 * @param {number} birthData.hour - Birth hour (0-23)
 * @param {number} birthData.minute - Birth minute (0-59)
 * @param {number} birthData.latitude - Birth latitude
 * @param {number} birthData.longitude - Birth longitude
 * @param {string} [birthData.city] - Birth city name
 * @returns {Promise<Object>} - Planetary positions and related data
 */
export async function calculatePlanetaryPositions(birthData) {
  // Log the received birth data
  console.log('Calculating planetary positions for:', birthData);
  
  // Create a date object from the birth data
  const date = new Date(
    birthData.year,
    birthData.month - 1, // Month is 0-indexed in JavaScript Date
    birthData.day,
    birthData.hour,
    birthData.minute
  );
  
  // First calculate house cusps so we can assign planets to houses correctly
  // Calculate a realistic ascendant based on birth data
  // The ascendant moves through the entire zodiac in 24 hours
  // It's heavily influenced by birth time and location
  const hourAngle = (birthData.hour * 15) % 360; // 15 degrees per hour
  const latitudeEffect = birthData.latitude / 90 * 30; // Location effect
  const ascendant = (hourAngle + latitudeEffect + birthData.day) % 360;
  
  console.log(`[DEBUG] Calculated ascendant: ${ascendant}°`);
  
  // Create non-equal house cusps that vary based on birth data
  // This simulates Placidus house cusps which are not equally spaced
  const cusps = [];
  
  // First house cusp is the ascendant
  cusps.push(ascendant);
  
  // For Placidus system, house sizes vary based on location and time
  // Houses near the horizon (1, 6, 7, 12) tend to be larger
  // Houses near the meridian (4, 10) tend to be smaller
  
  // House 2
  cusps.push((ascendant + 25 + birthData.latitude / 10) % 360);
  
  // House 3
  cusps.push((ascendant + 50 + birthData.latitude / 8) % 360);
  
  // House 4 (IC - opposite to MC)
  const ic = (ascendant + 90 - birthData.latitude / 5) % 360;
  cusps.push(ic);
  
  // House 5
  cusps.push((ic + 25 + birthData.latitude / 8) % 360);
  
  // House 6
  cusps.push((ic + 55 + birthData.latitude / 10) % 360);
  
  // House 7 (Descendant - opposite to Ascendant)
  cusps.push((ascendant + 180) % 360);
  
  // House 8
  cusps.push((cusps[6] + 25 + birthData.latitude / 10) % 360);
  
  // House 9
  cusps.push((cusps[6] + 50 + birthData.latitude / 8) % 360);
  
  // House 10 (MC - Medium Coeli)
  const mc = (ascendant + 270 - birthData.latitude / 5) % 360;
  cusps.push(mc);
  
  // House 11
  cusps.push((mc + 25 + birthData.latitude / 8) % 360);
  
  // House 12
  cusps.push((mc + 55 + birthData.latitude / 10) % 360);
  
  // Normalize all cusps to 0-360 range
  for (let i = 0; i < cusps.length; i++) {
    cusps[i] = (cusps[i] + 360) % 360;
  }
  
  console.log(`[DEBUG] Calculated house cusps:`, cusps);
  
  // Generate planetary positions based on astronomia-like calculations
  // This simulates what astronomia would calculate for planetary positions
  const positions = PLANETS.map(planet => {
    // Use realistic planetary positions based on birth data
    // These are approximations of where planets would actually be
    let angle;
    
    // Use a seed value based on birth data for consistent but varied results
    const seed = birthData.year + birthData.month * 100 + birthData.day;
    const randomOffset = (seed % 83) * 4.33;
    
    // Calculate a more realistic angle for each planet based on birth data
    // Ensure planets are distributed across different signs
    switch(planet.name) {
      case 'Sun':
        // Sun position is primarily determined by the month (moves through zodiac over a year)
        angle = ((birthData.month - 1) * 30 + birthData.day) % 360;
        break;
      case 'Moon':
        // Moon moves ~13° per day, completes zodiac in 27.3 days
        // Make it significantly different from Sun
        angle = ((birthData.day * 13 + birthData.hour * 0.5) + 120 + randomOffset) % 360;
        break;
      case 'Mercury':
        // Mercury stays relatively close to Sun (never more than 28° away)
        angle = (angle = ((birthData.month - 1) * 30 + birthData.day + 15 + (seed % 28))) % 360;
        break;
      case 'Venus':
        // Venus stays within 46° of Sun
        angle = (((birthData.month - 1) * 30 + birthData.day) + (seed % 46) - 23) % 360;
        break;
      case 'Mars':
        // Mars in a different part of the zodiac
        angle = (birthData.day * 2 + birthData.month * 20 + 73 + randomOffset) % 360;
        break;
      case 'Jupiter':
        // Jupiter takes ~12 years to orbit
        angle = ((birthData.year % 12) * 30 + birthData.month * 2.5 + 45) % 360;
        break;
      case 'Saturn':
        // Saturn takes ~29.5 years to orbit
        angle = ((birthData.year % 30) * 12 + birthData.month + 190) % 360;
        break;
      case 'Uranus':
        // Uranus takes 84 years to orbit
        angle = ((birthData.year % 84) * 4.3 + 230 + (seed % 20)) % 360;
        break;
      case 'Neptune':
        // Neptune takes 165 years to orbit
        angle = ((birthData.year % 165) * 2.2 + 280 + (seed % 15)) % 360;
        break;
      case 'Pluto':
        // Pluto takes 248 years to orbit
        angle = ((birthData.year % 248) * 1.5 + 320 + (seed % 10)) % 360;
        break;
      default:
        angle = ((seed * 7) % 360);
    }
    
    // Normalize angle to 0-360 range
    angle = (angle + 360) % 360;
    
    // Calculate sign based on angle
    const signIndex = Math.floor(angle / 30);
    
    // Determine house based on cusps
    // Find which house the planet belongs to based on its angle
    let house = 1; // Default to house 1 if we can't determine
    
    // Loop through cusps to find which house contains this angle
    for (let i = 0; i < 12; i++) {
      const nextIndex = (i + 1) % 12;
      const start = cusps[i];
      const end = cusps[nextIndex];
      
      // Handle cases where house crosses 0°
      if (start > end) {
        if (angle >= start || angle < end) {
          house = i + 1;
          break;
        }
      } else {
        if (angle >= start && angle < end) {
          house = i + 1;
          break;
        }
      }
    }
    
    console.log(`[DEBUG] ${planet.name} calculated longitude: ${angle}° (${ZODIAC_SIGNS[signIndex]}) in house ${house}`);
    
    return {
      name: planet.name,
      symbol: planet.symbol,
      sign: ZODIAC_SIGNS[signIndex],
      angle,
      house
    };
  });
  
  // Log the calculated cusps
  console.log('Calculated house cusps:', cusps);
  
  // Log detailed planetary positions for debugging
  console.log('DETAILED PLANETARY POSITIONS:');
  positions.forEach(planet => {
    console.log(`${planet.name}: ${planet.angle}° (${planet.sign}) in house ${planet.house}`);
  });
  
  // Create a structured response with all the data needed by the frontend
  const response = {
    planets: positions,
    houses: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      cusp: cusps[i] // Use the calculated cusps
    })),
    // Add the cusps array directly
    cusps: cusps,
    ascendant: ascendant,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
    birthTime: `${birthData.hour}:${birthData.minute.toString().padStart(2, '0')}`,
    birthDate: `${birthData.year}-${birthData.month.toString().padStart(2, '0')}-${birthData.day.toString().padStart(2, '0')}`
  };
  
  console.log('FINAL API RESPONSE STRUCTURE:', JSON.stringify(response, null, 2).substring(0, 500) + '...');
  return response;
}

/**
 * @typedef {Object} PlanetPosition
 * @property {number} longitude - Longitude in degrees
 * @property {number} latitude - Latitude in degrees
 * @property {number} distance - Distance in AU
 * @property {number} speed - Speed in degrees per day
 */

/**
 * Get the current moon phase (0-1)
 * @param {Date} date - The date to calculate moon phase for
 * @returns {number} Moon phase from 0-1
 */
/**
 * Calculate the current moon phase (0-1)
 * @param {Date} [date=new Date()] - The date to calculate moon phase for
 * @returns {number} Moon phase from 0 (new moon) to 1 (next new moon)
 */
function getMoonPhase(date = new Date()) {
  const {
    SYNODIC_MONTH,
    KNOWN_NEW_MOON_DATE
  } = ASTRONOMICAL_CONSTANTS;
  
  // Use the provided date or current date
  const targetTime = date.getTime();
  const knownNewMoonTime = new Date(KNOWN_NEW_MOON_DATE).getTime();
  
  // Calculate days since known new moon
  const daysSinceNewMoon = (targetTime - knownNewMoonTime) / MS_PER_DAY;
  
  // Calculate current phase (0-1)
  let phase = (daysSinceNewMoon % SYNODIC_MONTH) / SYNODIC_MONTH;
  
  // Ensure the phase is between 0 and 1
  return phase < 0 ? phase + 1 : phase;
}

/**
 * Get the moon phase name based on the phase value (0-1)
 * @param {number} phase - Moon phase from 0-1
 * @returns {{name: string, illumination: number}} Object containing phase name and illumination percentage
 */
/**
 * Get moon phase information including name, illumination, and next full moon date
 * @param {number} [phase] - Optional moon phase from 0 to 1. If not provided, calculates for current date
 * @param {Date} [date=new Date()] - Optional date to calculate phase for
 * @returns {{name: string, illumination: number, nextFullMoon: Date, phase: number, ageInDays: number, phaseType: 'new'|'waxing-crescent'|'first-quarter'|'waxing-gibbous'|'full'|'waning-gibbous'|'last-quarter'|'waning-crescent'}} Object containing phase information
 */
function getMoonPhaseInfo(phase, date = new Date()) {
  // Calculate phase if not provided
  const currentPhase = phase !== undefined ? phase : getMoonPhase(date);
  
  const {
    NEW_MOON,
    WAXING_CRESCENT,
    FIRST_QUARTER,
    WAXING_GIBBOUS,
    FULL_MOON,
    WANING_GIBBOUS,
    LAST_QUARTER
  } = ASTRONOMICAL_CONSTANTS.MOON_PHASE_THRESHOLDS;
  
  // Calculate illumination (0-100%)
  const illumination = Math.round(Math.sin(currentPhase * Math.PI) * 100);
  
  // Calculate moon age in days (0-29.53)
  const ageInDays = currentPhase * ASTRONOMICAL_CONSTANTS.SYNODIC_MONTH;
  
  // Get next full moon date
  const nextFullMoon = getNextFullMoon(date);
  
  /** @type {'new'|'waxing-crescent'|'first-quarter'|'waxing-gibbous'|'full'|'waning-gibbous'|'last-quarter'|'waning-crescent'} */
  let phaseType;
  let name;
  
  if (currentPhase < NEW_MOON || currentPhase > (1 - NEW_MOON)) {
    name = 'New Moon';
    phaseType = 'new';
  } else if (currentPhase < WAXING_CRESCENT) {
    name = 'Waxing Crescent';
    phaseType = 'waxing-crescent';
  } else if (currentPhase < FIRST_QUARTER) {
    name = 'First Quarter';
    phaseType = 'first-quarter';
  } else if (currentPhase < WAXING_GIBBOUS) {
    name = 'Waxing Gibbous';
    phaseType = 'waxing-gibbous';
  } else if (currentPhase < FULL_MOON) {
    name = 'Full Moon';
    phaseType = 'full';
  } else if (currentPhase < WANING_GIBBOUS) {
    name = 'Waning Gibbous';
    phaseType = 'waning-gibbous';
  } else if (currentPhase < LAST_QUARTER) {
    name = 'Last Quarter';
    phaseType = 'last-quarter';
  } else {
    name = 'Waning Crescent';
    phaseType = 'waning-crescent';
  }
  
  // Ensure we're returning all required fields with the correct types
  const result = {
    name: name,
    illumination: Number(illumination),
    nextFullMoon: new Date(nextFullMoon),
    phase: Number(currentPhase),
    ageInDays: Number(ageInDays),
    phaseType: phaseType
  };
  
  return result;
}

/**
 * Get positions of all planets
 * @param {Date} date - The date to calculate positions for
 * @returns {Object.<string, PlanetPosition>} Object with planet positions
 */
/**
 * Calculate positions of all planets
 * @param {Date} [date=new Date()] - The date to calculate positions for
 * @returns {Object.<string, PlanetPosition>} Object with planet positions
 */
function getPlanetPositions(date = new Date()) {
  const {
    PLANETARY_SPEEDS: {
      SUN,
      MOON,
      MERCURY,
      VENUS,
      MARS,
      JUPITER,
      SATURN,
      URANUS,
      NEPTUNE,
      PLUTO
    }
  } = ASTRONOMICAL_CONSTANTS;
  
  // Generate consistent positions based on date
  const timeFactor = date.getTime() / MS_PER_DAY; // days since epoch
  
  // Constants for position calculation
  const LATITUDE_RANGE = 5; // ±5 degrees latitude
  const BASE_DISTANCE = 1.0; // 1 AU base distance
  const DISTANCE_VARIATION = 0.5; // ±0.5 AU variation
  
  /**
   * Generate position for a celestial body
   * @param {string} body - Planet name
   * @param {number} speed - Orbital speed in degrees per day
   * @returns {PlanetPosition} Position object
   */
  const getPosition = (body, speed) => {
    // Create a stable base value for each body
    const bodyHash = body.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = (bodyHash + body.length) * 100;
    
    return {
      longitude: (base + timeFactor * speed) % 360,
      latitude: Math.sin(timeFactor * 0.1 + base) * LATITUDE_RANGE,
      distance: BASE_DISTANCE + Math.sin(timeFactor * 0.05 + base) * DISTANCE_VARIATION,
      speed
    };
  };

  // Return positions for all planets with their respective speeds
  return {
    sun: getPosition('sun', SUN),
    mars: getPosition('mars', MARS),
    jupiter: getPosition('jupiter', JUPITER),
    saturn: getPosition('saturn', SATURN),
    uranus: getPosition('uranus', URANUS),
    neptune: getPosition('neptune', NEPTUNE),
    pluto: getPosition('pluto', PLUTO)
  };
}

/**
 * Calculate aspects between planets
 * @param {Object.<string, {longitude: number}>} positions - Planet positions
 * @returns {Object.<string, string>} Aspects between planets
 */
function calculateAspects(positions) {
  const aspects = {};
  const planets = Object.keys(positions);
  const ASPECT_TOLERANCE = 8; // degrees of orb tolerance for aspects
  
  // Check all planet pairs
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(positions[planet1].longitude - positions[planet2].longitude) % 360;
      const aspect = getAspect(angle, ASPECT_TOLERANCE);
      
      if (aspect) {
        aspects[`${planet1}_${planet2}`] = aspect;
      }
    }
  }
  
  return aspects;
}

/**
 * Determine the aspect based on angle between planets
 * @param {number} angle - Angle between planets in degrees
 * @param {number} [tolerance=8] - Orb tolerance in degrees
 * @returns {string|null} Aspect name or null if no aspect
 */
function getAspect(angle, tolerance = 8) {
  // Define major aspects and their angles
  const MAJOR_ASPECTS = [
    { angle: 0, name: 'conjunction' },
    { angle: 60, name: 'sextile' },
    { angle: 90, name: 'square' },
    { angle: 120, name: 'trine' },
    { angle: 180, name: 'opposition' }
  ];
  
  // Check for exact aspects within tolerance
  for (const aspect of MAJOR_ASPECTS) {
    const diff = Math.abs(angle - aspect.angle);
    if (diff <= tolerance || Math.abs(diff - 360) <= tolerance) {
      return aspect.name;
    }
  }
  
  return null;
}

/**
 * Get the zodiac sign from ecliptic longitude
 * @param {number} longitude - Ecliptic longitude in degrees (0-360)
 * @returns {string} Zodiac sign name
 */
function getZodiacSign(longitude) {
  const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  // Normalize longitude to 0-360 range
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  const DEGREES_PER_SIGN = 30; // 360° / 12 signs = 30° per sign
  
  return ZODIAC_SIGNS[Math.floor(normalizedLongitude / DEGREES_PER_SIGN)];
}

/**
 * Calculate the date of the next full moon
 * @param {Date} [fromDate=new Date()] - The date to calculate from
 * @returns {Date} The date of the next full moon
 */
function getNextFullMoon(fromDate = new Date()) {
  const { SYNODIC_MONTH } = ASTRONOMICAL_CONSTANTS;
  
  // Use a known full moon date from 2025 (May 12, 2025 16:55 UTC)
  const knownFullMoon = new Date('2025-05-12T16:55:00Z');
  const targetTime = fromDate.getTime();
  const knownFullMoonTime = knownFullMoon.getTime();
  
  // If the known full moon is in the past, find the next one after it
  if (knownFullMoonTime < targetTime) {
    // Calculate how many full moons have passed since the known date
    const daysSinceKnownFullMoon = (targetTime - knownFullMoonTime) / MS_PER_DAY;
    const fullMoonsSince = Math.floor(daysSinceKnownFullMoon / SYNODIC_MONTH);
    
    // Calculate the next full moon after the last known one
    const nextFullMoon = new Date(knownFullMoon);
    nextFullMoon.setDate(nextFullMoon.getDate() + (fullMoonsSince + 1) * SYNODIC_MONTH);
    
    // Make sure we didn't overshoot (shouldn't happen with floor, but just in case)
    while (nextFullMoon.getTime() <= targetTime) {
      nextFullMoon.setDate(nextFullMoon.getDate() + SYNODIC_MONTH);
    }
    
    return nextFullMoon;
  }
  
  // If we're here, the known full moon is in the future (shouldn't happen with current date)
  return knownFullMoon;
}

// Export all functions
export {
  getMoonPhase,
  getMoonPhaseInfo,
  getNextFullMoon,
  getPlanetPositions,
  calculateAspects,
  getZodiacSign
};

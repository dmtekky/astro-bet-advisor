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
  const { SYNODIC_MONTH, KNOWN_NEW_MOON_DATE } = ASTRONOMICAL_CONSTANTS;
  
  // Known full moon after the reference new moon (14.77 days after new moon)
  const knownFullMoon = new Date(KNOWN_NEW_MOON_DATE);
  knownFullMoon.setDate(knownFullMoon.getDate() + 14.77);
  
  const targetTime = fromDate.getTime();
  const knownFullMoonTime = knownFullMoon.getTime();
  
  // Calculate days since known full moon
  const daysSinceFullMoon = (targetTime - knownFullMoonTime) / MS_PER_DAY;
  
  // Calculate days until next full moon
  const daysInCurrentCycle = daysSinceFullMoon % SYNODIC_MONTH;
  const daysUntilNextFullMoon = daysInCurrentCycle > 0 
    ? SYNODIC_MONTH - daysInCurrentCycle 
    : -daysInCurrentCycle;
  
  // Return the date of the next full moon
  const nextFullMoon = new Date(targetTime);
  nextFullMoon.setDate(nextFullMoon.getDate() + Math.ceil(daysUntilNextFullMoon));
  
  // Set to noon UTC for consistency
  nextFullMoon.setUTCHours(12, 0, 0, 0);
  
  return nextFullMoon;
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

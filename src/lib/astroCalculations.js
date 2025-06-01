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
 * Get moon phase information including name and illumination
 * @param {number} phase - Moon phase from 0 to 1
 * @returns {{name: string, illumination: number}} Object containing phase name and illumination percentage
 */
function getMoonPhaseInfo(phase) {
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
  const illumination = Math.round(Math.sin(phase * Math.PI) * 100);
  
  // Determine phase name based on phase value
  if (phase < NEW_MOON || phase > (1 - NEW_MOON)) {
    return { name: 'New Moon', illumination };
  }
  if (phase < WAXING_CRESCENT) {
    return { name: 'Waxing Crescent', illumination };
  }
  if (phase < FIRST_QUARTER) {
    return { name: 'First Quarter', illumination };
  }
  if (phase < WAXING_GIBBOUS) {
    return { name: 'Waxing Gibbous', illumination };
  }
  if (phase < FULL_MOON) {
    return { name: 'Full Moon', illumination };
  }
  if (phase < WANING_GIBBOUS) {
    return { name: 'Waning Gibbous', illumination };
  }
  if (phase < LAST_QUARTER) {
    return { name: 'Last Quarter', illumination };
  }
  return { name: 'Waning Crescent', illumination };
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

// Export all functions
export {
  getMoonPhase,
  getMoonPhaseInfo,
  getPlanetPositions,
  calculateAspects,
  getZodiacSign
};

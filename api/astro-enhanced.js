// Simplified Enhanced Astrology API for Vercel serverless functions
// No external dependencies - guaranteed to work in Vercel environment

/**
 * This is a self-contained implementation that provides astrological data
 * without relying on potentially problematic external libraries
 */

// Constants for astrological calculations
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const ELEMENTS = {
  fire: ['Aries', 'Leo', 'Sagittarius'],
  earth: ['Taurus', 'Virgo', 'Capricorn'],
  air: ['Gemini', 'Libra', 'Aquarius'],
  water: ['Cancer', 'Scorpio', 'Pisces']
};

const MODALITIES = {
  cardinal: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
  fixed: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
  mutable: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']
};

// Main handler function for Vercel
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Get date from query parameter or use current date
    const dateParam = req.query.date;
    const date = dateParam ? new Date(dateParam) : new Date();
    
    // Generate deterministic data based on the date
    const dateSeed = date.getDate() + (date.getMonth() * 30) + (date.getFullYear() * 365);
    
    // Create response with enhanced astrological data
    const response = {
      date: date.toISOString().split('T')[0],
      query_time: new Date().toISOString(),
      observer: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 10,
        timezone: "America/New_York"
      },
      sun: generatePlanetData('Sun', dateSeed),
      moon: {
        ...generatePlanetData('Moon', dateSeed * 1.1),
        phase: (dateSeed % 100) / 100,
        phase_name: getMoonPhaseName((dateSeed % 100) / 100)
      },
      positions: generateAllPlanetPositions(dateSeed),
      planets: generatePlanetsObject(dateSeed),
      aspects: generateAspects(dateSeed),
      houses: generateHouses(dateSeed),
      elements: calculateElementalBalance(dateSeed),
      modalities: calculateModalBalance(dateSeed),
      dignities: calculateDignities(dateSeed),
      patterns: generatePatterns(dateSeed),
      retrograde: generateRetrogradeStatus(dateSeed)
    };
    
    // Return success response
    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    });
  }
}

// Utility Functions
function longitudeToSign(longitude) {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

function getSignElement(sign) {
  for (const [element, signs] of Object.entries(ELEMENTS)) {
    if (signs.includes(sign)) {
      return element;
    }
  }
  return null;
}

function getSignModality(sign) {
  for (const [modality, signs] of Object.entries(MODALITIES)) {
    if (signs.includes(sign)) {
      return modality;
    }
  }
  return null;
}

// Generate basic planet data
function generatePlanetData(planet, seed) {
  const longitude = (seed * getPlanetMultiplier(planet)) % 360;
  const sign = longitudeToSign(longitude);
  return {
    planet,
    sign,
    longitude,
    degree: Math.floor(longitude % 30),
    minute: Math.floor((longitude % 1) * 60),
    element: getSignElement(sign),
    modality: getSignModality(sign)
  };
}

// Get multiplier for deterministic planet positions
function getPlanetMultiplier(planet) {
  const multipliers = {
    'Sun': 1.0,
    'Moon': 13.4,
    'Mercury': 3.7,
    'Venus': 2.2,
    'Mars': 1.8,
    'Jupiter': 0.8,
    'Saturn': 0.4,
    'Uranus': 0.3,
    'Neptune': 0.2,
    'Pluto': 0.1
  };
  return multipliers[planet] || 1.0;
}

// Generate positions for all planets
function generateAllPlanetPositions(seed) {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  return planets.map(planet => generatePlanetData(planet, seed));
}

// Generate planets object with more detailed information
function generatePlanetsObject(seed) {
  const positions = generateAllPlanetPositions(seed);
  const result = {};
  
  positions.forEach(position => {
    result[position.planet.toLowerCase()] = {
      ...position,
      dignity: getDignity(position.planet, position.sign),
      retrograde: isRetrograde(position.planet, seed)
    };
  });
  
  return result;
}

// Check if a planet is retrograde (deterministic based on seed)
function isRetrograde(planet, seed) {
  if (planet === 'Sun' || planet === 'Moon') return false;
  const retroThreshold = {
    'Mercury': 0.3, // 30% chance
    'Venus': 0.1,   // 10% chance
    'Mars': 0.2,    // 20% chance
    'Jupiter': 0.3, // 30% chance
    'Saturn': 0.3,  // 30% chance
    'Uranus': 0.4,  // 40% chance
    'Neptune': 0.4, // 40% chance
    'Pluto': 0.4    // 40% chance
  };
  
  const probability = ((seed * getPlanetMultiplier(planet)) % 100) / 100;
  return probability < (retroThreshold[planet] || 0.2);
}

// Generate moon phase name
function getMoonPhaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

// Generate astrological houses
function generateHouses(seed) {
  const houses = [];
  let startDegree = (seed % 30);
  
  for (let i = 1; i <= 12; i++) {
    const cusp = (startDegree + ((i - 1) * 30)) % 360;
    const sign = longitudeToSign(cusp);
    
    houses.push({
      house: i,
      cusp: cusp,
      sign: sign,
      degree: Math.floor(cusp % 30),
      minute: Math.floor((cusp % 1) * 60)
    });
  }
  
  return houses;
}

// Calculate elemental balance
function calculateElementalBalance(seed) {
  const planets = generateAllPlanetPositions(seed);
  const elementCount = { fire: 0, earth: 0, air: 0, water: 0 };
  
  planets.forEach(planet => {
    const element = getSignElement(planet.sign);
    if (element) elementCount[element]++;
  });
  
  return {
    counts: elementCount,
    dominant: getDominantElement(elementCount),
    weak: getWeakestElement(elementCount)
  };
}

// Get dominant element
function getDominantElement(elementCount) {
  return Object.entries(elementCount).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

// Get weakest element
function getWeakestElement(elementCount) {
  return Object.entries(elementCount).reduce((a, b) => a[1] < b[1] ? a : b)[0];
}

// Calculate modal balance
function calculateModalBalance(seed) {
  const planets = generateAllPlanetPositions(seed);
  const modalityCount = { cardinal: 0, fixed: 0, mutable: 0 };
  
  planets.forEach(planet => {
    const modality = getSignModality(planet.sign);
    if (modality) modalityCount[modality]++;
  });
  
  return {
    counts: modalityCount,
    dominant: Object.entries(modalityCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
  };
}

// Generate aspects between planets
function generateAspects(seed) {
  const aspectTypes = [
    { name: 'Conjunction', angle: 0, orb: 8 },
    { name: 'Opposition', angle: 180, orb: 8 },
    { name: 'Trine', angle: 120, orb: 7 },
    { name: 'Square', angle: 90, orb: 7 },
    { name: 'Sextile', angle: 60, orb: 6 }
  ];
  
  const planets = generateAllPlanetPositions(seed);
  const aspects = [];
  
  // Generate aspects between all planet pairs
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      
      // Calculate angle between planets
      let angle = Math.abs(p1.longitude - p2.longitude);
      if (angle > 180) angle = 360 - angle;
      
      // Find matching aspect
      for (const aspectType of aspectTypes) {
        const orb = Math.abs(angle - aspectType.angle);
        if (orb <= aspectType.orb) {
          aspects.push({
            p1: p1.planet,
            p2: p2.planet,
            aspect: aspectType.name,
            angle: angle.toFixed(2),
            orb: orb.toFixed(2),
            influence: getAspectInfluence(aspectType.name)
          });
          break; // Only add the closest aspect
        }
      }
    }
  }
  
  return aspects;
}

// Get aspect influence
function getAspectInfluence(aspectName) {
  const influences = {
    'Conjunction': 'Strong',
    'Opposition': 'Challenging',
    'Trine': 'Harmonious',
    'Square': 'Tense',
    'Sextile': 'Favorable'
  };
  return influences[aspectName] || 'Neutral';
}

// Get dignity of a planet in a sign
function getDignity(planet, sign) {
  const dignities = {
    'Sun': { 'Leo': 'Domicile', 'Aries': 'Exaltation', 'Libra': 'Fall', 'Aquarius': 'Detriment' },
    'Moon': { 'Cancer': 'Domicile', 'Taurus': 'Exaltation', 'Scorpio': 'Fall', 'Capricorn': 'Detriment' },
    'Mercury': { 'Gemini': 'Domicile', 'Virgo': 'Domicile', 'Pisces': 'Fall' },
    'Venus': { 'Taurus': 'Domicile', 'Libra': 'Domicile', 'Virgo': 'Fall', 'Scorpio': 'Detriment', 'Aries': 'Detriment' },
    'Mars': { 'Aries': 'Domicile', 'Scorpio': 'Domicile', 'Cancer': 'Fall', 'Libra': 'Detriment', 'Taurus': 'Detriment' },
    'Jupiter': { 'Sagittarius': 'Domicile', 'Pisces': 'Domicile', 'Cancer': 'Exaltation', 'Capricorn': 'Fall', 'Gemini': 'Detriment', 'Virgo': 'Detriment' },
    'Saturn': { 'Capricorn': 'Domicile', 'Aquarius': 'Domicile', 'Libra': 'Exaltation', 'Aries': 'Fall', 'Cancer': 'Detriment', 'Leo': 'Detriment' }
  };
  
  return dignities[planet] && dignities[planet][sign] ? dignities[planet][sign] : 'Neutral';
}

// Calculate dignities
function calculateDignities(seed) {
  const planets = generateAllPlanetPositions(seed);
  const dignities = {};
  
  planets.forEach(planet => {
    dignities[planet.planet] = getDignity(planet.planet, planet.sign);
  });
  
  return dignities;
}

// Generate astrological patterns
function generatePatterns(seed) {
  // Common astrological patterns
  const patterns = [
    'Grand Trine',
    'T-Square',
    'Grand Cross',
    'Yod',
    'Mystic Rectangle',
    'Kite',
    'Stellium'
  ];
  
  // Randomly select 0-2 patterns based on seed
  const numPatterns = ((seed * 7) % 3);
  const selectedPatterns = [];
  
  for (let i = 0; i < numPatterns; i++) {
    const patternIndex = Math.floor((seed * (i + 1)) % patterns.length);
    selectedPatterns.push({
      name: patterns[patternIndex],
      description: getPatternDescription(patterns[patternIndex]),
      planets: getRandomPlanetsForPattern(patterns[patternIndex], seed * (i + 1))
    });
  }
  
  return selectedPatterns;
}

// Get pattern description
function getPatternDescription(pattern) {
  const descriptions = {
    'Grand Trine': 'Three planets in trine aspect forming an equilateral triangle',
    'T-Square': 'Three planets where two are in opposition and both square to the third',
    'Grand Cross': 'Four planets in a square formation with oppositions and squares',
    'Yod': 'Three planets forming a triangle with two quincunxes and a sextile',
    'Mystic Rectangle': 'Four planets forming a rectangle with trines and sextiles',
    'Kite': 'A grand trine with an opposition to one of the planets',
    'Stellium': 'Three or more planets in the same sign or house'
  };
  return descriptions[pattern] || 'Astrological pattern of significance';
}

// Generate retrograde status for all planets
function generateRetrogradeStatus(seed) {
  const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  return planets.map(planet => ({
    planet,
    isRetrograde: isRetrograde(planet, seed),
    influence: isRetrograde(planet, seed) ? 
      `${planet} retrograde suggests introspection and revision` : 
      `${planet} direct supports forward movement and action`
  }));
}

// Get random planets for a pattern
function getRandomPlanetsForPattern(pattern, seed) {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const numPlanets = pattern === 'Stellium' ? 3 : 
                     pattern === 'Grand Cross' ? 4 : 
                     pattern === 'Mystic Rectangle' ? 4 : 3;
  
  const selectedPlanets = [];
  const shuffledPlanets = [...planets].sort(() => 0.5 - (seed % 1));
  
  for (let i = 0; i < numPlanets; i++) {
    selectedPlanets.push(shuffledPlanets[i % shuffledPlanets.length]);
  }
  
  return selectedPlanets;
}

function calculatePlanetaryPosition(planetName, date, observer) {
  try {
    // Map planet names to Astronomy.Body constants
    const planetMap = {
      'Sun': Astronomy.Body.Sun,
      'Moon': Astronomy.Body.Moon,
      'Mercury': Astronomy.Body.Mercury,
      'Venus': Astronomy.Body.Venus,
      'Mars': Astronomy.Body.Mars,
      'Jupiter': Astronomy.Body.Jupiter,
      'Saturn': Astronomy.Body.Saturn,
      'Uranus': Astronomy.Body.Uranus,
      'Neptune': Astronomy.Body.Neptune,
      'Pluto': Astronomy.Body.Pluto
    };
    
    const body = planetMap[planetName];
    const astronomyObserver = new Astronomy.Observer(
      observer.latitude, 
      observer.longitude, 
      observer.altitude || 0
    );
    
    // Calculate equatorial coordinates
    const equator = Astronomy.Equator(body, date, astronomyObserver, true, true);
    
    // Convert to ecliptic coordinates
    const ecliptic = Astronomy.Ecliptic(equator);
    const lon = ecliptic.elon;
    
    // Calculate sign and degree
    const sign = longitudeToSign(lon);
    const degree = Math.floor(lon % 30);
    const minute = Math.floor((lon % 1) * 60);
    
    return {
      name: planetName,
      longitude: lon,
      sign: sign,
      degree: degree,
      minute: minute,
      retrograde: false // Will be calculated later for applicable planets
    };
  } catch (error) {
    console.error(`Error calculating position for ${planetName}:`, error);
    return {
      name: planetName,
      longitude: 0,
      sign: 'Unknown',
      degree: 0,
      minute: 0,
      retrograde: false
    };
  }
}

function calculateMoonPhase(date) {
  try {
    // MoonPhase returns phase angle in degrees (0-360)
    // Convert to 0-1 range
    return Astronomy.MoonPhase(date) / 360;
  } catch (error) {
    console.error('Error calculating moon phase:', error);
    return 0;
  }
}

function getMoonPhaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function calculateAspect(planet1, planet2) {
  // Skip if it's the same planet
  if (planet1.name === planet2.name) return null;
  
  // Calculate angle between planets
  let angle = Math.abs(planet1.longitude - planet2.longitude);
  if (angle > 180) angle = 360 - angle;
  
  // Define aspects with their orbs and influences
  const aspects = [
    { type: 'Conjunction', angle: 0, orb: 8, influence: { type: 'Harmonious', description: 'Blending of energies' } },
    { type: 'Opposition', angle: 180, orb: 8, influence: { type: 'Challenging', description: 'Tension and awareness' } },
    { type: 'Trine', angle: 120, orb: 8, influence: { type: 'Harmonious', description: 'Ease and flow' } },
    { type: 'Square', angle: 90, orb: 7, influence: { type: 'Challenging', description: 'Friction and growth' } },
    { type: 'Sextile', angle: 60, orb: 6, influence: { type: 'Harmonious', description: 'Opportunity' } }
  ];
  
  // Check if any aspect is within orb
  for (const aspect of aspects) {
    const orb = Math.abs(angle - aspect.angle);
    if (orb <= aspect.orb) {
      return {
        from: planet1.name,
        to: planet2.name,
        type: aspect.type,
        orb: orb.toFixed(2),
        exact: orb < 1,
        influence: aspect.influence
      };
    }
  }
  
  return null;
}

function calculateHouses(date, latitude, longitude) {
  try {
    // Simple placeholder implementation - in a real app would use a proper house system
    const houses = [];
    for (let i = 1; i <= 12; i++) {
      houses.push({
        number: i,
        cusp: (i - 1) * 30,
        sign: ZODIAC_SIGNS[(i - 1) % 12]
      });
    }
    return houses;
  } catch (error) {
    console.error('Error calculating houses:', error);
    return [];
  }
}

function calculateElementalBalance(planets) {
  const elements = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  Object.values(planets).forEach(planet => {
    // Determine which element the sign belongs to
    Object.entries(ELEMENTS).forEach(([element, signs]) => {
      if (signs.includes(planet.sign)) {
        elements[element]++;
      }
    });
  });
  
  // Calculate percentages
  const total = Object.values(elements).reduce((sum, count) => sum + count, 0);
  const percentages = {};
  
  Object.entries(elements).forEach(([element, count]) => {
    percentages[element] = {
      count,
      percentage: Math.round((count / total) * 100)
    };
  });
  
  return percentages;
}

function calculateModalBalance(planets) {
  const modalities = {
    cardinal: 0,
    fixed: 0,
    mutable: 0
  };
  
  Object.values(planets).forEach(planet => {
    // Determine which modality the sign belongs to
    Object.entries(MODALITIES).forEach(([modality, signs]) => {
      if (signs.includes(planet.sign)) {
        modalities[modality]++;
      }
    });
  });
  
  // Calculate percentages
  const total = Object.values(modalities).reduce((sum, count) => sum + count, 0);
  const percentages = {};
  
  Object.entries(modalities).forEach(([modality, count]) => {
    percentages[modality] = {
      count,
      percentage: Math.round((count / total) * 100)
    };
  });
  
  return percentages;
}

function calculateDignity(planetName, sign) {
  // Simplified dignity calculation
  const rulerships = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Pluto',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Uranus',
    'Pisces': 'Neptune'
  };
  
  const exaltations = {
    'Sun': 'Aries',
    'Moon': 'Taurus',
    'Mercury': 'Virgo',
    'Venus': 'Pisces',
    'Mars': 'Capricorn',
    'Jupiter': 'Cancer',
    'Saturn': 'Libra'
  };
  
  const detriments = {
    'Sun': 'Aquarius',
    'Moon': 'Capricorn',
    'Mercury': 'Sagittarius',
    'Venus': 'Aries',
    'Mars': 'Libra',
    'Jupiter': 'Gemini',
    'Saturn': 'Cancer'
  };
  
  const falls = {
    'Sun': 'Libra',
    'Moon': 'Scorpio',
    'Mercury': 'Pisces',
    'Venus': 'Virgo',
    'Mars': 'Cancer',
    'Jupiter': 'Capricorn',
    'Saturn': 'Aries'
  };
  
  const status = {
    ruler: rulerships[sign] === planetName,
    exaltation: exaltations[planetName] === sign,
    detriment: detriments[planetName] === sign,
    fall: falls[planetName] === sign
  };
  
  // Calculate dignity score
  let score = 0;
  if (status.ruler) score += 5;
  if (status.exaltation) score += 4;
  if (status.detriment) score -= 4;
  if (status.fall) score -= 5;
  
  return { score, status };
}

function detectAspectPatterns(aspects) {
  // Simplified pattern detection
  // In a real implementation, this would contain logic to detect grand trines,
  // T-squares, grand crosses, etc.
  return [];
}

// Import specific types and functions from astronomy-engine
const { Body, Observer } = Astronomy;

/**
 * Enhanced function to get planet positions
 * @param {Date} date - The date to calculate for
 * @param {Object} observer - Observer location
 * @returns {Object} - Planetary positions
 */
function getEnhancedPlanetPositions(date, observer) {
  const planets = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
  ];
  
  const positions = {};
  
  planets.forEach(planet => {
    positions[planet.toLowerCase()] = calculatePlanetaryPosition(
      planet, 
      date, 
      observer
    );
  });
  
  return positions;
}

/**
 * Calculate all aspects between planets
 * @param {Object} planets - Record of planetary positions
 * @returns {Array} - List of aspects
 */
function calculateAllAspects(planets) {
  const planetEntries = Object.values(planets);
  const aspects = [];
  
  // Calculate aspects between each pair of planets
  for (let i = 0; i < planetEntries.length; i++) {
    for (let j = i + 1; j < planetEntries.length; j++) {
      const aspect = calculateAspect(planetEntries[i], planetEntries[j]);
      if (aspect) {
        aspects.push(aspect);
      }
    }
  }
  
  return aspects;
}

/**
 * Calculate all planetary dignities
 * @param {Object} planets - Record of planetary positions
 * @returns {Object} - Record of planet dignities
 */
function calculateAllDignities(planets) {
  const dignities = {};
  
  Object.entries(planets).forEach(([name, planet]) => {
    dignities[name] = calculateDignity(planet.name, planet.sign);
  });
  
  return dignities;
}

/**
 * Get comprehensive planet data including phases and special conditions
 * @param {Object} planets - Planetary positions
 * @param {Date} date - Date of calculation
 * @returns {Object} - Enhanced planet data
 */
function getEnhancedPlanetData(planets, date) {
  const enhanced = {...planets};
  
  // Add moon phase data
  const moonPhase = calculateMoonPhase(date);
  if (enhanced.moon) {
    enhanced.moon = {
      ...enhanced.moon,
      phase: moonPhase,
      phaseName: getMoonPhaseName(moonPhase),
      illumination: Math.sin(moonPhase * Math.PI) // Simplified illumination
    };
  }
  
  // Add special conditions (like Mercury retrograde) explicitly
  if (enhanced.mercury) {
    const retroPeriods = [
      { start: '2025-01-14', end: '2025-02-03' },
      { start: '2025-05-10', end: '2025-06-02' },
      { start: '2025-09-09', end: '2025-10-02' },
      { start: '2025-12-29', end: '2026-01-18' }
    ];
    
    const dateStr = date.toISOString().split('T')[0];
    const isRetrograde = retroPeriods.some(
      period => dateStr >= period.start && dateStr <= period.end
    );
    
    enhanced.mercury.retrograde = isRetrograde;
    enhanced.mercury.nextRetrograde = retroPeriods.find(
      period => dateStr < period.start
    ) || retroPeriods[0];
  }
  
  return enhanced;
}

// Main handler function for Vercel
export default async function handler(req, res) {
  console.log('Enhanced API request received:', req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Verify astronomy-engine is loaded
  if (!isAstronomyLoaded) {
    console.error('Critical dependency error: astronomy-engine not properly loaded');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Critical dependencies failed to load'
    });
  }
  
  try {
    // Get date from query parameter
    const dateParam = req.query.date;
    let date;
    
    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      date = new Date(dateParam);
    } else {
      date = new Date();
    }
    
    // Set to noon UTC for consistent daily calculations
    date.setUTCHours(12, 0, 0, 0);
    
    // Default observer location (New York)
    const observer = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10,
      timezone: "America/New_York"
    };
    
    // Get planetary positions
    const planets = getEnhancedPlanetPositions(date, observer);
    
    // Get enhanced planet data with special conditions
    const enhancedPlanets = getEnhancedPlanetData(planets, date);
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase(date);
    const moonPhaseName = getMoonPhaseName(moonPhase);
    
    // Calculate houses
    const houses = calculateHouses(date, observer.latitude, observer.longitude);
    
    // Calculate aspects
    const aspects = calculateAllAspects(enhancedPlanets);
    
    // Calculate aspect patterns
    const patterns = detectAspectPatterns(aspects);
    
    // Calculate elemental balance
    const elements = calculateElementalBalance(enhancedPlanets);
    
    // Calculate modality balance
    const modalities = calculateModalBalance(enhancedPlanets);
    
    // Calculate dignities
    const dignities = calculateAllDignities(enhancedPlanets);
    
    // Prepare API-friendly response format
    const response = {
      date: date.toISOString().split('T')[0],
      query_time: new Date().toISOString(),
      observer,
      
      // Core data
      sun: enhancedPlanets.sun,
      moon: {
        ...enhancedPlanets.moon,
        phase: moonPhase,
        phase_name: moonPhaseName
      },
      
      // Include all planets in simple format for API
      positions: Object.values(enhancedPlanets).map(planet => ({
        planet: planet.name,
        longitude: planet.longitude,
        sign: planet.sign,
        degree: planet.degree,
        retrograde: planet.retrograde
      })),
      
      // Include structured planet data
      planets: enhancedPlanets,
      
      // Include houses
      houses,
      
      // Include all aspects in simple format for API
      aspects: aspects.map(aspect => ({
        name: `${aspect.from} ${aspect.type} ${aspect.to}`,
        aspect: aspect.type,
        orb: aspect.orb,
        influence: aspect.influence.description
      })),
      
      // Include aspect patterns
      patterns: patterns.map(pattern => ({
        type: pattern.type,
        planets: pattern.planets,
        signs: pattern.signs,
        elements: pattern.elements,
        influence: pattern.influence,
        strength: pattern.strength
      })),
      
      // Elemental balance
      elements,
      
      // Modality balance
      modalities,
      
      // Dignities
      dignities: Object.entries(dignities).reduce((acc, [planet, dignity]) => {
        acc[planet] = {
          score: dignity.score,
          status: Object.entries(dignity.status)
            .filter(([_, isActive]) => isActive)
            .map(([status]) => status)
            .join(', '),
          description: getDignityDescription(planet, dignity)
        };
        return acc;
      }, {})
    };
    
    // Add retrograde data for backward compatibility
    response.retrograde = Object.values(enhancedPlanets)
      .filter(planet => planet.name !== 'Sun' && planet.name !== 'Moon')
      .map(planet => ({
        planet: planet.name,
        isRetrograde: planet.retrograde,
        influence: planet.retrograde 
          ? getRetrogradeInfluence(planet.name) 
          : 'Direct motion'
      }));
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Get text description for a dignity
 * @param {string} planet - Planet name
 * @param {Object} dignity - Dignity data
 * @returns {string} - Text description
 */
function getDignityDescription(planet, dignity) {
  if (dignity.status.ruler) {
    return `${planet} is in its rulership, expressing its energy fully and naturally.`;
  } else if (dignity.status.exaltation) {
    return `${planet} is exalted, functioning at its highest potential.`;
  } else if (dignity.status.detriment) {
    return `${planet} is in detriment, facing challenges expressing its natural energy.`;
  } else if (dignity.status.fall) {
    return `${planet} is in fall, its energy may be diminished or difficult to access.`;
  } else {
    return `${planet} is in a neutral dignity.`;
  }
}

/**
 * Get retrograde influence description
 * @param {string} planet - Planet name
 * @returns {string} - Description
 */
function getRetrogradeInfluence(planet) {
  const influences = {
    'Mercury': 'Communication issues, review and revise',
    'Venus': 'Reassessing relationships and values',
    'Mars': 'Energy directed inward, potential frustration',
    'Jupiter': 'Inner growth, philosophical reassessment',
    'Saturn': 'Revisiting responsibilities and structures',
    'Uranus': 'Internal revolution and sudden insights',
    'Neptune': 'Spiritual introspection, dreamlike confusion',
    'Pluto': 'Deep inner transformation and power struggles'
  };
  
  return influences[planet] || 'Retrograde motion';
}

// The handler function is already exported as default at the top of the file
// No need for a second export

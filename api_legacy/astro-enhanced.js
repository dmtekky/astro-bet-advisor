// Simplified Enhanced API implementation - no external dependencies

/**
 * Simple, reliable enhanced astrology API for Vercel serverless environment
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

// Helper function to get zodiac sign from longitude
function longitudeToSign(longitude) {
  const signIndex = Math.floor((longitude % 360) / 30);
  return ZODIAC_SIGNS[signIndex];
}

// Helper function to get element of a sign
function getSignElement(sign) {
  for (const [element, signs] of Object.entries(ELEMENTS)) {
    if (signs.includes(sign)) {
      return element;
    }
  }
  return null;
}

// Helper function to get modality of a sign
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
    dominant: Object.entries(elementCount)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0],
    weak: Object.entries(elementCount)
      .reduce((a, b) => a[1] < b[1] ? a : b)[0]
  };
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
    dominant: Object.entries(modalityCount)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0]
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
  
  // Generate a limited number of aspects for simplicity
  for (let i = 0; i < 10; i++) {
    const p1Index = Math.floor((seed * (i + 1) * 1.3) % planets.length);
    const p2Index = Math.floor((seed * (i + 1) * 2.7) % planets.length);
    
    if (p1Index !== p2Index) {
      const p1 = planets[p1Index];
      const p2 = planets[p2Index];
      
      const aspectIndex = i % aspectTypes.length;
      const aspect = aspectTypes[aspectIndex];
      
      aspects.push({
        p1: p1.planet,
        p2: p2.planet,
        aspect: aspect.name,
        angle: ((seed * (i + 1)) % 10).toFixed(2),
        orb: (aspect.orb * (seed % 10) / 10).toFixed(2),
        influence: getAspectInfluence(aspect.name)
      });
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

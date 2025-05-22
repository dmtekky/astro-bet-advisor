// Enhanced Vercel serverless function for astro API
import * as Astronomy from 'astronomy-engine';
import { 
  calculatePlanetaryPosition,
  calculateAspect,
  calculateHouses, 
  calculateMoonPhase,
  getMoonPhaseName,
  calculateElementalBalance,
  calculateModalBalance,
  detectAspectPatterns,
  calculateDignity,
  longitudeToSign
} from '../src/lib/astroUtils';

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
    // Get date from query parameter
    const dateParam = req.query.date;
    let date;
    
    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateParam)) {
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

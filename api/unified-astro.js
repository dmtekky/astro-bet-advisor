// Unified Astrology API Endpoint - Simplified ESM Version
// Uses astronomy-engine correctly in ES module format
// Optimized for Vercel deployment

import * as Astronomy from 'astronomy-engine/esm/astronomy.js';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration for caching
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client if credentials are available
let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Element mappings
const ELEMENTS = {
  fire: ['Aries', 'Leo', 'Sagittarius'],
  earth: ['Taurus', 'Virgo', 'Capricorn'],
  air: ['Gemini', 'Libra', 'Aquarius'],
  water: ['Cancer', 'Scorpio', 'Pisces']
};

// Modality mappings
const MODALITIES = {
  cardinal: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
  fixed: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
  mutable: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']
};

// Planet information for astronomy-engine
const PLANETS = [
  { name: 'sun', body: Astronomy.Body.Sun, weight: 3 },
  { name: 'moon', body: Astronomy.Body.Moon, weight: 3 },
  { name: 'mercury', body: Astronomy.Body.Mercury, weight: 2 },
  { name: 'venus', body: Astronomy.Body.Venus, weight: 2 },
  { name: 'mars', body: Astronomy.Body.Mars, weight: 2 },
  { name: 'jupiter', body: Astronomy.Body.Jupiter, weight: 2 },
  { name: 'saturn', body: Astronomy.Body.Saturn, weight: 2 },
  { name: 'uranus', body: Astronomy.Body.Uranus, weight: 1 },
  { name: 'neptune', body: Astronomy.Body.Neptune, weight: 1 },
  { name: 'pluto', body: Astronomy.Body.Pluto, weight: 1 }
];

// Lahiri Ayanamsa value for sidereal calculations
const AYANAMSA_VALUE = 24.1;

// Cache for ephemeris data to minimize recalculation
const ephemerisCache = {};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Calculate complete astrological data for a given date
 */
const calculateAstroData = async (date, useSidereal = false) => {
  try {
    // Create astronomy-engine time object
    const time = Astronomy.MakeTime(date);
    
    // Calculate planetary positions
    const planetPositions = await calculatePlanetaryPositions(time, useSidereal);
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase(time);
    
    // Calculate aspects between planets
    const aspects = calculateAspects(planetPositions);
    
    // Calculate element distribution
    const elements = calculateElements(planetPositions);
    
    // Calculate modality distribution
    const modalities = calculateModalities(planetPositions);
    
    // Generate interpretations and astrological weather
    const weather = generateAstroWeather(planetPositions, aspects, moonPhase);
    const interpretations = generateInterpretations(planetPositions, aspects);
    
    // Return complete astrological data
    return {
      date: date.toISOString(),
      sidereal: useSidereal,
      ayanamsa: useSidereal ? AYANAMSA_VALUE : 0,
      planets: planetPositions,
      moonPhase,
      aspects,
      elements,
      modalities,
      weather,
      interpretations
    };
  } catch (error) {
    console.error("[ERROR] Calculate astro data error:", error);
    throw error;
  }
};

/**
 * Calculate planetary positions using astronomy-engine
 */
const calculatePlanetaryPositions = async (time, useSidereal = false) => {
  const positions = {};
  
  for (const planet of PLANETS) {
    try {
      // Get ecliptic coordinates
      const ecliptic = Astronomy.Ecliptic(planet.body, time);
      
      // Apply ayanamsa correction for sidereal positions
      let longitude = ecliptic.elon;
      if (useSidereal) {
        longitude -= AYANAMSA_VALUE;
        // Ensure longitude is positive and less than 360
        longitude = (longitude + 360) % 360;
      }
      
      // Determine zodiac sign and degree
      const signIndex = Math.floor(longitude / 30);
      const degree = longitude % 30;
      const sign = ZODIAC_SIGNS[signIndex];
      
      // Get retrograde status (approximation)
      let retrograde = false;
      if (planet.name !== 'sun' && planet.name !== 'moon') {
        // Check position in 24 hours to determine direction
        const tomorrow = new Astronomy.Time(
          time.ut + 1,
          time.ut_seconds
        );
        const tomorrowEcliptic = Astronomy.Ecliptic(planet.body, tomorrow);
        
        // If tomorrow's longitude is less than today's (accounting for 0/360 boundary)
        let tomorrowLongitude = tomorrowEcliptic.elon;
        if (useSidereal) {
          tomorrowLongitude -= AYANAMSA_VALUE;
          tomorrowLongitude = (tomorrowLongitude + 360) % 360;
        }
        
        // Check if the planet appears to be moving backward
        const crossing360 = (longitude > 350 && tomorrowLongitude < 10);
        const crossingBack = (longitude < 10 && tomorrowLongitude > 350);
        
        if ((!crossing360 && tomorrowLongitude < longitude) || 
            (crossingBack && tomorrowLongitude > longitude)) {
          retrograde = true;
        }
      }
      
      // Save position data
      positions[planet.name] = {
        longitude,
        sign,
        degree: parseFloat(degree.toFixed(2)),
        retrograde
      };
    } catch (err) {
      console.error(`[ERROR] Failed to calculate position for ${planet.name}:`, err);
      // Provide default values in case of error
      positions[planet.name] = {
        longitude: 0,
        sign: 'Aries',
        degree: 0,
        retrograde: false
      };
    }
  }
  
  return positions;
};

/**
 * Calculate moon phase using astronomy-engine
 */
const calculateMoonPhase = (time) => {
  try {
    // Get illumination fraction (0-1)
    const illumination = Astronomy.MoonFraction(time);
    
    // Calculate phase angle in degrees (0-360)
    const elongation = Astronomy.MoonPhase(time);
    
    // Get phase name
    const phaseName = getMoonPhaseName(illumination, elongation);
    
    // Determine if waxing or waning
    const isWaxing = elongation < 180;
    
    return {
      illumination: parseFloat(illumination.toFixed(2)),
      angle: parseFloat(elongation.toFixed(2)),
      phase: phaseName,
      isWaxing
    };
  } catch (error) {
    console.error("[ERROR] Calculate moon phase error:", error);
    // Return default values in case of error
    return {
      illumination: 0,
      angle: 0,
      phase: "Unknown",
      isWaxing: true
    };
  }
};

/**
 * Get moon phase name from illumination value and angle
 */
const getMoonPhaseName = (illumination, angle) => {
  if (angle < 10 || angle > 350) return "New Moon";
  if (angle > 80 && angle < 100) return "First Quarter";
  if (angle > 170 && angle < 190) return "Full Moon";
  if (angle > 260 && angle < 280) return "Last Quarter";
  
  if (angle < 90) return "Waxing Crescent";
  if (angle < 180) return "Waxing Gibbous";
  if (angle < 270) return "Waning Gibbous";
  return "Waning Crescent";
};

/**
 * Calculate aspects between planets
 */
const calculateAspects = (planetPositions) => {
  const aspects = [];
  const planetNames = Object.keys(planetPositions);
  
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i];
      const planet2 = planetNames[j];
      
      // Calculate the angular difference between planets
      let angle = Math.abs(planetPositions[planet1].longitude - planetPositions[planet2].longitude);
      
      // Adjust for the shortest arc (less than 180 degrees)
      if (angle > 180) angle = 360 - angle;
      
      // Get aspect type if within orb
      const aspectType = getAspectType(angle);
      
      if (aspectType) {
        aspects.push({
          planet1,
          planet2,
          angle: parseFloat(angle.toFixed(2)),
          aspect: aspectType.name,
          orb: parseFloat(Math.abs(angle - aspectType.angle).toFixed(2)),
          influence: aspectType.influence
        });
      }
    }
  }
  
  return aspects;
};

/**
 * Get aspect type based on angle
 */
const getAspectType = (angle) => {
  // Define aspect types with their orbs and influences
  const aspectTypes = [
    { name: 'conjunction', angle: 0, orb: 8, influence: 'strong' },
    { name: 'opposition', angle: 180, orb: 8, influence: 'strong' },
    { name: 'trine', angle: 120, orb: 8, influence: 'harmonious' },
    { name: 'square', angle: 90, orb: 8, influence: 'challenging' },
    { name: 'sextile', angle: 60, orb: 6, influence: 'favorable' },
    { name: 'semisextile', angle: 30, orb: 3, influence: 'mild' },
    { name: 'quincunx', angle: 150, orb: 3, influence: 'tense' },
    { name: 'semisquare', angle: 45, orb: 3, influence: 'irritating' },
    { name: 'sesquiquadrate', angle: 135, orb: 3, influence: 'irritating' }
  ];
  
  // Find the first aspect type where the angle is within orb
  for (const type of aspectTypes) {
    if (Math.abs(angle - type.angle) <= type.orb) {
      return type;
    }
  }
  
  return null;
};

/**
 * Calculate element distribution from planet positions
 */
const calculateElements = (planetPositions) => {
  const elements = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  // Count planets in each element
  Object.entries(planetPositions).forEach(([planetName, data]) => {
    const sign = data.sign;
    const planetWeight = PLANETS.find(p => p.name === planetName)?.weight || 1;
    
    // Add planet's weight to the corresponding element
    if (ELEMENTS.fire.includes(sign)) {
      elements.fire += planetWeight;
    } else if (ELEMENTS.earth.includes(sign)) {
      elements.earth += planetWeight;
    } else if (ELEMENTS.air.includes(sign)) {
      elements.air += planetWeight;
    } else if (ELEMENTS.water.includes(sign)) {
      elements.water += planetWeight;
    }
  });
  
  // Calculate percentages
  const total = elements.fire + elements.earth + elements.air + elements.water;
  
  return {
    fire: {
      count: elements.fire,
      percentage: parseFloat(((elements.fire / total) * 100).toFixed(1))
    },
    earth: {
      count: elements.earth,
      percentage: parseFloat(((elements.earth / total) * 100).toFixed(1))
    },
    air: {
      count: elements.air,
      percentage: parseFloat(((elements.air / total) * 100).toFixed(1))
    },
    water: {
      count: elements.water,
      percentage: parseFloat(((elements.water / total) * 100).toFixed(1))
    }
  };
};

/**
 * Calculate modality distribution from planet positions
 */
const calculateModalities = (planetPositions) => {
  const modalities = {
    cardinal: 0,
    fixed: 0,
    mutable: 0
  };
  
  // Count planets in each modality
  Object.entries(planetPositions).forEach(([planetName, data]) => {
    const sign = data.sign;
    const planetWeight = PLANETS.find(p => p.name === planetName)?.weight || 1;
    
    // Add planet's weight to the corresponding modality
    if (MODALITIES.cardinal.includes(sign)) {
      modalities.cardinal += planetWeight;
    } else if (MODALITIES.fixed.includes(sign)) {
      modalities.fixed += planetWeight;
    } else if (MODALITIES.mutable.includes(sign)) {
      modalities.mutable += planetWeight;
    }
  });
  
  // Calculate percentages
  const total = modalities.cardinal + modalities.fixed + modalities.mutable;
  
  return {
    cardinal: {
      count: modalities.cardinal,
      percentage: parseFloat(((modalities.cardinal / total) * 100).toFixed(1))
    },
    fixed: {
      count: modalities.fixed,
      percentage: parseFloat(((modalities.fixed / total) * 100).toFixed(1))
    },
    mutable: {
      count: modalities.mutable,
      percentage: parseFloat(((modalities.mutable / total) * 100).toFixed(1))
    }
  };
};

/**
 * Generate overall astrological weather based on positions and aspects
 */
const generateAstroWeather = (planetPositions, aspects, moonPhase) => {
  // Count aspect types
  const aspectCounts = {
    harmonious: 0,  // trine, sextile
    challenging: 0, // square, opposition
    total: aspects.length
  };
  
  // Calculate aspect balance
  aspects.forEach(aspect => {
    if (['trine', 'sextile'].includes(aspect.aspect)) {
      aspectCounts.harmonious++;
    } else if (['square', 'opposition'].includes(aspect.aspect)) {
      aspectCounts.challenging++;
    }
  });
  
  // Get sun and moon signs
  const sunSign = planetPositions.sun?.sign || 'Aries';
  const moonSign = planetPositions.moon?.sign || 'Aries';
  
  // Create initial weather object
  const weather = {
    overall: 'neutral',
    description: '',
    moonPhase: moonPhase.phase,
    sunSign,
    moonSign,
    aspectBalance: 'neutral'
  };
  
  // Determine overall astrological weather
  if (aspectCounts.harmonious > aspectCounts.challenging) {
    weather.overall = 'favorable';
    weather.aspectBalance = 'harmonious';
  } else if (aspectCounts.challenging > aspectCounts.harmonious) {
    weather.overall = 'challenging';
    weather.aspectBalance = 'challenging';
  }
  
  // Generate description
  weather.description = `The Sun in ${sunSign} brings ${getSignQuality(sunSign)}. ` +
    `The Moon in ${moonSign} is in its ${moonPhase.phase.toLowerCase()} phase, indicating ${getMoonPhaseQuality(moonPhase.phase)}. ` +
    `The overall cosmic weather is ${weather.overall} with ${aspectCounts.harmonious} harmonious aspects and ${aspectCounts.challenging} challenging aspects.`;
  
  return weather;
};

/**
 * Get quality description for a moon phase
 */
const getMoonPhaseQuality = (phase) => {
  switch (phase) {
    case 'New Moon':
      return 'a time for new beginnings and setting intentions';
    case 'Waxing Crescent':
      return 'growing energy and building momentum';
    case 'First Quarter':
      return 'a time of action and overcoming challenges';
    case 'Waxing Gibbous':
      return 'refinement and preparation for culmination';
    case 'Full Moon':
      return 'heightened emotions and clarity';
    case 'Waning Gibbous':
      return 'gratitude and sharing what you\'ve learned';
    case 'Last Quarter':
      return 'release and letting go of what no longer serves you';
    case 'Waning Crescent':
      return 'rest, reflection, and preparation for a new cycle';
    default:
      return 'changing lunar energies';
  }
};

/**
 * Get quality description for a zodiac sign
 */
const getSignQuality = (sign) => {
  switch (sign) {
    case 'Aries':
      return 'energetic and pioneering energy';
    case 'Taurus':
      return 'grounded and persistent energy';
    case 'Gemini':
      return 'curious and adaptable energy';
    case 'Cancer':
      return 'nurturing and protective energy';
    case 'Leo':
      return 'confident and creative energy';
    case 'Virgo':
      return 'analytical and practical energy';
    case 'Libra':
      return 'harmonious and cooperative energy';
    case 'Scorpio':
      return 'intense and transformative energy';
    case 'Sagittarius':
      return 'optimistic and expansive energy';
    case 'Capricorn':
      return 'disciplined and ambitious energy';
    case 'Aquarius':
      return 'innovative and humanitarian energy';
    case 'Pisces':
      return 'compassionate and intuitive energy';
    default:
      return 'dynamic energy';
  }
};

/**
 * Generate detailed interpretations for planets and aspects
 */
const generateInterpretations = (planetPositions, aspects) => {
  const interpretations = {
    planets: {},
    aspects: []
  };
  
  // Generate planet interpretations
  Object.entries(planetPositions).forEach(([planetName, data]) => {
    interpretations.planets[planetName] = generatePlanetInterpretation(planetName, data);
  });
  
  // Generate aspect interpretations
  aspects.forEach(aspect => {
    if (['conjunction', 'opposition', 'trine', 'square'].includes(aspect.aspect)) {
      interpretations.aspects.push({
        aspect: aspect.aspect,
        planets: `${aspect.planet1}-${aspect.planet2}`,
        influence: aspect.influence,
        description: `${aspect.planet1} ${aspect.aspect} ${aspect.planet2}`
      });
    }
  });
  
  return interpretations;
};

/**
 * Generate interpretation for a planet in a sign
 */
const generatePlanetInterpretation = (planetName, data) => {
  const sign = data.sign;
  const retrograde = data.retrograde;
  
  let interpretation = '';
  
  // Basic interpretation based on planet
  switch (planetName) {
    case 'sun':
      interpretation = `Your core identity and vitality are expressed through ${sign}.`;
      break;
    case 'moon':
      interpretation = `Your emotional nature and instinctive responses are filtered through ${sign}.`;
      break;
    case 'mercury':
      interpretation = `Your communication style and thought processes are influenced by ${sign}.`;
      break;
    case 'venus':
      interpretation = `Your approach to relationships and what you value is colored by ${sign}.`;
      break;
    case 'mars':
      interpretation = `Your drive, ambition and how you take action is energized by ${sign}.`;
      break;
    case 'jupiter':
      interpretation = `Your growth, expansion and good fortune are expanded through ${sign}.`;
      break;
    case 'saturn':
      interpretation = `Your sense of responsibility, limitations and life lessons are structured by ${sign}.`;
      break;
    case 'uranus':
      interpretation = `Your innovative thinking and need for freedom are revolutionized by ${sign}.`;
      break;
    case 'neptune':
      interpretation = `Your imagination, spirituality and idealism are dreamed through ${sign}.`;
      break;
    case 'pluto':
      interpretation = `Your transformation, power and regeneration are intensified by ${sign}.`;
      break;
    default:
      interpretation = `This planet is in ${sign}.`;
  }
  
  // Add retrograde interpretation if applicable
  if (retrograde && planetName !== 'sun' && planetName !== 'moon') {
    interpretation += ` As this planet is retrograde, these energies may be directed inward or require reassessment.`;
  }
  
  return {
    sign,
    retrograde,
    interpretation
  };
};

/**
 * Main handler function for API requests
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Parse date from query string or use current date
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const useSidereal = req.query.sidereal === 'true';
    
    // Parse the date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    
    // Check cache
    const cacheKey = `${dateStr}-${useSidereal ? 'sidereal' : 'tropical'}`;
    if (ephemerisCache[cacheKey] && (Date.now() - ephemerisCache[cacheKey].timestamp < CACHE_TTL)) {
      console.log(`[INFO] Cache hit for ${cacheKey}`);
      return res.status(200).json(ephemerisCache[cacheKey].data);
    }
    
    // If using Supabase cache
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('astro_cache')
          .select('*')
          .eq('date', dateStr)
          .eq('sidereal', useSidereal)
          .single();
        
        if (data && !error) {
          console.log(`[INFO] Supabase cache hit for ${cacheKey}`);
          // Update memory cache as well
          ephemerisCache[cacheKey] = {
            data: JSON.parse(data.data),
            timestamp: Date.now()
          };
          return res.status(200).json(JSON.parse(data.data));
        }
      } catch (err) {
        console.error(`[ERROR] Supabase cache error:`, err);
        // Continue if cache fails
      }
    }
    
    // Calculate astrological data
    console.log(`[INFO] Calculating astro data for ${dateStr} (sidereal: ${useSidereal})`);
    const astroData = await calculateAstroData(date, useSidereal);
    
    // Store in memory cache
    ephemerisCache[cacheKey] = {
      data: astroData,
      timestamp: Date.now()
    };
    
    // Store in Supabase cache if available
    if (supabase) {
      try {
        const { error } = await supabase
          .from('astro_cache')
          .upsert({
            date: dateStr,
            sidereal: useSidereal,
            data: JSON.stringify(astroData),
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error(`[ERROR] Supabase cache update error:`, error);
        }
      } catch (err) {
        console.error(`[ERROR] Supabase cache update exception:`, err);
        // Continue even if cache update fails
      }
    }
    
    // Return the calculated data
    return res.status(200).json(astroData);
  } catch (error) {
    console.error(`[ERROR] API handler exception:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

// Unified Astrology API Endpoint - CommonJS Version
// Uses astronomy-engine correctly in CommonJS format
// Optimized for Vercel deployment

const Astronomy = require('astronomy-engine');
const { createClient } = require('@supabase/supabase-js');

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
    console.error(`[ERROR] calculateAstroData exception:`, error);
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
      // Get ecliptic longitude
      const ecliptic = Astronomy.Ecliptic(planet.body, time);
      let longitude = ecliptic.lon;
      
      // Apply ayanamsa correction for sidereal zodiac
      if (useSidereal) {
        longitude -= AYANAMSA_VALUE;
        // Ensure longitude is within 0-360 range
        if (longitude < 0) longitude += 360;
      }
      
      // Calculate zodiac sign
      const signIndex = Math.floor(longitude / 30);
      const sign = ZODIAC_SIGNS[signIndex];
      
      // Calculate degrees within sign
      const degrees = longitude % 30;
      
      // Check if retrograde (not applicable for Sun and Moon)
      let retrograde = false;
      if (planet.name !== 'sun' && planet.name !== 'moon') {
        // Check planet motion by calculating position slightly later
        const laterTime = Astronomy.AddDays(time, 1);
        const laterEcliptic = Astronomy.Ecliptic(planet.body, laterTime);
        let laterLongitude = laterEcliptic.lon;
        
        // Apply same sidereal correction if needed
        if (useSidereal) {
          laterLongitude -= AYANAMSA_VALUE;
          if (laterLongitude < 0) laterLongitude += 360;
        }
        
        // If longitude is decreasing, planet is retrograde
        // Account for 0/360 boundary crossing
        const isRetrograde = (laterLongitude < longitude && (longitude - laterLongitude) < 180) || 
                            (laterLongitude > longitude && (laterLongitude - longitude) > 180);
        retrograde = isRetrograde;
      }
      
      // Store planet data
      positions[planet.name] = {
        longitude,
        sign,
        degrees: parseFloat(degrees.toFixed(2)),
        retrograde,
        weight: planet.weight
      };
    } catch (error) {
      console.error(`[ERROR] Error calculating position for ${planet.name}:`, error);
      // Provide default values in case of error
      positions[planet.name] = {
        longitude: 0,
        sign: 'Aries',
        degrees: 0,
        retrograde: false,
        weight: planet.weight,
        error: true
      };
    }
  }
  
  return positions;
};

/**
 * Calculate moon phase information
 */
const calculateMoonPhase = (time) => {
  try {
    // Get illumination fraction and phase angle
    const illumination = Astronomy.MoonFraction(time);
    const phaseAngle = Astronomy.MoonPhase(time);
    
    // Determine moon phase name
    const phaseName = getMoonPhaseName(illumination, phaseAngle);
    
    return {
      illumination: parseFloat(illumination.toFixed(2)),
      angle: parseFloat(phaseAngle.toFixed(2)),
      phase: phaseName
    };
  } catch (error) {
    console.error(`[ERROR] calculateMoonPhase exception:`, error);
    return {
      illumination: 0,
      angle: 0,
      phase: 'Unknown'
    };
  }
};

/**
 * Determine moon phase name based on illumination and angle
 */
const getMoonPhaseName = (illumination, angle) => {
  // New Moon: 0-45 degrees
  if (angle < 45) return 'New Moon';
  
  // Waxing Crescent: 45-90 degrees
  if (angle < 90) return 'Waxing Crescent';
  
  // First Quarter: 90-135 degrees
  if (angle < 135) return 'First Quarter';
  
  // Waxing Gibbous: 135-180 degrees
  if (angle < 180) return 'Waxing Gibbous';
  
  // Full Moon: 180-225 degrees
  if (angle < 225) return 'Full Moon';
  
  // Waning Gibbous: 225-270 degrees
  if (angle < 270) return 'Waning Gibbous';
  
  // Last Quarter: 270-315 degrees
  if (angle < 315) return 'Last Quarter';
  
  // Waning Crescent: 315-360 degrees
  return 'Waning Crescent';
};

/**
 * Calculate aspects between planets
 */
const calculateAspects = (planetPositions) => {
  const aspects = [];
  const orbs = {
    conjunction: 8,
    opposition: 8,
    trine: 6,
    square: 6,
    sextile: 4
  };
  
  // Get planet names
  const planetNames = Object.keys(planetPositions);
  
  // Check each planet pair for aspects
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i];
      const planet2 = planetNames[j];
      
      // Skip if either planet has an error
      if (planetPositions[planet1].error || planetPositions[planet2].error) continue;
      
      // Get longitudes
      const lon1 = planetPositions[planet1].longitude;
      const lon2 = planetPositions[planet2].longitude;
      
      // Calculate absolute angle difference
      let angle = Math.abs(lon1 - lon2);
      if (angle > 180) angle = 360 - angle;
      
      // Check for aspects
      let aspectType = null;
      let orb = 0;
      
      // Conjunction: 0 degrees
      if (angle <= orbs.conjunction) {
        aspectType = 'conjunction';
        orb = angle;
      }
      // Opposition: 180 degrees
      else if (Math.abs(angle - 180) <= orbs.opposition) {
        aspectType = 'opposition';
        orb = Math.abs(angle - 180);
      }
      // Trine: 120 degrees
      else if (Math.abs(angle - 120) <= orbs.trine) {
        aspectType = 'trine';
        orb = Math.abs(angle - 120);
      }
      // Square: 90 degrees
      else if (Math.abs(angle - 90) <= orbs.square) {
        aspectType = 'square';
        orb = Math.abs(angle - 90);
      }
      // Sextile: 60 degrees
      else if (Math.abs(angle - 60) <= orbs.sextile) {
        aspectType = 'sextile';
        orb = Math.abs(angle - 60);
      }
      
      // If aspect found, add to list
      if (aspectType) {
        // Determine if harmonious or challenging
        const influence = ['trine', 'sextile'].includes(aspectType) ? 'harmonious' : 
                          ['opposition', 'square'].includes(aspectType) ? 'challenging' : 'neutral';
        
        // Calculate aspect strength based on orb and planet weights
        const weight1 = planetPositions[planet1].weight;
        const weight2 = planetPositions[planet2].weight;
        const orbFactor = 1 - (orb / orbs[aspectType]);
        const strength = parseFloat(((weight1 + weight2) * orbFactor / 2).toFixed(2));
        
        aspects.push({
          planet1,
          planet2,
          aspect: aspectType,
          angle: parseFloat(angle.toFixed(2)),
          orb: parseFloat(orb.toFixed(2)),
          influence,
          strength
        });
      }
    }
  }
  
  // Sort aspects by strength
  return aspects.sort((a, b) => b.strength - a.strength);
};

/**
 * Calculate element distribution
 */
const calculateElements = (planetPositions) => {
  const elements = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  // Count planets in each element
  Object.values(planetPositions).forEach(planet => {
    Object.entries(ELEMENTS).forEach(([element, signs]) => {
      if (signs.includes(planet.sign)) {
        elements[element] += planet.weight;
      }
    });
  });
  
  // Calculate percentages
  const total = Object.values(elements).reduce((sum, count) => sum + count, 0);
  const percentages = {};
  
  Object.entries(elements).forEach(([element, count]) => {
    percentages[element] = parseFloat(((count / total) * 100).toFixed(1));
  });
  
  return {
    counts: elements,
    percentages
  };
};

/**
 * Calculate modality distribution
 */
const calculateModalities = (planetPositions) => {
  const modalities = {
    cardinal: 0,
    fixed: 0,
    mutable: 0
  };
  
  // Count planets in each modality
  Object.values(planetPositions).forEach(planet => {
    Object.entries(MODALITIES).forEach(([modality, signs]) => {
      if (signs.includes(planet.sign)) {
        modalities[modality] += planet.weight;
      }
    });
  });
  
  // Calculate percentages
  const total = Object.values(modalities).reduce((sum, count) => sum + count, 0);
  const percentages = {};
  
  Object.entries(modalities).forEach(([modality, count]) => {
    percentages[modality] = parseFloat(((count / total) * 100).toFixed(1));
  });
  
  return {
    counts: modalities,
    percentages
  };
};

/**
 * Generate astrological weather report
 */
const generateAstroWeather = (planetPositions, aspects, moonPhase) => {
  // Count harmonious and challenging aspects
  const aspectCounts = {
    harmonious: aspects.filter(a => a.influence === 'harmonious').length,
    challenging: aspects.filter(a => a.influence === 'challenging').length,
    neutral: aspects.filter(a => a.influence === 'neutral').length
  };
  
  // Determine overall weather
  let overall = 'neutral';
  if (aspectCounts.harmonious > aspectCounts.challenging + 2) {
    overall = 'very favorable';
  } else if (aspectCounts.harmonious > aspectCounts.challenging) {
    overall = 'favorable';
  } else if (aspectCounts.challenging > aspectCounts.harmonious + 2) {
    overall = 'very challenging';
  } else if (aspectCounts.challenging > aspectCounts.harmonious) {
    overall = 'challenging';
  }
  
  // Get sun and moon signs
  const sunSign = planetPositions.sun.sign;
  const moonSign = planetPositions.moon.sign;
  
  // Generate weather report
  const weather = {
    overall,
    aspectCounts,
    sunSign,
    moonSign,
    moonPhase: moonPhase.phase,
    description: ''
  };
  
  // Generate description
  weather.description = 
    `The Sun in ${sunSign} brings ${getSignQuality(sunSign)}. ` +
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
module.exports = async function (req, res) {
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

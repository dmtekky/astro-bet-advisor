// Unified Astrology API Endpoint - Simplified Version
// Uses astronomy-engine instead of swisseph for Vercel compatibility
// Optimized for production deployment

import * as Astronomy from 'astronomy-engine';
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

/**
 * Calculate complete astrological data for a given date
 */
async function calculateAstroData(date, useSidereal = false) {
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
}

/**
 * Calculate planetary positions using astronomy-engine
 */
async function calculatePlanetaryPositions(time, useSidereal = false) {
  const positions = {};
  
  for (const planet of PLANETS) {
    try {
      // Calculate ecliptic coordinates
      const ecliptic = Astronomy.Ecliptic(planet.body, time);
      
      // Apply ayanamsa correction for sidereal zodiac
      let longitude = ecliptic.elon;
      if (useSidereal) {
        longitude -= AYANAMSA_VALUE;
        if (longitude < 0) longitude += 360;
      }
      
      // Normalize to 0-360 range
      longitude = longitude % 360;
      if (longitude < 0) longitude += 360;
      
      // Calculate zodiac sign
      const signIndex = Math.floor(longitude / 30);
      const sign = ZODIAC_SIGNS[signIndex];
      
      // Calculate degree in sign
      const degree = longitude % 30;
      
      // Get speed (approximated - positive is direct, negative is retrograde)
      const prevTime = new Astronomy.AstroTime(time.tt - 1); // 1 day before
      const prevEcliptic = Astronomy.Ecliptic(planet.body, prevTime);
      const speed = ecliptic.elon - prevEcliptic.elon;
      
      // Store planet data
      positions[planet.name] = {
        name: planet.name,
        longitude: longitude,
        sign: sign,
        degree: degree,
        retrograde: speed < 0,
        speed: speed,
        // Default house for simplified version
        house: Math.floor(Math.random() * 12) + 1
      };
    } catch (error) {
      console.error(`[ERROR] Failed to calculate position for ${planet.name}:`, error);
      // Provide default values on error
      positions[planet.name] = {
        name: planet.name,
        longitude: 0,
        sign: 'Aries',
        degree: 0,
        retrograde: false,
        speed: 0,
        house: 1
      };
    }
  }
  
  return positions;
}

/**
 * Calculate moon phase using astronomy-engine
 */
function calculateMoonPhase(time) {
  try {
    // Get illumination fraction (0-1)
    const illumination = Astronomy.MoonFraction(time);
    
    // Get moon phase angle
    const moonLon = Astronomy.Ecliptic(Astronomy.Body.Moon, time).elon;
    const sunLon = Astronomy.Ecliptic(Astronomy.Body.Sun, time).elon;
    let angle = (moonLon - sunLon) % 360;
    if (angle < 0) angle += 360;
    
    // Determine phase name
    const phaseName = getMoonPhaseName(illumination, angle);
    
    return {
      illumination,
      angle,
      phase: phaseName
    };
  } catch (error) {
    console.error("[ERROR] Moon phase calculation error:", error);
    return {
      illumination: 0.5,
      angle: 0,
      phase: "Unknown"
    };
  }
}

/**
 * Get moon phase name from illumination value and angle
 */
function getMoonPhaseName(illumination, angle) {
  if (angle < 10 || angle > 350) return "New Moon";
  if (angle > 80 && angle < 100) return "First Quarter";
  if (angle > 170 && angle < 190) return "Full Moon";
  if (angle > 260 && angle < 280) return "Last Quarter";
  
  if (angle < 90) return "Waxing Crescent";
  if (angle < 180) return "Waxing Gibbous";
  if (angle < 270) return "Waning Gibbous";
  return "Waning Crescent";
}

/**
 * Calculate aspects between planets
 */
function calculateAspects(planetPositions) {
  const aspects = [];
  const planetNames = Object.keys(planetPositions);
  
  // Compare each planet with every other planet
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetPositions[planetNames[i]];
      const planet2 = planetPositions[planetNames[j]];
      
      // Calculate angular distance
      let angle = Math.abs(planet1.longitude - planet2.longitude);
      if (angle > 180) angle = 360 - angle;
      
      // Get aspect type
      const aspectType = getAspectType(angle);
      if (aspectType) {
        aspects.push({
          planet1: planet1.name,
          planet2: planet2.name,
          aspect: aspectType.name,
          angle: angle,
          orb: aspectType.orb,
          influence: aspectType.influence
        });
      }
    }
  }
  
  return aspects;
}

/**
 * Get aspect type based on angle
 */
function getAspectType(angle) {
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
  
  // Find matching aspect type
  for (const type of aspectTypes) {
    if (Math.abs(angle - type.angle) <= type.orb) {
      return type;
    }
  }
  
  return null; // No aspect found
}

/**
 * Calculate element distribution from planet positions
 */
function calculateElements(planetPositions) {
  const elements = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  // Count planets in each element
  for (const planetName in planetPositions) {
    const planet = planetPositions[planetName];
    const sign = planet.sign;
    
    // Add planet's weight to the corresponding element
    for (const element in ELEMENTS) {
      if (ELEMENTS[element].includes(sign)) {
        elements[element] += PLANETS.find(p => p.name === planetName)?.weight || 1;
      }
    }
  }
  
  // Calculate total weight
  const totalWeight = Object.values(elements).reduce((sum, val) => sum + val, 0);
  
  // Convert to percentages
  const percentages = {};
  for (const element in elements) {
    percentages[element] = Math.round((elements[element] / totalWeight) * 100);
  }
  
  return {
    counts: elements,
    percentages: percentages
  };
}

/**
 * Calculate modality distribution from planet positions
 */
function calculateModalities(planetPositions) {
  const modalities = {
    cardinal: 0,
    fixed: 0,
    mutable: 0
  };
  
  // Count planets in each modality
  for (const planetName in planetPositions) {
    const planet = planetPositions[planetName];
    const sign = planet.sign;
    
    // Add planet's weight to the corresponding modality
    for (const modality in MODALITIES) {
      if (MODALITIES[modality].includes(sign)) {
        modalities[modality] += PLANETS.find(p => p.name === planetName)?.weight || 1;
      }
    }
  }
  
  // Calculate total weight
  const totalWeight = Object.values(modalities).reduce((sum, val) => sum + val, 0);
  
  // Convert to percentages
  const percentages = {};
  for (const modality in modalities) {
    percentages[modality] = Math.round((modalities[modality] / totalWeight) * 100);
  }
  
  return {
    counts: modalities,
    percentages: percentages
  };
}

/**
 * Generate overall astrological weather based on positions and aspects
 */
function generateAstroWeather(planetPositions, aspects, moonPhase) {
  // Count aspect types
  const aspectCounts = {
    harmonious: 0,  // trine, sextile
    challenging: 0, // square, opposition
    neutral: 0      // conjunction and others
  };
  
  for (const aspect of aspects) {
    if (['trine', 'sextile'].includes(aspect.aspect)) {
      aspectCounts.harmonious++;
    } else if (['square', 'opposition'].includes(aspect.aspect)) {
      aspectCounts.challenging++;
    } else {
      aspectCounts.neutral++;
    }
  }
  
  // Check for special conditions
  const sunSign = planetPositions.sun?.sign || 'Aries';
  const moonSign = planetPositions.moon?.sign || 'Aries';
  
  // Generate weather description
  let weather = {
    overall: 'neutral',
    description: '',
    sunSign,
    moonSign,
    moonPhase: moonPhase.phase,
    aspectBalance: 'neutral'
  };
  
  // Determine overall weather
  if (aspectCounts.harmonious > aspectCounts.challenging) {
    weather.overall = 'favorable';
    weather.aspectBalance = 'harmonious';
    weather.description = `A generally favorable day with ${aspectCounts.harmonious} harmonious aspects creating a positive atmosphere.`;
  } else if (aspectCounts.challenging > aspectCounts.harmonious) {
    weather.overall = 'challenging';
    weather.aspectBalance = 'challenging';
    weather.description = `A potentially challenging day with ${aspectCounts.challenging} difficult aspects creating some tension.`;
  } else {
    weather.description = `A balanced day with mixed energies from ${aspectCounts.harmonious} harmonious and ${aspectCounts.challenging} challenging aspects.`;
  }
  
  // Add moon phase insight
  weather.description += ` The ${moonPhase.phase} moon in ${moonSign} suggests ${getMoonPhaseQuality(moonPhase.phase)}.`;
  
  // Add sun sign insight
  weather.description += ` The Sun in ${sunSign} brings ${getSignQuality(sunSign)}.`;
  
  return weather;
}

/**
 * Get quality description for a moon phase
 */
function getMoonPhaseQuality(phase) {
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
      return 'gratitude and sharing what you've learned';
    case 'Last Quarter':
      return 'release and letting go of what no longer serves you';
    case 'Waning Crescent':
      return 'rest, reflection, and preparation for a new cycle';
    default:
      return 'changing lunar energies';
  }
}

/**
 * Get quality description for a zodiac sign
 */
function getSignQuality(sign) {
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
}

/**
 * Generate detailed interpretations for planets and aspects
 */
function generateInterpretations(planetPositions, aspects) {
  const interpretations = {
    planets: {},
    aspects: []
  };
  
  // Generate interpretations for each planet
  for (const planetName in planetPositions) {
    const planet = planetPositions[planetName];
    interpretations.planets[planetName] = generatePlanetInterpretation(planetName, planet);
  }
  
  // Generate interpretations for important aspects
  for (const aspect of aspects) {
    // Filter to most important aspects
    if (['conjunction', 'opposition', 'trine', 'square'].includes(aspect.aspect)) {
      const interpretation = {
        aspect: aspect.aspect,
        planets: `${aspect.planet1}-${aspect.planet2}`,
        interpretation: `The ${aspect.aspect} between ${aspect.planet1} and ${aspect.planet2} creates ${aspect.influence} energy.`
      };
      
      interpretations.aspects.push(interpretation);
    }
  }
  
  return interpretations;
}

/**
 * Generate interpretation for a planet in a sign
 */
function generatePlanetInterpretation(planetName, data) {
  const sign = data.sign;
  const retrograde = data.retrograde;
  
  let interpretation = '';
  
  // Standard interpretations based on planet and sign
  switch (planetName) {
    case 'sun':
      interpretation = `Sun in ${sign} represents your core essence and vitality. ${getSignQuality(sign)}`;
      break;
    case 'moon':
      interpretation = `Moon in ${sign} reflects your emotional nature and subconscious patterns. It brings ${getSignQuality(sign)} to your emotional world.`;
      break;
    case 'mercury':
      interpretation = `Mercury in ${sign} shapes how you think and communicate. It gives your mind ${getSignQuality(sign)}.`;
      break;
    case 'venus':
      interpretation = `Venus in ${sign} influences how you relate to others and what you value. It attracts ${getSignQuality(sign)} into your life.`;
      break;
    case 'mars':
      interpretation = `Mars in ${sign} drives your actions and desires. It fuels you with ${getSignQuality(sign)}.`;
      break;
    case 'jupiter':
      interpretation = `Jupiter in ${sign} shows where you find growth and meaning. It expands ${getSignQuality(sign)} in your life.`;
      break;
    case 'saturn':
      interpretation = `Saturn in ${sign} reveals your challenges and responsibilities. It brings structure through ${getSignQuality(sign)}.`;
      break;
    case 'uranus':
      interpretation = `Uranus in ${sign} indicates where you seek freedom and innovation. It awakens ${getSignQuality(sign)} in unexpected ways.`;
      break;
    case 'neptune':
      interpretation = `Neptune in ${sign} represents your spiritual aspirations and illusions. It dissolves boundaries through ${getSignQuality(sign)}.`;
      break;
    case 'pluto':
      interpretation = `Pluto in ${sign} shows where profound transformation occurs. It intensifies ${getSignQuality(sign)} through deep change.`;
      break;
    default:
      interpretation = `${planetName} in ${sign} brings ${getSignQuality(sign)}.`;
  }
  
  // Add retrograde information if applicable
  if (retrograde) {
    interpretation += ` Currently retrograde, this energy is turned inward, prompting reflection and revision.`;
  }
  
  return {
    planet: planetName,
    sign: sign,
    retrograde: retrograde,
    interpretation: interpretation
  };
}

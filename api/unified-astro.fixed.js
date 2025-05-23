// Unified Astrology API Endpoint - CommonJS Version
// Uses astronomy-engine correctly in CommonJS format
// Optimized for Vercel deployment

console.log("--- UNIFIED ASTRO API SCRIPT STARTED ---");

// Unique log for deployment verification
const DEPLOYMENT_VERSION_FIXED = "fixed_js_v20250523_1505";
console.log(`[DEPLOY_CHECK] unified-astro.fixed.js loaded. Version: ${DEPLOYMENT_VERSION_FIXED}`);
const Astronomy = require('astronomy-engine');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration for caching
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client if credentials are available
let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const DEPLOYMENT_VERSION_FIXED_TS = "v_fixed_js_moon_lon_check_TS_" + new Date().toISOString();
  console.log(`[DEPLOY_CHECK_TS] unified-astro.fixed.js loaded. Version: ${DEPLOYMENT_VERSION_FIXED_TS}`);
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
 * Create a proper date object that astronomy-engine can use
 */
const createAstronomyDate = (date) => {
  // Ensure we have a valid date object
  const dateObj = new Date(date);
  
  // Create time object using Astronomy.MakeTime
  return Astronomy.MakeTime(dateObj);
};

/**
 * Calculate complete astrological data for a given date
 */
const calculateAstroData = async (date, useSidereal = false) => {
  try {
    // Create astronomy-engine time object using our helper
    const time = createAstronomyDate(date);
    
    // Calculate planetary positions
    const planetPositions = await calculatePlanetaryPositions(time, useSidereal);
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase(time);
    
    // Calculate aspects between planets
    const aspects = calculateAspects(planetPositions, time);
    
    // Calculate element distribution
    const elements = calculateElements(planetPositions);
    
    // Calculate modality distribution
    const modalities = calculateModalities(planetPositions);
    
    // Generate interpretations and astrological weather
    const weather = generateAstroWeather(planetPositions, aspects, moonPhase);
    const interpretations = generateInterpretations(planetPositions, aspects);
    
    // Return complete astrological data
    const responseData = {
      date: date.toISOString(),
      sidereal: useSidereal,
      ayanamsa: useSidereal ? AYANAMSA_VALUE : 0,
      planets: planetPositions,
      moonPhase: moonPhase,
      aspects: aspects,
      elements: elements,
      modalities: modalities,
      astro_weather: weather,
      interpretations: interpretations,
      // Ensure sunSign is included at the root level for easy access
      sunSign: planetPositions.sun?.sign || 'Aries'
    };

    // Log the response data for debugging
    console.log('API Response Data:', JSON.stringify(responseData, null, 2));
    
    return responseData;
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
      // Use Astronomy.Horizon to calculate position directly
      // This is a simplified approach that will still work for our purposes
      // We'll use the longitude directly from the horizontal coordinates
          let elong;
          const planetNameLower = planet.name.toLowerCase();

          if (planetNameLower === 'sun') {
            const sunPos = Astronomy.SunPosition(time);
            // console.log(`SunPosition raw object for ${planet.name} at ${time}:`, JSON.stringify(sunPos));
            if (sunPos && typeof sunPos.elon === 'number') {
              elong = sunPos.elon;
            } else {
              console.error(`Error: SunPosition did not return expected data for ${planet.name}. Received:`, sunPos);
              throw new Error(`Failed to get ecliptic longitude (elon) from SunPosition for ${planet.name}`);
            }
          } else if (planetNameLower === 'moon') {
            const moonPos = Astronomy.EclipticGeoMoon(time);
            // console.log(`EclipticGeoMoon raw object for ${planet.name} at ${time}:`, JSON.stringify(moonPos));
            if (moonPos && typeof moonPos.lon === 'number') {
              elong = moonPos.lon;
            } else {
              console.error(`Error: EclipticGeoMoon did not return expected data for ${planet.name}. Received:`, moonPos);
              throw new Error(`Failed to get longitude (lon) from EclipticGeoMoon for ${planet.name}`);
            }
          } else {
            if (!planet.body) {
                console.error(`Error: planet.body is undefined for ${planet.name}. Cannot calculate EclipticLongitude.`);
                throw new Error(`planet.body is undefined for ${planet.name}`);
            }
            elong = Astronomy.EclipticLongitude(planet.body, time);
          }
      let longitude = elong;
      
      // Log success
      console.log(`[INFO] Successfully calculated position for ${planet.name}`);
      
      
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
      const degrees = parseFloat((longitude % 30).toFixed(2));
      
      // For simplicity, we'll set retrograde based on common retrograde periods
      // This is a simplification since calculating actual retrograde motion is complex
      let retrograde = false; // Default for Sun and Moon, which are never retrograde.
      if (planet.name !== 'sun' && planet.name !== 'moon') {
        // Calculate actual retrograde status by comparing its position today vs yesterday.
        // We use the tropical longitude ('elong') for speed calculation before any sidereal adjustment.
        const timeYesterday = new Date(time.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before current time
        const elongToday = elong; // 'elong' is already the tropical longitude for the current 'time' (from line 135)
        const elongYesterday = Astronomy.EclipticLongitude(planet.body, timeYesterday);

        let diff = elongToday - elongYesterday;

        // Normalize difference to handle the 0/360 degree wrap-around.
        // A positive diff means direct motion, negative means retrograde.
        if (diff < -180) {
          diff += 360;
        } else if (diff > 180) {
          diff -= 360;
        }
        // A negative difference in longitude indicates retrograde motion.
        retrograde = diff < 0;
      }
      
      // Store planet data
      positions[planet.name] = {
        longitude,
        sign,
        degrees: parseFloat(degrees.toFixed(2)),
        retrograde,
        weight: planet.weight,
        tropicalLongitude: elong // Store original tropical longitude for aspect calculations
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
        tropicalLongitude: 0, // Default tropical longitude in case of error
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
    // For astronomy-engine, we need to get the phase information differently
    const phaseAngle = Astronomy.MoonPhase(time);
    
    // Calculate illumination - this is the correct way in astronomy-engine
    // MoonFraction is not available, so we use alternative methods
    // Illumination is (1 + cos(phase_angle))/2
    const angleInRadians = phaseAngle * Math.PI / 180;
    const illumination = (1 + Math.cos(angleInRadians)) / 2;
    
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
  // Define thresholds for different moon phases
  if (illumination < 0.02) return 'New Moon';
  if (illumination < 0.48 && angle < 180) return 'Waxing Crescent';
  if (illumination > 0.48 && illumination < 0.52 && angle < 180) return 'First Quarter';
  if (illumination < 0.98 && angle < 180) return 'Waxing Gibbous';
  if (illumination >= 0.98) return 'Full Moon';
  if (illumination > 0.52 && angle >= 180) return 'Waning Gibbous';
  if (illumination > 0.48 && illumination < 0.52 && angle >= 180) return 'Last Quarter';
  if (illumination < 0.48 && angle >= 180) return 'Waning Crescent';
  
  return 'Unknown';
};

/**
 * Calculate aspects between planets
 */
const calculateAspects = (planetPositions, time) => {
  const aspects = [];
  const aspectTypes = [
    { name: 'conjunction', angle: 0, orb: 8 },
    { name: 'opposition', angle: 180, orb: 8 },
    { name: 'trine', angle: 120, orb: 8 },
    { name: 'square', angle: 90, orb: 8 },
    { name: 'sextile', angle: 60, orb: 6 },
    { name: 'quincunx', angle: 150, orb: 5 },
    { name: 'semisextile', angle: 30, orb: 3 },
    { name: 'semisquare', angle: 45, orb: 3 },
    { name: 'sesquiquadrate', angle: 135, orb: 3 }
  ];
  
  // Get all planet names
  const planetNames = Object.keys(planetPositions);
  
  // Check each pair of planets for aspects
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i];
      const planet2 = planetNames[j];
      
      // Skip if either planet has an error
      if (planetPositions[planet1].error || planetPositions[planet2].error) {
        continue;
      }
      
      const lon1 = planetPositions[planet1].longitude;
      const lon2 = planetPositions[planet2].longitude;
      
      // Calculate the angular distance
      let distance = Math.abs(lon1 - lon2);
      if (distance > 180) distance = 360 - distance;
      
      // Check for aspects
      for (const aspectType of aspectTypes) {
        const orb = aspectType.orb;
        const diff = Math.abs(distance - aspectType.angle);
        
        // Check if within orb
        if (diff <= orb) {
          // Calculate strength (1.0 = exact, 0.0 = at maximum orb)
          const strength = 1 - (diff / orb);
          
          // Add to aspects list
          aspects.push({
            planet1,
            planet2,
            aspect: aspectType.name,
            angle: aspectType.angle,
            orb: parseFloat(diff.toFixed(2)),
            strength: parseFloat(strength.toFixed(2)),
            applying: isApplying(planetPositions[planet1], planetPositions[planet2], aspectType.angle, time, Astronomy)
          });
          
          // Only count the closest aspect between two planets
          break;
        }
      }
    }
  }
  
  return aspects;
};

/**
 * Determine if an aspect is applying or separating
 */
const isApplying = (planetData1, planetData2, aspectAngle, currentTime, astronomyLib) => {
  // Use tropical longitudes for aspect progression calculation
  const lon1_current = planetData1.tropicalLongitude;
  const lon2_current = planetData2.tropicalLongitude;
  const retrograde1 = planetData1.retrograde;
  const retrograde2 = planetData2.retrograde;

  // Calculate current orb
  let currentDistance = Math.abs(lon1_current - lon2_current);
  if (currentDistance > 180) currentDistance = 360 - currentDistance;
  const currentOrb = Math.abs(currentDistance - aspectAngle);

  // Calculate positions 1 hour in the future
  const futureTime = new Date(currentTime.getTime() + (60 * 60 * 1000)); // 1 hour later
  const lon1_future = astronomyLib.EclipticLongitude(PLANETS.find(p => p.name === planetData1.name).body, futureTime);
  const lon2_future = astronomyLib.EclipticLongitude(PLANETS.find(p => p.name === planetData2.name).body, futureTime);

  // Calculate future orb
  let futureDistance = Math.abs(lon1_future - lon2_future);
  if (futureDistance > 180) futureDistance = 360 - futureDistance;
  const futureOrb = Math.abs(futureDistance - aspectAngle);

  // If the orb is smaller in the future, the aspect is applying.
  // This basic check works for most cases. More complex scenarios involve exact speeds.
  // A very small tolerance to account for floating point inaccuracies.
  const tolerance = 0.0001; 
  return futureOrb < currentOrb - tolerance;
};

/**
 * Calculate element distribution
 */
const calculateElements = (planetPositions) => {
  const elementScores = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0
  };
  
  let totalWeight = 0;
  
  // Count planets in each element
  for (const [planet, data] of Object.entries(planetPositions)) {
    if (data.error) continue;
    
    const sign = data.sign;
    const weight = data.weight;
    totalWeight += weight;
    
    // Find which element this sign belongs to
    for (const [element, signs] of Object.entries(ELEMENTS)) {
      if (signs.includes(sign)) {
        elementScores[element] += weight;
        break;
      }
    }
  }
  
  // Convert to percentages
  const result = {};
  for (const element in elementScores) {
    result[element] = totalWeight > 0 
      ? parseFloat((elementScores[element] / totalWeight * 100).toFixed(1)) 
      : 0;
  }
  
  return result;
};

/**
 * Calculate modality distribution
 */
const calculateModalities = (planetPositions) => {
  const modalityScores = {
    cardinal: 0,
    fixed: 0,
    mutable: 0
  };
  
  let totalWeight = 0;
  
  // Count planets in each modality
  for (const [planet, data] of Object.entries(planetPositions)) {
    if (data.error) continue;
    
    const sign = data.sign;
    const weight = data.weight;
    totalWeight += weight;
    
    // Find which modality this sign belongs to
    for (const [modality, signs] of Object.entries(MODALITIES)) {
      if (signs.includes(sign)) {
        modalityScores[modality] += weight;
        break;
      }
    }
  }
  
  // Convert to percentages
  const result = {};
  for (const modality in modalityScores) {
    result[modality] = totalWeight > 0 
      ? parseFloat((modalityScores[modality] / totalWeight * 100).toFixed(1)) 
      : 0;
  }
  
  return result;
};

/**
 * Generate astrological weather report
 */
const generateAstroWeather = (planetPositions, aspects, moonPhase) => {
  // Default weather scores
  const weather = {
    overall: 0,
    action: 0,
    thinking: 0,
    feeling: 0,
    creativity: 0,
    spirituality: 0
  };
  
  try {
    // Factor 1: Moon phase
    const moonPhaseQuality = getMoonPhaseQuality(moonPhase.angle);
    weather.overall += moonPhaseQuality.overall;
    weather.action += moonPhaseQuality.action;
    weather.thinking += moonPhaseQuality.thinking;
    weather.feeling += moonPhaseQuality.feeling;
    weather.creativity += moonPhaseQuality.creativity;
    weather.spirituality += moonPhaseQuality.spirituality;
    
    // Factor 2: Sun sign quality
    if (planetPositions.sun && !planetPositions.sun.error) {
      const sunSignQuality = getSignQuality(planetPositions.sun.sign);
      weather.overall += sunSignQuality.overall;
      weather.action += sunSignQuality.action;
      weather.thinking += sunSignQuality.thinking;
      weather.feeling += sunSignQuality.feeling;
      weather.creativity += sunSignQuality.creativity;
      weather.spirituality += sunSignQuality.spirituality;
    }
    
    // Factor 3: Mercury retrograde
    if (planetPositions.mercury && planetPositions.mercury.retrograde) {
      weather.thinking -= 20;
      weather.overall -= 10;
    }
    
    // Factor 4: Aspect influences (refined)
    const aspectInfluenceConfig = {
      trine: { score: 8, effect: 'positive' },
      sextile: { score: 6, effect: 'positive' },
      square: { score: -7, effect: 'negative' },
      opposition: { score: -6, effect: 'negative' },
      conjunction: { score: 4, effect: 'neutral' }, // Base for neutral conjunctions
      quincunx: { score: -3, effect: 'minor_negative' },
      semisquare: { score: -3, effect: 'minor_negative' },
      sesquiquadrate: { score: -3, effect: 'minor_negative' },
      semisextile: { score: 2, effect: 'minor_positive' }
    };

    const planetCategoryMapping = {
      sun: ['overall', 'action'],
      moon: ['feeling', 'overall'],
      mercury: ['thinking'],
      venus: ['feeling', 'creativity'],
      mars: ['action'],
      jupiter: ['overall', 'creativity', 'spirituality'],
      saturn: ['overall', 'thinking'], // Can be restrictive or focusing
      uranus: ['thinking', 'creativity', 'overall'], // Can be disruptive
      neptune: ['feeling', 'spirituality', 'creativity'],
      pluto: ['overall', 'action'] // Intensity and transformation
    };

    for (const aspect of aspects) {
      const influenceDetails = aspectInfluenceConfig[aspect.aspect];
      if (!influenceDetails) continue;

      let baseScore = influenceDetails.score;

      // Special handling for conjunctions based on planet 'harmony'
      if (aspect.aspect === 'conjunction') {
        const p1 = aspect.planet1;
        const p2 = aspect.planet2;
        // Harmonious conjunctions (e.g., Venus/Jupiter, Sun/Jupiter, Moon/Venus)
        if ((p1 === 'venus' && p2 === 'jupiter') || (p1 === 'jupiter' && p2 === 'venus') ||
            (p1 === 'sun' && p2 === 'jupiter') || (p1 === 'jupiter' && p2 === 'sun') ||
            (p1 === 'moon' && p2 === 'venus') || (p1 === 'venus' && p2 === 'moon')) {
          baseScore = 10;
        } 
        // Challenging conjunctions (e.g., Mars/Saturn, Sun/Saturn)
        else if ((p1 === 'mars' && p2 === 'saturn') || (p1 === 'saturn' && p2 === 'mars') ||
                   (p1 === 'sun' && p2 === 'saturn') || (p1 === 'saturn' && p2 === 'sun')) {
          baseScore = -8;
        }
      }

      const categoriesP1 = planetCategoryMapping[aspect.planet1] || [];
      const categoriesP2 = planetCategoryMapping[aspect.planet2] || [];
      const affectedCategories = [...new Set([...categoriesP1, ...categoriesP2])];

      if (affectedCategories.length > 0) {
        const impactPerCategory = baseScore / affectedCategories.length;
        for (const category of affectedCategories) {
          if (weather.hasOwnProperty(category)) {
            let impactValue = impactPerCategory * aspect.strength;
            if (aspect.applying) {
              impactValue *= 1.2; // Applying aspects get a slight boost in impact
            }
            weather[category] += impactValue;
          }
        }
      }
    }
    
    // Normalize all scores to 0-100 range
    for (const key in weather) {
      weather[key] = Math.min(100, Math.max(0, weather[key]));
      weather[key] = Math.round(weather[key]);
    }
    
    return weather;
  } catch (error) {
    console.error(`[ERROR] generateAstroWeather exception:`, error);
    return weather;
  }
};

/**
 * Get quality description for a moon phase
 */
const getMoonPhaseQuality = (angle) => {
  // Default qualities
  const quality = {
    overall: 50,
    action: 50,
    thinking: 50,
    feeling: 50,
    creativity: 50,
    spirituality: 50
  };
  
  // Scores based on moon angle (0-360 degrees)
  // Angle is 0 at New Moon, 90 at First Quarter, 180 at Full Moon, 270 at Last Quarter
  if (angle >= 0 && angle < 22.5) { // New Moon (Dark)
    quality.overall = 70; quality.action = 30; quality.thinking = 60; quality.feeling = 50; quality.creativity = 80; quality.spirituality = 90;
  } else if (angle >= 22.5 && angle < 67.5) { // Waxing Crescent
    quality.overall = 65; quality.action = 50; quality.thinking = 70; quality.feeling = 50; quality.creativity = 70; quality.spirituality = 70;
  } else if (angle >= 67.5 && angle < 112.5) { // First Quarter
    quality.overall = 75; quality.action = 80; quality.thinking = 80; quality.feeling = 60; quality.creativity = 60; quality.spirituality = 50;
  } else if (angle >= 112.5 && angle < 157.5) { // Waxing Gibbous
    quality.overall = 80; quality.action = 70; quality.thinking = 70; quality.feeling = 70; quality.creativity = 60; quality.spirituality = 60;
  } else if (angle >= 157.5 && angle < 202.5) { // Full Moon
    quality.overall = 85; quality.action = 60; quality.thinking = 50; quality.feeling = 90; quality.creativity = 90; quality.spirituality = 80;
  } else if (angle >= 202.5 && angle < 247.5) { // Waning Gibbous (Disseminating)
    quality.overall = 70; quality.action = 50; quality.thinking = 70; quality.feeling = 80; quality.creativity = 70; quality.spirituality = 70;
  } else if (angle >= 247.5 && angle < 292.5) { // Last Quarter
    quality.overall = 60; quality.action = 40; quality.thinking = 60; quality.feeling = 70; quality.creativity = 50; quality.spirituality = 70;
  } else if (angle >= 292.5 && angle <= 337.5) { // Waning Crescent (Balsamic)
    quality.overall = 55; quality.action = 30; quality.thinking = 50; quality.feeling = 60; quality.creativity = 60; quality.spirituality = 80;
  } else { // Covers 337.5 to 360 (back to New Moon)
    quality.overall = 65; quality.action = 30; quality.thinking = 55; quality.feeling = 50; quality.creativity = 75; quality.spirituality = 85;
  }
  
  return quality;
};

/**
 * Get quality description for a zodiac sign
 */
const getSignQuality = (sign) => {
  // Initialize with baseline neutral scores
  const quality = {
    overall: 60,    // General stability and presence
    action: 60,     // Drive, initiative, physical energy
    thinking: 60,   // Intellect, communication, analysis
    feeling: 60,    // Emotional expression, intuition, empathy
    creativity: 60, // Innovation, artistic expression, adaptability
    spirituality: 60 // Connection to unseen, faith, introspection
  };

  // Element-based adjustments
  if (ELEMENTS.fire.includes(sign)) {
    quality.action += 25;
    quality.creativity += 15;
    quality.thinking -= 10; // Less analytical, more intuitive action
    quality.feeling -= 5;   // Can be less overtly sentimental
    quality.overall += 5;   // Charisma and presence
  } else if (ELEMENTS.earth.includes(sign)) {
    quality.overall += 20;    // Stability, groundedness
    quality.thinking += 15;   // Practicality, realism
    quality.action -= 10;     // Slower, more deliberate pace
    quality.spirituality -= 5;// More focused on tangible
    quality.creativity -=5; // More practical than abstract
  } else if (ELEMENTS.air.includes(sign)) {
    quality.thinking += 25;   // Intellect, communication
    quality.creativity += 20; // Ideas, social innovation
    quality.feeling -= 15;    // More detached, rational
    quality.action -=5;       // Can be less direct, more about ideas
  } else if (ELEMENTS.water.includes(sign)) {
    quality.feeling += 25;    // Emotional depth, empathy
    quality.spirituality += 20;// Intuition, connection
    quality.action -= 15;     // Less direct, more flowing
    quality.thinking -= 10;   // More intuitive than purely logical
  }

  // Modality-based adjustments
  if (MODALITIES.cardinal.includes(sign)) {
    quality.action += 20;     // Initiative, leadership
    quality.overall += 5;
  } else if (MODALITIES.fixed.includes(sign)) {
    quality.overall += 15;    // Steadfastness, determination
    quality.thinking += 5;    // Focus, concentration
    quality.action -= 5;      // Can be resistant to change
  } else if (MODALITIES.mutable.includes(sign)) {
    quality.creativity += 15; // Adaptability, versatility
    quality.spirituality += 5;// Flow, open-mindedness
    quality.overall -= 10;    // Can be less stable or consistent
    quality.action -=5;       // Less direct, more flexible
  }

  // Normalize scores to be within 0-100
  for (const key in quality) {
    quality[key] = Math.min(100, Math.max(0, quality[key]));
  }

  return quality;
};

/**
 * Generate detailed interpretations for planets and aspects
 */
const generateInterpretations = (planetPositions, aspects) => {
  const interpretations = {
    planets: {},
    aspects: []
  };
  
  // Generate interpretations for each planet
  for (const [planet, data] of Object.entries(planetPositions)) {
    if (data.error) continue;
    
    interpretations.planets[planet] = generatePlanetInterpretation(planet, data);
  }
  
  // Generate interpretations for significant aspects
  // Focus on aspects involving personal planets (Sun, Moon, Mercury, Venus, Mars)
  const personalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];
  const significantAspects = aspects.filter(aspect => 
    (personalPlanets.includes(aspect.planet1) || personalPlanets.includes(aspect.planet2)) &&
    aspect.strength > 0.7
  );
  
  // Add interpretations for these aspects
  for (const aspect of significantAspects) {
    interpretations.aspects.push({
      ...aspect,
      interpretation: `${aspect.planet1} ${aspect.aspect} ${aspect.planet2}: This ${aspect.applying ? 'applying' : 'separating'} aspect suggests...`
    });
  }
  
  return interpretations;
};

/**
 * Generate interpretation for a planet in a sign
 */
const generatePlanetInterpretation = (planetName, data) => {
  const sign = data.sign;
  const retrograde = data.retrograde;
  
  // Base interpretation template
  let interpretation = `${planetName.charAt(0).toUpperCase() + planetName.slice(1)} in ${sign}`;
  
  // Add retrograde information if applicable
  if (retrograde) {
    interpretation += " (Retrograde)";
  }
  
  // Extended interpretation based on planet and sign
  switch (planetName) {
    case 'sun':
      interpretation += ` represents your core identity and vitality. In ${sign}, you express yourself with...`;
      break;
    case 'moon':
      interpretation += ` reflects your emotional nature and instinctive responses. In ${sign}, your feelings tend to be...`;
      break;
    case 'mercury':
      interpretation += ` shows how you think and communicate. In ${sign}, your mental approach is...`;
      break;
    case 'venus':
      interpretation += ` indicates how you approach relationships and what you value. In ${sign}, you are attracted to...`;
      break;
    case 'mars':
      interpretation += ` represents your drive, energy, and how you take action. In ${sign}, you pursue your goals by...`;
      break;
    case 'jupiter':
      interpretation += ` shows where you find growth and abundance. In ${sign}, your opportunities come through...`;
      break;
    case 'saturn':
      interpretation += ` indicates areas of responsibility and limitation. In ${sign}, you are learning lessons about...`;
      break;
    case 'uranus':
      interpretation += ` shows where you seek freedom and revolutionary change. In ${sign}, you break traditions by...`;
      break;
    case 'neptune':
      interpretation += ` represents your spiritual aspirations and where boundaries dissolve. In ${sign}, your imagination...`;
      break;
    case 'pluto':
      interpretation += ` indicates areas of deep transformation and power. In ${sign}, you experience profound changes in...`;
      break;
  }
  
  // Return planet data with interpretation
  return {
    sign,
    retrograde,
    interpretation
  };
};

/**
 * Main handler function for API requests
 */
module.exports = async (req, res) => {
  console.log(`[DEPLOY_CHECK_HANDLER_TS] unified-astro.fixed.js handler invoked. Version: ${DEPLOYMENT_VERSION_FIXED_TS}`);
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

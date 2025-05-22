// Vercel serverless function for astro API
// Use dynamic import for compatibility with Vercel serverless environment
let Astronomy;
try {
  Astronomy = require('astronomy-engine');
} catch (e) {
  console.error('Failed to load astronomy-engine:', e);
  // Fallback for ESM
  try {
    import('astronomy-engine').then(module => {
      Astronomy = module;
    }).catch(err => {
      console.error('Failed to load astronomy-engine (ESM):', err);
    });
  } catch (importErr) {
    console.error('All attempts to load astronomy-engine failed:', importErr);
  }
}

// Import specific types and functions from astronomy-engine
const { Body, Observer, MoonPhase } = Astronomy;

// Helper function to get ecliptic longitude for a body
function getEclipticLongitude(body, date, observer) {
  try {
    const equator = Astronomy.Equator(body, date, observer, true, true);
    const ecliptic = Astronomy.Ecliptic(equator);
    return ecliptic.elon;
  } catch (error) {
    console.error(`Error calculating ecliptic longitude for ${body}:`, error);
    return 0;
  }
}

// Calculate aspects between two celestial bodies
function calculateAspects(body1, body2, date, observer) {
  try {
    const lon1 = getEclipticLongitude(body1, date, observer);
    const lon2 = getEclipticLongitude(body2, date, observer);
    
    // Calculate the angle between the two bodies
    let angle = Math.abs(lon1 - lon2);
    if (angle > 180) angle = 360 - angle;
    
    // Define orb (allowed deviation) for each aspect
    const aspects = [
      { name: 'Conjunction', angle: 0, orb: 8, influence: 'Strong' },
      { name: 'Opposition', angle: 180, orb: 8, influence: 'Strong' },
      { name: 'Trine', angle: 120, orb: 8, influence: 'Favorable' },
      { name: 'Square', angle: 90, orb: 7, influence: 'Challenging' },
      { name: 'Sextile', angle: 60, orb: 6, influence: 'Favorable' }
    ];
    
    // Check if any aspect is within orb
    for (const aspect of aspects) {
      const orb = Math.abs(angle - aspect.angle);
      if (orb <= aspect.orb) {
        return {
          name: `${getPlanetName(body1)} ${aspect.name} ${getPlanetName(body2)}`,
          aspect: aspect.name,
          orb: orb,
          influence: aspect.influence
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error calculating aspects between ${body1} and ${body2}:`, error);
    return null;
  }
}

// Get retrograde status for a planet
function getRetrogradeStatus(body, date) {
  try {
    // Can't calculate retrograde for Sun and Moon
    if (body === Body.Sun || body === Body.Moon) {
      return {
        planet: getPlanetName(body),
        isRetrograde: false,
        influence: 'Direct motion'
      };
    }
    
    // To determine retrograde, check if longitude decreases over time
    const date1 = new Date(date);
    const date2 = new Date(date);
    date2.setDate(date2.getDate() + 1); // Check one day later
    
    const observer = new Observer(0, 0, 0); // Observer position doesn't matter for this
    const lon1 = getEclipticLongitude(body, date1, observer);
    const lon2 = getEclipticLongitude(body, date2, observer);
    
    // Calculate the change in longitude, accounting for crossing 0/360 degrees
    let change = lon2 - lon1;
    if (change > 180) change -= 360;
    if (change < -180) change += 360;
    
    const isRetrograde = change < 0;
    
    const influences = {
      [Body.Mercury]: isRetrograde ? 'Communication issues, review and revise' : 'Clear thinking, good for new agreements',
      [Body.Venus]: isRetrograde ? 'Reassess relationships and values' : 'Favorable for social activities and finances',
      [Body.Mars]: isRetrograde ? 'Energy directed inward, potential frustration' : 'Forward momentum, good for taking action'
    };
    
    return {
      planet: getPlanetName(body),
      isRetrograde,
      influence: influences[body] || (isRetrograde ? 'Retrograde motion' : 'Direct motion')
    };
  } catch (error) {
    console.error(`Error calculating retrograde status for ${body}:`, error);
    return {
      planet: getPlanetName(body),
      isRetrograde: false,
      influence: 'Unknown (error in calculation)'
    };
  }
}

// Helper functions
function getPlanetName(body) {
  const names = {
    [Body.Sun]: 'Sun',
    [Body.Moon]: 'Moon',
    [Body.Mercury]: 'Mercury',
    [Body.Venus]: 'Venus',
    [Body.Earth]: 'Earth',
    [Body.Mars]: 'Mars',
    [Body.Jupiter]: 'Jupiter',
    [Body.Saturn]: 'Saturn',
    [Body.Uranus]: 'Uranus',
    [Body.Neptune]: 'Neptune',
    [Body.Pluto]: 'Pluto'
  };
  
  return names[body] || body;
}

function getZodiacSign(degrees) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio', 
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const index = Math.floor(degrees / 30) % 12;
  return signs[index];
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
    const observer = new Observer(40.7128, -74.0060, 10);
    
    // Calculate moon data
    const moonPhase = MoonPhase(date) / 360; // Convert to 0-1 range
    const moonPhaseName = getMoonPhaseName(moonPhase);
    const moonLon = getEclipticLongitude(Body.Moon, date, observer);
    const moonSign = getZodiacSign(moonLon);
    
    // Calculate sun data
    const sunLon = getEclipticLongitude(Body.Sun, date, observer);
    const sunSign = getZodiacSign(sunLon);
    
    // Calculate aspects
    const aspectConfigs = [
      { body1: Body.Sun, body2: Body.Mars },
      { body1: Body.Moon, body2: Body.Jupiter },
      { body1: Body.Mercury, body2: Body.Saturn },
      { body1: Body.Venus, body2: Body.Mars }
    ];
    
    const aspects = aspectConfigs
      .map(({ body1, body2 }) => calculateAspects(body1, body2, date, observer))
      .filter((aspect) => aspect !== null);
    
    // Get retrograde status for personal planets
    const planets = [Body.Mercury, Body.Venus, Body.Mars];
    const retrogradeStatus = planets.map(planet => getRetrogradeStatus(planet, date));
    
    // Calculate planet positions
    const planetsList = [
      Body.Sun, Body.Moon, Body.Mercury, 
      Body.Venus, Body.Mars, Body.Jupiter, 
      Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto
    ];
    
    const positions = planetsList.map(planet => {
      const lon = getEclipticLongitude(planet, date, observer);
      return {
        planet: getPlanetName(planet),
        longitude: lon,
        sign: getZodiacSign(lon),
        degree: Math.floor(lon % 30),
        minute: Math.floor((lon % 1) * 60)
      };
    });
    
    // Prepare response
    const response = {
      date: date.toISOString().split('T')[0],
      query_time: new Date().toISOString(),
      sun: {
        sign: sunSign,
        longitude: sunLon,
        degree: Math.floor(sunLon % 30),
        minute: Math.floor((sunLon % 1) * 60)
      },
      moon: {
        sign: moonSign,
        longitude: moonLon,
        phase: moonPhase,
        phase_name: moonPhaseName,
        degree: Math.floor(moonLon % 30),
        minute: Math.floor((moonLon % 1) * 60)
      },
      positions,
      aspects,
      retrograde: retrogradeStatus
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

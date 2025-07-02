import express from 'express';
import { getMoonPhase, getPlanetPositions, getZodiacSign, calculatePlanetaryPositions } from './src/lib/astroCalculations.js';
import unifiedAstroHandler from './api/unified-astro.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the news data directory
const NEWS_DATA_DIR = path.join(__dirname, 'public/news/data');

const app = express();
const port = 3001; // Changed to match Vite proxy configuration

// Configure middleware to parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEPRECATED: /astro-date endpoint removed. Use /api/astro/:date instead.
/*
app.get('/astro-date', (req, res) => {
  try {
    const now = new Date();
    const positions = getPlanetPositions(now);
    
    const response = {
      date: now.toISOString(),
      moonPhase: getMoonPhase(now),
      positions: Object.entries(positions).map(([planet, pos]) => ({
        planet,
        ...pos,
        sign: getZodiacSign(pos.longitude)
      }))
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/

// Root endpoint
app.get('/', (req, res) => {
  res.send('Full Moon Odds API is running');
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API endpoint for planetary positions
app.post('/api/astrology/positions', async (req, res) => {
  try {
    const { year, month, day, hour = 12, minute = 0, latitude = 40.7128, longitude = -74.0060, timezoneOffset } = req.body;

    // Validate required fields
    if (year === undefined || month === undefined || day === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: year, month, and day are required' 
      });
    }

    console.log('Raw request body:', req.body);
    // Validate required fields
    if (!req.body.year || !req.body.month || !req.body.day || !req.body.hour || !req.body.minute || !req.body.latitude || !req.body.longitude) {
      return res.status(400).json({ error: 'Missing required birth data fields.' });
    }

    console.log('Parsed birth data fields:', { year: req.body.year, month: req.body.month, day: req.body.day, hour: req.body.hour, minute: req.body.minute, latitude: req.body.latitude, longitude: req.body.longitude, timezoneOffset: req.body.timezoneOffset });

    // Create birth data object
    const birthData = {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: parseInt(minute),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezoneOffset: typeof timezoneOffset === 'number' ? parseInt(timezoneOffset) : undefined
    };

    // Calculate planetary positions with enhanced data
    const chartData = await calculatePlanetaryPositions(birthData);

    res.json(chartData);

  } catch (error) {
    console.error('Error in astrology calculation:', error);
    res.status(500).json({ 
      error: 'Failed to calculate astrological positions',
      details: error.message 
    });
  }
});



// Unified astrology endpoint - serves both Dashboard and Players pages
app.get(['/api/unified-astro/:date', '/api/unified-astro'], (req, res) => {
  try {
    // Call the unified handler
    unifiedAstroHandler(req, res);
  } catch (error) {
    console.error('Error in unified-astro endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Maintain sidereal-astro endpoint for backward compatibility
app.get(['/api/sidereal-astro/:date', '/api/sidereal-astro'], (req, res) => {
  try {
    // Redirect to unified handler
    unifiedAstroHandler(req, res);
  } catch (error) {
    console.error('Error in sidereal-astro endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Main API endpoint for astro data - supports both URL param (/api/astro/:date) and query param (/api/astro?date=)
app.get(['/api/astro/:date', '/api/astro'], (req, res) => {
  try {
    // Get date from either path param or query param
    let dateParam = req.params.date || req.query.date;
    
    // If date is missing or invalid, use today's date
    if (!dateParam || typeof dateParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dateParam = new Date().toISOString().split('T')[0];
    }
    
    const targetDate = new Date(dateParam);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    // Get astrological data
    const moonPhase = getMoonPhase(targetDate);
    const positions = getPlanetPositions(targetDate);
    
    // Generate celestial events (simplified example)
    const celestialEvents = [
      {
        name: 'Full Moon',
        description: 'Full Moon in Scorpio - A time for release and transformation.',
        intensity: 'high',
        date: new Date(targetDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Mercury Square Mars',
        description: 'Heightened communication and potential conflicts.',
        intensity: 'medium',
        date: new Date(targetDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Return the data
    res.json({
      moon_phase: moonPhase,
      positions: {
        moon: { 
          longitude: positions.moon.longitude, 
          speed: positions.moon.speed 
        },
        sun: { 
          longitude: positions.sun.longitude 
        },
        mercury: { 
          longitude: positions.mercury.longitude, 
          speed: positions.mercury.speed 
        },
        venus: { 
          longitude: positions.venus.longitude 
        },
        mars: { 
          longitude: positions.mars.longitude 
        },
        jupiter: { 
          longitude: positions.jupiter.longitude 
        },
        saturn: { 
          longitude: positions.saturn.longitude 
        }
      },
      celestial_events: celestialEvents
    });
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ 
      error: 'Failed to fetch astrological data',
      details: error.message,
    });
  }
});

// Enhanced astrological data endpoint
app.get(['/api/astro-enhanced/:date', '/api/astro-enhanced'], (req, res) => {
  try {
    // Get date from either path param or query param
    let dateParam = req.params.date || req.query.date;
    
    // If date is missing or invalid, use today's date
    if (!dateParam || typeof dateParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dateParam = new Date().toISOString().split('T')[0];
    }
    
    const targetDate = new Date(dateParam);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    // Get astrological data
    const moonPhase = getMoonPhase(targetDate);
    const positions = getPlanetPositions(targetDate);
    const moonSign = getZodiacSign(positions.moon.longitude);
    const sunSign = getZodiacSign(positions.sun.longitude);
    
    // Calculate aspects between planets
    const aspects = calculateAspects(positions);
    
    // Enhanced elements and modalities calculations
    const elements = calculateElements(positions);
    const modalities = calculateModalities(positions);
    
    // Calculate houses using astronomia
    const jd = julian.Date.toJulian(targetDate);
    const lat = 40.7128; // Default to NYC latitude
    const lon = -74.0060; // Default to NYC longitude
    
    // Calculate sidereal time (in hours)
    const st = sidereal.apparent(jd);
    
    // Calculate house cusps using Placidus system
    const hsys = 'P'; // 'P' for Placidus, 'K' for Koch, etc.
    const cusps = houses(jd, lat, lon, hsys);
    
    // Get the MC (Medium Coeli - 10th house cusp)
    const mc = cusps[9]; // 10th house is at index 9 (0-based)
    
    // Calculate Ascendant (1st house cusp)
    const asc = cusps[0];
    
    // Calculate IC (4th house cusp) and DC (7th house cusp)
    const ic = (cusps[3] + 180) % 360; // Opposite of MC
    const dc = (asc + 180) % 360; // Opposite of Ascendant
    
    const housesData = {
      system: 'placidus',
      cusps: cusps.map(cusp => parseFloat(cusp.toFixed(6))),
      angles: {
        asc: parseFloat(asc.toFixed(6)),
        mc: parseFloat(mc.toFixed(6)),
        dsc: parseFloat(dc.toFixed(6)),
        ic: parseFloat(ic.toFixed(6))
      }
    };
    
    // Prepare planets object with expanded info
    const planetsExtended = {};
    for (const [planet, pos] of Object.entries(positions)) {
      const sign = getZodiacSign(pos.longitude);
      const degree = pos.longitude % 30;
      planetsExtended[planet] = {
        name: planet,
        longitude: pos.longitude,
        sign,
        degree: Math.floor(degree),
        retrograde: pos.speed < 0,
        speed: pos.speed,
        // Placeholder house assignment (would need real calc)
        house: Math.floor(pos.longitude / 30) % 12 + 1
      };
    }
    
    // Current hour calculation (simplified)
    const currentHour = {
      ruler: ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'][new Date().getHours() % 7],
      influence: 'A time for action and new beginnings',
      sign: sunSign, // Using sun sign as a placeholder
      is_positive: Math.random() > 0.3 // 70% chance of being positive
    };

    // Next celestial event (simplified)
    const nextEvent = {
      name: 'Full Moon in ' + moonSign,
      date: new Date(targetDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'A time of completion and manifestation',
      intensity: 'high',
      type: 'full_moon',
      sign: moonSign
    };

    // Return enhanced data with current_hour and next_event
    res.json({
      date: dateParam,
      query_time: new Date().toISOString(),
      observer: {
        latitude: 40.7128, // NYC coordinates by default
        longitude: -74.0060,
        timezone: 'America/New_York'
      },
      sun: {
        sign: sunSign,
        longitude: positions.sun.longitude,
        degree: Math.floor(positions.sun.longitude % 30),
      },
      moon: {
        sign: moonSign,
        longitude: positions.moon.longitude,
        phase: moonPhase,
        phase_name: getMoonPhaseName(moonPhase),
        degree: Math.floor(positions.moon.longitude % 30),
        retrograde: positions.moon.speed < 0,
        illumination: Math.sin(moonPhase * Math.PI) // Add illumination calculation
      },
      mercury: {
        sign: getZodiacSign(positions.mercury.longitude),
        degree: Math.floor(positions.mercury.longitude % 30),
        retrograde: positions.mercury.speed < 0,
        speed: positions.mercury.speed
      },
      current_hour: currentHour,
      next_event: nextEvent,
      lunar_nodes: {
        north_node: {
          sign: 'Taurus',
          degree: 15,
          house: 2
        },
        south_node: {
          sign: 'Scorpio',
          degree: 15,
          house: 8
        },
        next_transit: {
          type: 'lunar_node',
          sign: 'Aries',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'North Node enters Aries'
        },
        karmic_lessons: [
          'Learning to value stability and tangible results',
          'Releasing obsessive or controlling behaviors'
        ]
      },
      positions: Object.entries(positions).map(([planet, pos]) => ({
        planet,
        longitude: pos.longitude,
        sign: getZodiacSign(pos.longitude),
        degree: Math.floor(pos.longitude % 30),
        retrograde: pos.speed < 0
      })),
      aspects,
      houses: housesData,
      elements,
      modalities,
      planets: planetsExtended
    });
  } catch (error) {
    console.error('Error in Enhanced API handler:', error);
    res.status(500).json({ 
      error: 'Failed to fetch enhanced astrological data',
      details: error.message,
    });
  }
});

// Helper function to calculate aspects between planets
function calculateAspects(positions) {
  const aspectTypes = {
    conjunction: { min: 0, max: 10, influence: 'strong' },
    sextile: { min: 55, max: 65, influence: 'harmonious' },
    square: { min: 85, max: 95, influence: 'challenging' },
    trine: { min: 115, max: 125, influence: 'beneficial' },
    opposition: { min: 175, max: 185, influence: 'intense' }
  };
  
  const aspects = [];
  const planets = Object.keys(positions);
  
  // Also calculate aspect pairs for direct lookup (e.g. sun_mars)
  const aspectPairs = {};
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      // Skip if same planet
      if (planet1 === planet2) continue;
      
      const p1Pos = positions[planet1].longitude;
      const p2Pos = positions[planet2].longitude;
      
      // Calculate angle between planets
      let angle = Math.abs(p1Pos - p2Pos);
      if (angle > 180) angle = 360 - angle;
      
      // Store the angle for direct lookup
      aspectPairs[`${planet1}_${planet2}`] = angle.toFixed(1);
      
      // Check if it matches any aspect type
      for (const [type, range] of Object.entries(aspectTypes)) {
        if (angle >= range.min && angle <= range.max) {
          aspects.push({
            name: `${planet1}_${planet2}`,
            aspect: type,
            orb: Math.abs(angle - (range.min + range.max) / 2),
            influence: range.influence
          });
          break;
        }
      }
    }
  }
  
  return aspectPairs;
}

// Helper to calculate element strengths
function calculateElements(positions) {
  const elementSigns = {
    fire: ['Aries', 'Leo', 'Sagittarius'],
    earth: ['Taurus', 'Virgo', 'Capricorn'],
    air: ['Gemini', 'Libra', 'Aquarius'],
    water: ['Cancer', 'Scorpio', 'Pisces']
  };
  
  const elements = {
    fire: { score: 0, planets: [] },
    earth: { score: 0, planets: [] },
    air: { score: 0, planets: [] },
    water: { score: 0, planets: [] }
  };
  
  for (const [planet, pos] of Object.entries(positions)) {
    const sign = getZodiacSign(pos.longitude);
    
    for (const [element, signs] of Object.entries(elementSigns)) {
      if (signs.includes(sign)) {
        // Add weighted score based on planet
        let weight = 1;
        if (planet === 'sun' || planet === 'moon') weight = 3;
        if (planet === 'mercury' || planet === 'venus' || planet === 'mars') weight = 2;
        
        elements[element].score += weight;
        elements[element].planets.push(planet);
        break;
      }
    }
  }
  
  return elements;
}

// Helper to calculate modality strengths (cardinal, fixed, mutable)
function calculateModalities(positions) {
  const modalitySigns = {
    cardinal: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
    fixed: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
    mutable: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']
  };
  
  const modalities = {
    cardinal: { score: 0, planets: [] },
    fixed: { score: 0, planets: [] },
    mutable: { score: 0, planets: [] }
  };
  
  for (const [planet, pos] of Object.entries(positions)) {
    const sign = getZodiacSign(pos.longitude);
    
    for (const [modality, signs] of Object.entries(modalitySigns)) {
      if (signs.includes(sign)) {
        let weight = 1;
        if (planet === 'sun' || planet === 'moon') weight = 3;
        if (planet === 'mercury' || planet === 'venus' || planet === 'mars') weight = 2;
        
        modalities[modality].score += weight;
        modalities[modality].planets.push(planet);
        break;
      }
    }
  }
  
  return modalities;
}

// Helper to get moon phase name
function getMoonPhaseName(phase) {
  if (phase === 0) return 'New Moon';
  if (phase < 0.25) return 'Waxing Crescent';
  if (phase === 0.25) return 'First Quarter';
  if (phase < 0.5) return 'Waxing Gibbous';
  if (phase === 0.5) return 'Full Moon';
  if (phase < 0.75) return 'Waning Gibbous';
  if (phase === 0.75) return 'Last Quarter';
  return 'Waning Crescent';
}

// News API Endpoint to serve generated articles
app.get('/api/news', async (req, res) => {
  try {
    const indexPath = path.join(NEWS_DATA_DIR, 'index.json');
    
    // Check if the index file exists
    try {
      await fs.access(indexPath);
    } catch (error) {
      return res.status(404).json({
        articles: [],
        message: "No news articles found. Run the generate:news script first."
      });
    }
    
    // Read the index file
    const indexData = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    if (!indexData.articles || !Array.isArray(indexData.articles)) {
      return res.status(500).json({
        error: "Invalid news data format"
      });
    }
    
    // Return the articles
    return res.status(200).json(indexData);
    
  } catch (error) {
    console.error('Error in /api/news:', error);
    return res.status(500).json({
      error: "Failed to fetch news articles",
      details: error.message
    });
  }
});

// News article detail API endpoint
app.get('/api/news/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Article slug is required" });
    }
    
    const articlePath = path.join(NEWS_DATA_DIR, `${slug}.json`);
    
    // Check if the article file exists
    try {
      await fs.access(articlePath);
    } catch (error) {
      return res.status(404).json({
        error: "Article not found",
        message: `No article found with slug: ${slug}`
      });
    }
    
    // Read the article file
    const articleData = JSON.parse(await fs.readFile(articlePath, 'utf8'));
    
    // Return the article data
    return res.status(200).json(articleData);
    
  } catch (error) {
    console.error(`Error in /api/news/:slug:`, error);
    return res.status(500).json({
      error: "Failed to fetch article",
      details: error.message
    });
  }
});

// Debug endpoint to test planetary calculations directly
app.get('/api/debug/planets', async (req, res) => {
  try {
    const testBirthData = {
      year: 2009,
      month: 3,
      day: 11,
      hour: 3,
      minute: 5,
      city: 'Kissimmee',
      latitude: 28.2917,
      longitude: -81.4076,
      timezoneOffset: 240
    };
    
    console.log('Debug endpoint calculating positions for:', testBirthData);
    const positions = await astroCalculations.calculatePlanetaryPositions(testBirthData);
    
    // Log the raw positions for debugging
    console.log('DEBUG ENDPOINT - Raw planetary positions:');
    positions.planets.forEach(planet => {
      console.log(`${planet.name}: ${planet.angle}° (${planet.sign}) in house ${planet.house}`);
    });
    
    res.json({
      message: 'Debug planetary positions',
      data: positions
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
console.log('About to start API server on port:', port);
const server = app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
  console.log('Server is now listening for requests');
});

// Add error handler
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

console.log('Server setup complete');

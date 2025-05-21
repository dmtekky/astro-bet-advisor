import express from 'express';
import { getMoonPhase, getPlanetPositions, getZodiacSign } from './src/lib/astroCalculations.js';

const app = express();
const port = 3001; // Changed to match Vite proxy configuration

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
  res.send('Astro Bet Advisor API is running');
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
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

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});

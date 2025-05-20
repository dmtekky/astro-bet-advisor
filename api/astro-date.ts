import { VercelRequest, VercelResponse } from '@vercel/node';
import { getMoonPhase, getPlanetPositions } from '../src/lib/astroCalculations';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get date from query params or use current date
    const dateParam = req.query.date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(Array.isArray(dateParam) ? dateParam[0] : dateParam);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    // Get astrological data
    const moonPhase = getMoonPhase(targetDate);
    const positions = getPlanetPositions(targetDate);
    
    // Mock celestial events
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
    res.status(200).json({
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
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {})
    });
  }
}

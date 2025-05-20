import { VercelRequest, VercelResponse } from '@vercel/node';
import { getMoonPhase, getPlanetPositions, getZodiacSign } from '../src/lib/astroCalculations';

interface PlanetPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
}

interface PlanetPositions {
  [key: string]: PlanetPosition;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('Received request with query params:', req.query);

    // Get date from query params or use current date
    const dateParam = req.query.date || new Date().toISOString().split('T')[0];
    const dateStr = Array.isArray(dateParam) ? dateParam[0] : dateParam;
    
    if (typeof dateStr !== 'string') {
      return res.status(400).json({ error: 'Invalid date parameter' });
    }

    const targetDate = new Date(dateStr);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        message: 'Please use YYYY-MM-DD format',
        received: dateStr
      });
    }

    console.log('Processing date:', targetDate.toISOString());

    // Get astrological data
    console.log('Calculating moon phase...');
    const moonPhase = getMoonPhase(targetDate);
    
    console.log('Calculating planet positions...');
    const positions = getPlanetPositions(targetDate) as PlanetPositions;
    
    // Get zodiac signs for each planet
    const signs = Object.entries(positions).reduce<Record<string, string>>((acc, [planet, data]) => {
      return {
        ...acc,
        [planet]: getZodiacSign(data.longitude)
      };
    }, {});
    
    console.log('Zodiac signs calculated:', signs);
    
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

    console.log('Sending response...');
    
    // Return the data
    return res.status(200).json({
      success: true,
      date: targetDate.toISOString(),
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
      celestial_events: celestialEvents,
      signs: signs
    });

  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch astrological data',
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {})
    });
  }
}

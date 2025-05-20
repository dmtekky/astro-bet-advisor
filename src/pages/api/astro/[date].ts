import { NextApiRequest, NextApiResponse } from 'next';
import { getMoonPhase, getPlanetPositions } from '@/lib/astroCalculations';

// Helper function to handle CORS
const allowCors = (fn: Function) => async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-V'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return await fn(req, res);
};

// Mock data for celestial events (replace with real data)
const getCelestialEvents = (date: Date) => [
  {
    name: 'Full Moon',
    description: 'Full Moon in Scorpio - A time for release and transformation.',
    intensity: 'high' as const,
    date: new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Mercury Square Mars',
    description: 'Heightened communication and potential conflicts.',
    intensity: 'medium' as const,
    date: new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query;
  
  try {
    console.log('Received request for date:', date);
    
    // Parse the date from the URL parameter or use current date
    const targetDate = date ? new Date(Array.isArray(date) ? date[0] : date) : new Date();
    
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD');
    }

    console.log('Calculating moon phase...');
    // Get moon phase (0-1)
    const moonPhase = getMoonPhase(targetDate);
    
    console.log('Getting planet positions...');
    // Get planet positions
    const positions = getPlanetPositions(targetDate);
    
    console.log('Getting celestial events...');
    // Get celestial events
    const celestialEvents = getCelestialEvents(targetDate);

    console.log('Sending response...');
    // Return the data in the expected format
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
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}

export default allowCors(handler);

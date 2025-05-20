// @ts-check
// Import runtime functionality
import vercel from '@vercel/node';
import { getMoonPhase, getPlanetPositions } from '../../src/lib/astroCalculations.js';

// Use JSDoc for type imports
/** @typedef {import('@vercel/node').VercelRequest} VercelRequest */
/** @typedef {import('@vercel/node').VercelResponse} VercelResponse */

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
function handler(req, res) {
  // Try to get date from query or RESTful path
  let dateParam = req.query.date;
  if (!dateParam && req.url) {
    const match = req.url.match(/\/api\/astro\/(\d{4}-\d{2}-\d{2})/);
    if (match) dateParam = match[1];
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  // Set cache headers for scalability
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Validate and clean date parameter
    let targetDate;
    if (dateParam) {
      // Remove any time component and ensure YYYY-MM-DD format
      const dateStr = dateParam.toString().split('T')[0];
      targetDate = new Date(dateStr);
      
      if (isNaN(targetDate.getTime())) {
        console.error('Invalid date received:', dateParam);
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
      }
      
      // Use the cleaned date string for consistency
      dateParam = dateStr;
    } else {
      // Use current date if no date parameter
      targetDate = new Date();
      dateParam = targetDate.toISOString().split('T')[0];
    }

    // Get moon phase (0-1)
    const moonPhase = getMoonPhase(targetDate);
    
    // Get planet positions
    const positions = getPlanetPositions(targetDate);
    
    // Mock celestial events
    /** @type {Array<{name: string, description: string, intensity: 'low'|'medium'|'high', date: string}>} */
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
    console.error('Astro API error:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Failed to fetch astrological data', details: error && error.message ? error.message : String(error) });
  }
}

export default handler;

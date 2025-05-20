import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the date from the URL or use current date
    const dateParam = req.query.date;
    let dateStr: string;

    if (Array.isArray(dateParam)) {
      // Handle array case (shouldn't happen with proper routing)
      const match = dateParam[0]?.match(/^(\d{4}-\d{2}-\d{2})/);
      dateStr = match ? match[1] : new Date().toISOString().split('T')[0];
    } else if (typeof dateParam === 'string') {
      const match = dateParam.match(/^(\d{4}-\d{2}-\d{2})/);
      dateStr = match ? match[1] : new Date().toISOString().split('T')[0];
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }

    // Mock data - in a real app, you would fetch this from your database
    const celestialEvents = [
      {
        name: 'Full Moon',
        description: 'Full Moon in Scorpio - A time for release and transformation.',
        intensity: 'high',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Mercury Square Mars',
        description: 'Heightened communication and potential conflicts.',
        intensity: 'medium',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const response = {
      success: true,
      date: dateStr,
      moon_phase: 0.75, // 0 = new moon, 1 = full moon
      positions: {
        moon: { 
          longitude: 90, 
          speed: 12.2,
          sign: 'Scorpio',
          phase: 'Waxing Gibbous'
        },
        sun: { 
          longitude: 45,
          sign: 'Taurus'
        },
        mercury: { 
          longitude: 30, 
          speed: 1.2,
          retrograde: false,
          sign: 'Gemini'
        },
        venus: { 
          longitude: 120,
          sign: 'Cancer'
        },
        mars: { 
          longitude: 200,
          speed: 0.5,
          sign: 'Aries'
        },
        jupiter: { 
          longitude: 150,
          sign: 'Pisces'
        },
        saturn: { 
          longitude: 300,
          sign: 'Aquarius'
        }
      },
      celestial_events: celestialEvents,
      next_event: celestialEvents[0] || null,
      aspects: {
        sun_moon: 'trine',
        mercury_venus: 'conjunction',
        mars_jupiter: 'sextile',
        saturn_pluto: 'square'
      },
      elements: {
        fire: 3,
        earth: 2,
        air: 1,
        water: 1
      }
    };

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

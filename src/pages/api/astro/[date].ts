import type { APIRoute } from 'astro';
import { getMoonPhase, getPlanetPositions } from '../../../lib/astroCalculations.js';

export const prerender = false; // Ensure this is serverless, not static

export const GET: APIRoute = async ({ params, request }) => {
  let { date } = params;
  // Strictly extract only YYYY-MM-DD, ignore trailing chars (e.g., :1)
  const match = typeof date === 'string' ? date.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})/) : null;
  const dateStr = match ? match[1] : new Date().toISOString().split('T')[0];

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    return new Response(
      JSON.stringify({ error: 'Invalid date format. Please use YYYY-MM-DD' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Example: get moon phase and planet positions
  const moonPhase = getMoonPhase(targetDate);
  const positions = getPlanetPositions(targetDate);

  // Mock celestial events (replace with real logic as needed)
  const celestialEvents = [
    {
      name: 'Full Moon',
      description: 'Full Moon in Scorpio - A time for release and transformation.',
      intensity: 'high',
      date: new Date(targetDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return new Response(
    JSON.stringify({
      moon_phase: moonPhase,
      positions,
      celestial_events: celestialEvents
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
};
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Get the date from the URL or use current date
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`[${new Date().toISOString()}] Request for date:`, targetDate);

    // Return test data in the expected format
    const response = {
      success: true,
      moon_phase: 0.75, // 0 = new moon, 1 = full moon
      positions: {
        moon: { 
          longitude: 90, 
          speed: 12.2 
        },
        sun: { 
          longitude: 45 
        },
        mercury: { 
          longitude: 30, 
          speed: 1.2 
        },
        venus: { 
          longitude: 120 
        },
        mars: { 
          longitude: 200,
          speed: 0.5
        },
        jupiter: { 
          longitude: 150 
        },
        saturn: { 
          longitude: 300 
        }
      },
      celestial_events: [
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
      ]
    };

    // Add next_event (first upcoming event or null)
    const nextEvent = response.celestial_events[0] || null;
    
    return res.status(200).json({
      ...response,
      next_event: nextEvent
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

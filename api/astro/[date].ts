import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data for demonstration
const mockAstroData = (date: string) => ({
  moon: {
    phase: 'Waxing Gibbous',
    phaseValue: 0.75,
    sign: 'Scorpio',
    icon: '♏️'
  },
  sun: {
    sign: 'Taurus',
    icon: '♉️',
    degree: 15
  },
  mercury: {
    retrograde: false,
    sign: 'Taurus',
    degree: 10
  },
  venus: {
    sign: 'Gemini',
    degree: 20
  },
  mars: {
    sign: 'Leo',
    degree: 5
  },
  jupiter: {
    sign: 'Pisces',
    degree: 25
  },
  saturn: {
    sign: 'Aquarius',
    degree: 18
  },
  aspects: {
    sunMars: 'trine',
    sunJupiter: 'sextile',
    sunSaturn: 'square',
    moonVenus: 'conjunction',
    marsJupiter: 'trine',
    venusMars: 'sextile'
  },
  elements: {
    fire: 30,
    earth: 40,
    air: 20,
    water: 10
  },
  currentHour: {
    ruler: 'Mars',
    influence: 'Energy and action are favored',
    sign: 'Aries'
  },
  lunarNodes: {
    northNode: {
      sign: 'Gemini',
      degree: 12
    },
    southNode: {
      sign: 'Sagittarius',
      degree: 12
    },
    nextTransitDate: '2025-06-15',
    nextTransitType: 'north',
    nextTransitSign: 'Gemini',
    upcomingTransits: [
      {
        date: '2025-06-15',
        type: 'north',
        sign: 'Gemini',
        degree: 12
      }
    ]
  },
  fixedStars: [
    {
      name: 'Sirius',
      magnitude: -1.46,
      influence: 'Success and fame',
      position: {
        sign: 'Cancer',
        degree: 14
      }
    }
  ],
  celestialEvents: [
    {
      name: 'Full Moon',
      description: 'Full Moon in Sagittarius',
      intensity: 'high',
      date: '2025-05-25'
    }
  ],
  next_event: {
    name: 'Mercury Retrograde',
    description: 'Mercury goes retrograde in Gemini',
    intensity: 'high',
    date: '2025-06-10'
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

    // In a real app, you would fetch this data from your database or an external API
    const response = {
      success: true,
      date: dateStr,
      ...mockAstroData(dateStr)
    };

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

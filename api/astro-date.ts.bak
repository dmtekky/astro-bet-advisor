import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Example: /api/astro-date?date=2025-05-20
  const { date } = req.query;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    success: true,
    moon_phase: 0.75,
    positions: {
      moon: { longitude: 90, speed: 12.2 },
      sun: { longitude: 45 },
      mercury: { longitude: 30, speed: 1.2 },
      venus: { longitude: 120 },
      mars: { longitude: 200, speed: 0.5 },
      jupiter: { longitude: 150 },
      saturn: { longitude: 300 }
    },
    celestial_events: [
      {
        name: 'Full Moon',
        description: 'Full Moon in Scorpio - A time for release and transformation.',
        intensity: 'high',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    next_event: {
      name: 'Full Moon',
      description: 'Full Moon in Scorpio - A time for release and transformation.',
      intensity: 'high',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
}

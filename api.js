import express from 'express';
import { getMoonPhase, getPlanetPositions, getZodiacSign } from './src/lib/astroCalculations.js';

const app = express();
const port = 3000;

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

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});

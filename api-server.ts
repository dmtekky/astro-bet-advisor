import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { calculatePlanetaryPositions } from './src/lib/astrologyCalculations.ts';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// API endpoint for planetary positions
app.post('/api/astrology/positions', async (req, res) => {
  try {
    const birthData = req.body;
    
    // Validate birth data
    if (!birthData || !birthData.year || !birthData.month || !birthData.day || !birthData.hour || !birthData.minute) {
      return res.status(400).json({ error: 'Invalid birth data' });
    }
    
    // Calculate planetary positions
    const positions = await calculatePlanetaryPositions(birthData);
    
    console.log('Calculated positions:', positions);
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error calculating positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Simple API server using CommonJS syntax
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

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

// Mock planetary positions data for testing
const mockPlanetaryData = {
  sun: { name: 'Sun', longitude: 0, sign: 'Aries' },
  moon: { name: 'Moon', longitude: 180, sign: 'Libra' },
  mercury: { name: 'Mercury', longitude: 120, sign: 'Leo' },
  venus: { name: 'Venus', longitude: 90, sign: 'Cancer' },
  mars: { name: 'Mars', longitude: 60, sign: 'Gemini' },
  jupiter: { name: 'Jupiter', longitude: 0, sign: 'Aries' },
  saturn: { name: 'Saturn', longitude: 150, sign: 'Virgo' },
  uranus: { name: 'Uranus', longitude: 210, sign: 'Scorpio' },
  neptune: { name: 'Neptune', longitude: 240, sign: 'Sagittarius' },
  pluto: { name: 'Pluto', longitude: 270, sign: 'Capricorn' },
  chiron: { name: 'Chiron', longitude: 300, sign: 'Aquarius' }
};

// API endpoint for planetary positions
app.post('/api/astrology/positions', async (req, res) => {
  try {
    const birthData = req.body;
    
    // Validate birth data
    if (!birthData || !birthData.year || !birthData.month || !birthData.day || !birthData.hour || !birthData.minute) {
      return res.status(400).json({ error: 'Invalid birth data' });
    }
    
    console.log('Received birth data:', birthData);
    
    // Return mock planetary positions for now
    // In a real implementation, this would call the actual calculation function
    res.status(200).json(mockPlanetaryData);
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

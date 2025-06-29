// Using ES module imports
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { calculatePlanetaryPositions } from './src/lib/astrologyCalculations.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('API server is running');
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Catch-all route for 404s
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.url} not found` });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Test the server: curl http://localhost:${PORT}/`);
  console.log(`Health check: curl http://localhost:${PORT}/api/health`);
});

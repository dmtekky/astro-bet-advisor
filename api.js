import express from 'express';
import { calculatePlanetaryPositions } from './src/lib/astroCalculations.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the unified-astro handler
const unifiedAstroPath = path.join(__dirname, 'api', 'unified-astro.js');
const unifiedAstroHandler = await import(unifiedAstroPath);

// Process-level error handlers
process.on('uncaughtException', (err, origin) => {
  console.error(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const port = 3001;

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

// Add unified-astro endpoint
app.get('/api/unified-astro', async (req, res) => {
  console.log('Received request for /api/unified-astro, forwarding to handler');
  try {
    // Create a mock request object that matches what the handler expects
    const mockReq = {
      query: req.query,
      headers: req.headers,
      method: req.method
    };
    
    // Call the unified-astro handler
    await unifiedAstroHandler.default(mockReq, res);
  } catch (error) {
    console.error('Error in unified-astro endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Full Moon Odds API is running');
});

// API endpoint for planetary positions
app.post('/api/astrology/positions', async (req, res) => {
  try {
    const birthData = req.body;
    console.log('Calculating planetary positions for:', birthData);

    if (!birthData || !birthData.year || !birthData.month || !birthData.day || !birthData.hour || !birthData.minute) {
      return res.status(400).json({ error: 'Invalid birth data' });
    }

    const astroChartData = await calculatePlanetaryPositions(birthData);

    console.log('Raw astroChartData from calculations:', JSON.stringify({
      planets: astroChartData.planets && astroChartData.planets.length,
      cusps: astroChartData.cusps,
      ascendant: astroChartData.ascendant
    }));

    const responseObject = {
      cusps: astroChartData.cusps,
      astroChartData: astroChartData,
      planets: astroChartData.planets,
      houses: astroChartData.houses,
      ascendant: astroChartData.ascendant,
      latitude: astroChartData.latitude,
      longitude: astroChartData.longitude,
      birthDate: astroChartData.birthDate,
      birthTime: astroChartData.birthTime
    };

    console.log('API Response Keys:', Object.keys(responseObject));
    if (responseObject.cusps) {
      console.log('API Response Cusps Sample:', responseObject.cusps.slice(0, 3) + '... (total: ' + responseObject.cusps.length + ')');
    }

    res.status(200).json(responseObject);
  } catch (error) {
    console.error('Error calculating positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});

import type { NextApiRequest, NextApiResponse } from 'next';
import { calculatePlanetaryPositions } from '@/lib/astroCalculations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use hardcoded test data
    const testBirthData = {
      year: 2009,
      month: 6,
      day: 8,
      hour: 11,
      minute: 5,
      latitude: 26.2034,
      longitude: -98.23,
      timezoneOffset: new Date().getTimezoneOffset() // Current timezone offset
    };
    
    // Calculate planetary positions
    const astroChartData = await calculatePlanetaryPositions(testBirthData);
    
    // Return data in the format expected by the frontend
    const responseData = {
      // New format for AstroChart
      ...astroChartData,
      
      // Backward compatibility with existing frontend code
      planets: astroChartData.planets.map(p => ({
        name: p.label,
        sign: p.sign,
        angle: p.degree,
        symbol: p.symbol
      })),
      houses: astroChartData.cusps.map((cusp, index) => ({
        cusp: cusp,
        number: index + 1
      })),
      latitude: testBirthData.latitude,
      longitude: testBirthData.longitude,
      ascendant: astroChartData.ascendant,
      birthDate: `${testBirthData.year}-${String(testBirthData.month).padStart(2, '0')}-${String(testBirthData.day).padStart(2, '0')}`,
      
      // CRITICAL: Make sure cusps are included in the top-level for the frontend
      cusps: astroChartData.cusps
    };
    
    console.log('TEST API RESPONSE - Original astroChartData:', JSON.stringify(astroChartData, null, 2));
    console.log('TEST API RESPONSE - Cusps from astronomia:', astroChartData.cusps);
    console.log('TEST API RESPONSE - Final responseData:', JSON.stringify(responseData, null, 2));
    console.log('TEST API RESPONSE - Houses in responseData:', JSON.stringify(responseData.houses, null, 2));
    console.log('TEST API RESPONSE - Cusps in responseData:', JSON.stringify(responseData.cusps, null, 2));
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in test-cusps API:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

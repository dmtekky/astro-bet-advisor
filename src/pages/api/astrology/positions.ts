import type { NextApiRequest, NextApiResponse } from 'next';
import { calculatePlanetaryPositions } from '@/lib/astroCalculations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const birthData = req.body;
    console.log('API received birth data:', birthData);
    
    // Validate birth data with detailed error messages
    const missingFields: string[] = [];
    
    if (!birthData) {
      return res.status(400).json({ error: 'No birth data provided' });
    }
    
    if (!birthData.year) missingFields.push('year');
    if (!birthData.month) missingFields.push('month');
    if (!birthData.day) missingFields.push('day');
    if (!birthData.hour && birthData.hour !== 0) missingFields.push('hour');
    if (!birthData.minute && birthData.minute !== 0) missingFields.push('minute');
    if (!birthData.latitude && birthData.latitude !== 0) missingFields.push('latitude');
    if (!birthData.longitude && birthData.longitude !== 0) missingFields.push('longitude');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Invalid birth data: missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Type validation
    if (typeof birthData.year !== 'number' || 
        typeof birthData.month !== 'number' || 
        typeof birthData.day !== 'number' || 
        typeof birthData.hour !== 'number' || 
        typeof birthData.minute !== 'number' || 
        typeof birthData.latitude !== 'number' || 
        typeof birthData.longitude !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid birth data: all fields must be numbers' 
      });
    }
    
    // Calculate planetary positions
    const positions = await calculatePlanetaryPositions(birthData);
    
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error calculating positions:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { calculatePlanetaryPositions } from '@/lib/astrologyCalculations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}

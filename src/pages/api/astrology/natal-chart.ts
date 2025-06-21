import type { NextApiRequest, NextApiResponse } from 'next';
import { calculatePlanetaryPositions } from '@/lib/astroCalculations';

// Debug: Log when the module is loaded
console.log('Natal chart API route loaded at:', new Date().toISOString());

type BirthDetails = {
  birthDate: string;
  birthTime?: string;
  birthLocation?: string;
};

type PlanetPosition = {
  name: string;
  symbol: string;
  sign: string;
  angle: number;
  house: number;
};

type Aspect = {
  planet1: string;
  planet2: string;
  angle: number;
  type: string;
};

type ApiResponse = {
  positions: PlanetPosition[];
  aspects: Aspect[];
  timestamp?: string;
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  console.log('Request received at:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    console.log('Method not allowed. Only POST is supported.');
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { birthDate, birthTime = '12:00', birthLocation = 'Unknown' }: BirthDetails = req.body;
    
    console.log('Processing request with data:', { birthDate, birthTime, birthLocation });
    
    // Validate input
    if (!birthDate) {
      console.log('Validation failed: birthDate is required');
      return res.status(400).json({ error: 'Birth date is required' });
    }

    // Calculate planetary positions
    console.log('Calculating planetary positions...');
    const positions = await calculatePlanetaryPositions(birthDate, birthTime, birthLocation);
    
    // Calculate aspects (simplified for demo)
    console.log('Calculating aspects...');
    const aspects = calculateAspects(positions);

    console.log('Sending response with data');
    res.status(200).json({
      positions,
      aspects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating natal chart:', error);
    res.status(500).json({ 
      error: 'Failed to generate natal chart',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Simplified aspect calculation for demo purposes
function calculateAspects(positions: PlanetPosition[]): Aspect[] {
  console.log('Calculating aspects for positions:', positions);
  const aspects: Aspect[] = [];
  const planets = positions.map(p => p.name);
  
  // Generate random aspects for demo
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (Math.random() > 0.7) {
        const aspectTypes = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
        const randomType = aspectTypes[Math.floor(Math.random() * aspectTypes.length)];
        
        aspects.push({
          planet1: planets[i],
          planet2: planets[j],
          angle: Math.floor(Math.random() * 360),
          type: randomType
        });
      }
    }
  }
  
  console.log('Generated aspects:', aspects);
  return aspects;
}

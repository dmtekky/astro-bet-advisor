// Simple mock implementation for astrological calculations
// This provides mock data to unblock development

// Use CommonJS exports for Vercel compatibility

interface PlanetPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
}

// Get the current moon phase (0-1)
function getMoonPhase(date: Date): number {
  const cycleLength = 29.53; // days
  const knownNewMoon = new Date('2023-11-13T09:27:00Z').getTime();
  const phase = ((date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24)) % cycleLength / cycleLength;
  return phase >= 0 ? phase : 1 + phase; // Ensure positive value
}

// Get positions of all planets
function getPlanetPositions(date: Date): Record<string, PlanetPosition> {
  // Generate consistent positions based on date
  const timeFactor = date.getTime() / (1000 * 60 * 60 * 24); // days since epoch
  
  // Helper to generate position based on body and time factor
  const getPosition = (body: string, speed: number): PlanetPosition => {
    const base = (body.charCodeAt(0) + body.length) * 100; // Unique base per planet
    return {
      longitude: (base + timeFactor * speed) % 360,
      latitude: Math.sin(timeFactor * 0.1 + base) * 5, // -5 to 5 degrees
      distance: 1 + Math.sin(timeFactor * 0.05 + base) * 0.5, // 0.5 to 1.5 AU
      speed: speed
    };
  };

  // Return positions for all planets with different speeds
  return {
    sun: getPosition('sun', 0.9833),
    moon: getPosition('moon', 13.176), // Faster orbit
    mercury: getPosition('mercury', 1.3833),
    venus: getPosition('venus', 1.1167),
    mars: getPosition('mars', 0.5242),
    jupiter: getPosition('jupiter', 0.0833),
    saturn: getPosition('saturn', 0.0339)
  };
}

// Calculate aspects between planets
function calculateAspects(
  positions: Record<string, {longitude: number}>
): Record<string, string | null> {
  const aspects: Record<string, string | null> = {};
  const planets = Object.keys(positions);
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(positions[planet1].longitude - positions[planet2].longitude) % 360;
      const aspect = getAspect(angle);
      
      if (aspect) {
        aspects[`${planet1}_${planet2}`] = aspect;
      }
    }
  }
  
  return aspects;
}

// Helper function to determine the aspect based on angle
function getAspect(angle: number): string | null {
  const aspects = [
    { degree: 0, name: 'conjunction', orb: 8 },
    { degree: 30, name: 'semi-sextile', orb: 2 },
    { degree: 60, name: 'sextile', orb: 4 },
    { degree: 90, name: 'square', orb: 6 },
    { degree: 120, name: 'trine', orb: 6 },
    { degree: 150, name: 'quincunx', orb: 2 },
    { degree: 180, name: 'opposition', orb: 8 }
  ];
  
  for (const aspect of aspects) {
    if (Math.abs(angle - aspect.degree) <= aspect.orb) {
      return aspect.name;
    }
    if (Math.abs(360 - angle - aspect.degree) <= aspect.orb) {
      return aspect.name;
    }
  }
  
  return null;
}

// Get the current zodiac sign from ecliptic longitude
function getZodiacSign(longitude: number): string {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const signIndex = Math.floor((longitude / 30) % 12);
  return signs[signIndex];
}

// Export all functions
module.exports = {
  getMoonPhase,
  getPlanetPositions,
  calculateAspects,
  getZodiacSign
};

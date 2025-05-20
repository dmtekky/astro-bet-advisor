import { 
  AstroTime, 
  Body, 
  EquatorCoords, 
  EclipticCoordinates,
  Vector,
  moonPhase,
  moonPosition,
  sunPosition,
  planetPosition,
  eclipticFromEquator,
  eclipticFromHorizon,
  eclipticToEquatorial,
  horizon
} from 'astronomy-engine';

// Helper function to safely create AstroTime
const createAstroTime = (date: Date): AstroTime => {
  try {
    return AstroTime.fromDate(date);
  } catch (error) {
    console.error('Error creating AstroTime:', error);
    return new AstroTime(date.getTime() / 1000);
  }
};

// Get the current moon phase (0-1)
export function getMoonPhase(date: Date): number {
  try {
    const time = createAstroTime(date);
    const phase = moonPhase(time);
    // Convert from degrees (0-360) to 0-1 range
    return (phase % 360) / 360;
  } catch (error) {
    console.error('Error in getMoonPhase:', error);
    // Return a default value if there's an error
    return 0.5; // First quarter as fallback
  }
}

// Interface for planet positions
interface PlanetPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
}

// Get positions of all planets
export function getPlanetPositions(date: Date): Record<string, PlanetPosition> {
  const time = createAstroTime(date);
  
  // Get positions in ecliptic coordinates
  const getEclipticPos = (body: Body): PlanetPosition => {
    try {
      let equ: Vector;
      
      switch (body) {
        case Body.Sun:
          equ = sunPosition(time);
          break;
        case Body.Moon:
          equ = moonPosition(time);
          break;
        default:
          equ = planetPosition(body, time);
      }
      
      // Convert to ecliptic coordinates (longitude, latitude, distance)
      const ecl = eclipticFromEquator(equ, time);
      
      return {
        longitude: ecl.elon,  // Ecliptic longitude in degrees
        latitude: ecl.elat,   // Ecliptic latitude in degrees
        distance: ecl.dist,   // Distance in AU
        speed: 0.9833         // Approximate speed (simplified)
      };
    } catch (error) {
      console.error(`Error getting position for ${Body[body]}:`, error);
      // Return default values if there's an error
      return {
        longitude: 0,
        latitude: 0,
        distance: 1,
        speed: 0.9833
      };
    }
  };

  try {
    return {
      moon: getEclipticPos(Body.Moon),
      sun: getEclipticPos(Body.Sun),
      mercury: getEclipticPos(Body.Mercury),
      venus: getEclipticPos(Body.Venus),
      mars: getEclipticPos(Body.Mars),
      jupiter: getEclipticPos(Body.Jupiter),
      saturn: getEclipticPos(Body.Saturn)
    };
  } catch (error) {
    console.error('Error in getPlanetPositions:', error);
    // Return default values if there's an error
    return {
      moon: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 },
      sun: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 },
      mercury: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 },
      venus: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 },
      mars: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 },
      jupiter: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 },
      saturn: { longitude: 0, latitude: 0, distance: 1, speed: 0.9833 }
    };
  }
}

// Calculate aspects between planets
export function calculateAspects(positions: Record<string, {longitude: number}>): Record<string, string | null> {
  const aspects: Record<string, string | null> = {};
  const bodies = Object.keys(positions);
  
  try {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const body1 = bodies[i];
        const body2 = bodies[j];
        const angle = Math.abs(positions[body1].longitude - positions[body2].longitude) % 360;
        const aspect = getAspect(angle);
        
        if (aspect) {
          aspects[`${body1}_${body2}`] = aspect;
        }
      }
    }
  } catch (error) {
    console.error('Error in calculateAspects:', error);
  }
  
  return aspects;
}

// Helper function to determine the aspect based on angle
function getAspect(angle: number): string | null {
  try {
    const orb = 8; // Orb in degrees
    
    if (Math.abs(angle - 0) <= orb) return 'conjunction';
    if (Math.abs(angle - 30) <= orb) return 'semi-sextile';
    if (Math.abs(angle - 45) <= orb) return 'semi-square';
    if (Math.abs(angle - 60) <= orb) return 'sextile';
    if (Math.abs(angle - 90) <= orb) return 'square';
    if (Math.abs(angle - 120) <= orb) return 'trine';
    if (Math.abs(angle - 135) <= orb) return 'sesquiquadrate';
    if (Math.abs(angle - 150) <= orb) return 'quincunx';
    if (Math.abs(angle - 180) <= orb) return 'opposition';
  } catch (error) {
    console.error('Error in getAspect:', error);
  }
  
  return null;
}

// Get the current zodiac sign from ecliptic longitude
export function getZodiacSign(longitude: number): string {
  try {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const normalizedLongitude = ((longitude % 360) + 360) % 360; // Ensure positive value
    const index = Math.floor(normalizedLongitude / 30) % 12;
    return signs[index] || 'Aries';
  } catch (error) {
    console.error('Error in getZodiacSign:', error);
    return 'Aries'; // Default to Aries if there's an error
  }
}

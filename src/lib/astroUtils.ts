/**
 * Advanced astronomical utilities for the Astro Bet Advisor app
 */
import * as Astronomy from 'astronomy-engine';
import { 
  AspectType, 
  CelestialBody, 
  Dignity, 
  ZodiacSign, 
  Element, 
  Modality,
  AspectPattern,
  HouseSystem,
  Aspect
} from '../types/astrology';

// Constants
const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];

const ELEMENTS: Record<Element, ZodiacSign[]> = {
  fire: ['Aries', 'Leo', 'Sagittarius'],
  earth: ['Taurus', 'Virgo', 'Capricorn'],
  air: ['Gemini', 'Libra', 'Aquarius'],
  water: ['Cancer', 'Scorpio', 'Pisces']
};

const MODALITIES: Record<Modality, ZodiacSign[]> = {
  cardinal: ['Aries', 'Cancer', 'Libra', 'Capricorn'],
  fixed: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
  mutable: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces']
};

const RULERSHIPS: Record<ZodiacSign, string> = {
  'Aries': 'Mars',
  'Taurus': 'Venus',
  'Gemini': 'Mercury',
  'Cancer': 'Moon',
  'Leo': 'Sun',
  'Virgo': 'Mercury',
  'Libra': 'Venus',
  'Scorpio': 'Pluto', // Traditional: Mars
  'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn',
  'Aquarius': 'Uranus', // Traditional: Saturn
  'Pisces': 'Neptune' // Traditional: Jupiter
};

const EXALTATIONS: Record<string, ZodiacSign> = {
  'Sun': 'Aries',
  'Moon': 'Taurus',
  'Mercury': 'Virgo',
  'Venus': 'Pisces',
  'Mars': 'Capricorn',
  'Jupiter': 'Cancer',
  'Saturn': 'Libra',
  'Uranus': 'Scorpio',
  'Neptune': 'Leo',
  'Pluto': 'Aquarius'
};

const DETRIMENTS: Record<string, ZodiacSign[]> = {
  'Sun': ['Aquarius'],
  'Moon': ['Capricorn'],
  'Mercury': ['Sagittarius', 'Pisces'],
  'Venus': ['Aries', 'Scorpio'],
  'Mars': ['Taurus', 'Libra'],
  'Jupiter': ['Gemini', 'Virgo'],
  'Saturn': ['Cancer', 'Leo'],
  'Uranus': ['Leo'],
  'Neptune': ['Virgo'],
  'Pluto': ['Taurus']
};

const FALLS: Record<string, ZodiacSign> = {
  'Sun': 'Libra',
  'Moon': 'Scorpio',
  'Mercury': 'Pisces',
  'Venus': 'Virgo',
  'Mars': 'Cancer',
  'Jupiter': 'Capricorn',
  'Saturn': 'Aries',
  'Uranus': 'Taurus',
  'Neptune': 'Aquarius',
  'Pluto': 'Leo'
};

const ASPECT_DEFINITIONS = [
  { type: 'conjunction', angle: 0, orb: 8, influence: 'Strong', strength: 1.0 },
  { type: 'opposition', angle: 180, orb: 8, influence: 'Strong', strength: 0.9 },
  { type: 'trine', angle: 120, orb: 8, influence: 'Favorable', strength: 0.8 },
  { type: 'square', angle: 90, orb: 7, influence: 'Challenging', strength: 0.7 },
  { type: 'sextile', angle: 60, orb: 6, influence: 'Favorable', strength: 0.6 }
];

/**
 * Converts longitude to zodiac sign
 * @param longitude Celestial longitude in degrees
 * @returns Zodiac sign
 */
export function longitudeToSign(longitude: number): ZodiacSign {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

/**
 * Gets the element of a zodiac sign
 * @param sign Zodiac sign
 * @returns Element (fire, earth, air, water)
 */
export function getElement(sign: ZodiacSign): Element {
  for (const [element, signs] of Object.entries(ELEMENTS)) {
    if (signs.includes(sign)) {
      return element as Element;
    }
  }
  throw new Error(`Invalid sign: ${sign}`);
}

/**
 * Gets the modality of a zodiac sign
 * @param sign Zodiac sign
 * @returns Modality (cardinal, fixed, mutable)
 */
export function getModality(sign: ZodiacSign): Modality {
  for (const [modality, signs] of Object.entries(MODALITIES)) {
    if (signs.includes(sign)) {
      return modality as Modality;
    }
  }
  throw new Error(`Invalid sign: ${sign}`);
}

/**
 * Calculates the dignity of a planet in a sign
 * @param planet Planet name
 * @param sign Zodiac sign
 * @returns Dignity information
 */
export function calculateDignity(planet: string, sign: ZodiacSign): Dignity {
  const isRuler = RULERSHIPS[sign] === planet;
  const isExaltation = EXALTATIONS[planet] === sign;
  const isDetriment = DETRIMENTS[planet]?.includes(sign) || false;
  const isFall = FALLS[planet] === sign;
  
  let score = 0;
  if (isRuler) score += 5;
  if (isExaltation) score += 4;
  if (isDetriment) score -= 4;
  if (isFall) score -= 5;
  
  return {
    score,
    status: {
      ruler: isRuler,
      exaltation: isExaltation,
      detriment: isDetriment,
      fall: isFall
    }
  };
}

/**
 * Calculates aspects between two celestial bodies
 * @param body1 First celestial body
 * @param body2 Second celestial body
 * @returns Aspect or null if no aspect is found
 */
export function calculateAspect(body1: CelestialBody, body2: CelestialBody): Aspect | null {
  const lon1 = body1.longitude;
  const lon2 = body2.longitude;
  
  // Calculate the angle between the two bodies
  let angle = Math.abs(lon1 - lon2);
  if (angle > 180) angle = 360 - angle;
  
  // Check if any aspect is within orb
  for (const aspectDef of ASPECT_DEFINITIONS) {
    const orb = Math.abs(angle - aspectDef.angle);
    if (orb <= aspectDef.orb) {
      // Calculate aspect strength based on exactness
      const exactness = 1 - (orb / aspectDef.orb);
      const strength = aspectDef.strength * exactness;
      
      return {
        from: body1.name,
        to: body2.name,
        type: aspectDef.type as AspectType,
        orb,
        exact: orb < 1,
        influence: {
          description: `${body1.name} ${aspectDef.type} ${body2.name} (${orb.toFixed(1)}° orb)`,
          strength,
          area: getAspectAreas(body1.name, body2.name, aspectDef.type as AspectType)
        }
      };
    }
  }
  
  return null;
}

/**
 * Gets life areas affected by an aspect
 * @param planet1 First planet
 * @param planet2 Second planet
 * @param aspectType Type of aspect
 * @returns Array of affected life areas
 */
function getAspectAreas(planet1: string, planet2: string, aspectType: AspectType): string[] {
  const planetAreas: Record<string, string[]> = {
    'Sun': ['vitality', 'ego', 'identity', 'creativity'],
    'Moon': ['emotions', 'instincts', 'habits', 'subconscious'],
    'Mercury': ['communication', 'intellect', 'perception', 'learning'],
    'Venus': ['relationships', 'values', 'aesthetics', 'harmony'],
    'Mars': ['action', 'energy', 'aggression', 'drive'],
    'Jupiter': ['expansion', 'growth', 'philosophy', 'optimism'],
    'Saturn': ['discipline', 'restriction', 'responsibility', 'structure'],
    'Uranus': ['innovation', 'rebellion', 'change', 'originality'],
    'Neptune': ['spirituality', 'dreams', 'illusion', 'dissolution'],
    'Pluto': ['transformation', 'power', 'rebirth', 'intensity']
  };
  
  // Combine areas from both planets
  const areas = [...(planetAreas[planet1] || []), ...(planetAreas[planet2] || [])];
  // Return unique areas
  return [...new Set(areas)].slice(0, 4); // Max 4 areas
}

/**
 * Detects aspect patterns in a chart
 * @param aspects List of aspects
 * @param planets Map of planets and their positions
 * @returns List of detected aspect patterns
 */
export function detectAspectPatterns(
  aspects: Aspect[], 
  planets?: Record<string, CelestialBody>
): AspectPattern[] {
  const patterns: AspectPattern[] = [];
  
  // Grand Trine detection (3 planets in trine)
  const trines = aspects.filter(a => a.type === 'trine');
  if (trines.length >= 3) {
    const planetNames = new Set<string>();
    trines.forEach(t => {
      planetNames.add(t.from);
      planetNames.add(t.to);
    });
    
    if (planetNames.size >= 3) {
      // Simple detection - could be enhanced with more precise checks
      const planetsArray = Array.from(planetNames).slice(0, 3);
      
      // If we have planet data, get the signs
      let signs: ZodiacSign[] = [];
      let elements: Element[] = [];
      
      if (planets) {
        // Get signs from planet data
        signs = planetsArray
          .map(name => {
            const key = name.toLowerCase();
            return planets[key]?.sign as ZodiacSign;
          })
          .filter(Boolean) as ZodiacSign[];
          
        // Get elements from signs
        elements = signs.map(getElement);
      } else {
        // Fallback if no planet data
        signs = ['Aries', 'Leo', 'Sagittarius'] as ZodiacSign[];
        elements = ['fire'] as Element[];
      }
      
      // Check if all signs are of same element
      const uniqueElements = [...new Set(elements)];
      
      if (uniqueElements.length === 1 || !planets) { // If no planet data, just create the pattern
        patterns.push({
          type: 'Grand Trine',
          planets: planetsArray,
          signs,
          elements: uniqueElements,
          influence: `Strong harmonious energy in ${uniqueElements[0] || 'fire'} element`,
          strength: 0.8
        });
      }
    }
  }
  
  // More pattern detection can be added here
  
  return patterns;
}

/**
 * Calculates house positions using Placidus system
 * @param date Date for calculation
 * @param latitude Observer latitude
 * @param longitude Observer longitude
 * @returns House system data
 */
export function calculateHouses(date: Date, latitude: number, longitude: number): HouseSystem {
  // Simplified implementation - in a real app, use a proper astronomy library
  // This is a placeholder implementation
  const cusps = Array(12).fill(0).map((_, i) => (i * 30) % 360);
  
  // Calculate approximate angles based on current time
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const dayProgress = hours / 24;
  const baseAngle = (dayProgress * 360 + 90) % 360;
  
  return {
    system: 'Placidus',
    cusps,
    angles: {
      asc: baseAngle,
      mc: (baseAngle + 90) % 360,
      dsc: (baseAngle + 180) % 360,
      ic: (baseAngle + 270) % 360
    }
  };
}

/**
 * Checks if Mercury is retrograde
 * @param date Date to check
 * @returns Whether Mercury is retrograde
 */
export function isMercuryRetrograde(date: Date): boolean {
  // This is a simplified check - in a real app, use an ephemeris
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 2025 Mercury retrograde periods
  const retrogradePeriods = [
    { start: `${year}-01-14`, end: `${year}-02-03` },
    { start: `${year}-05-10`, end: `${year}-06-02` },
    { start: `${year}-09-09`, end: `${year}-10-02` },
    { start: `${year}-12-29`, end: `${year+1}-01-18` }
  ];
  
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  return retrogradePeriods.some(period => 
    dateStr >= period.start && dateStr <= period.end
  );
}

/**
 * Calculates moon phase (0-1)
 * @param date Date to calculate for
 * @returns Moon phase value between 0-1
 */
export function calculateMoonPhase(date: Date): number {
  // Simplified moon phase calculation
  const lunarCycle = 29.53; // days in lunar cycle
  const knownNewMoon = new Date('2025-01-21T20:53:00Z').getTime();
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  return (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;
}

/**
 * Gets the name of a moon phase
 * @param phase Moon phase value (0-1)
 * @returns Name of the moon phase
 */
export function getMoonPhaseName(phase: number): string {
  // Simple moon phase name lookup
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Calculates planetary position using astronomy-engine
 * @param body Celestial body
 * @param date Date for calculation
 * @param observer Observer location
 * @returns Celestial body data
 */
export function calculatePlanetaryPosition(
  body: string, 
  date: Date, 
  observer: { latitude: number; longitude: number; altitude?: number }
): CelestialBody {
  try {
    // This would use the actual astronomy-engine in a real implementation
    // For now, we'll use a simplified approach
    
    // Convert body name to astronomy-engine body
    const astronomyBody = mapToAstronomyBody(body);
    
    // Calculate position based on date
    const dayOfYear = getDayOfYear(date);
    const yearFraction = dayOfYear / 365;
    
    // Base longitude - simplified orbit calculation
    const baseSpeed = getPlanetSpeed(body);
    const basePeriod = getPlanetPeriod(body);
    
    // Calculate longitude - simplified
    const longitude = (baseSpeed * yearFraction * 360) % 360;
    
    // Determine if retrograde (simplified)
    const isRetrograde = body === 'Mercury' 
      ? isMercuryRetrograde(date)
      : body === 'Venus' || body === 'Mars' || body === 'Jupiter' || body === 'Saturn'
        ? Math.sin(yearFraction * Math.PI * 2 + Math.random() * 0.5) > 0.7
        : false;
    
    // Calculate sign
    const sign = longitudeToSign(longitude);
    
    // Calculate dignity
    const dignity = calculateDignity(body, sign);
    
    return {
      name: body,
      longitude,
      speed: baseSpeed * (isRetrograde ? -1 : 1),
      sign,
      degree: Math.floor(longitude % 30),
      retrograde: isRetrograde,
      dignity
    };
  } catch (error) {
    console.error(`Error calculating position for ${body}:`, error);
    // Return a fallback value
    return {
      name: body,
      longitude: 0,
      speed: 0,
      sign: 'Aries',
      degree: 0,
      retrograde: false
    };
  }
}

// Helper function to get day of year
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Helper to map planet name to astronomy-engine body
function mapToAstronomyBody(body: string): string {
  const mapping: Record<string, string> = {
    'Sun': 'Sun',
    'Moon': 'Moon',
    'Mercury': 'Mercury',
    'Venus': 'Venus',
    'Mars': 'Mars',
    'Jupiter': 'Jupiter',
    'Saturn': 'Saturn',
    'Uranus': 'Uranus',
    'Neptune': 'Neptune',
    'Pluto': 'Pluto'
  };
  
  return mapping[body] || body;
}

// Helper to get planet base speed
function getPlanetSpeed(body: string): number {
  const speeds: Record<string, number> = {
    'Sun': 1,
    'Moon': 13.2,
    'Mercury': 1.2,
    'Venus': 1.6,
    'Mars': 0.5,
    'Jupiter': 0.08,
    'Saturn': 0.03,
    'Uranus': 0.01,
    'Neptune': 0.006,
    'Pluto': 0.004
  };
  
  return speeds[body] || 1;
}

// Helper to get planet orbital period in Earth years
function getPlanetPeriod(body: string): number {
  const periods: Record<string, number> = {
    'Sun': 1,
    'Moon': 0.0748, // ~27.3 days
    'Mercury': 0.24,
    'Venus': 0.62,
    'Mars': 1.88,
    'Jupiter': 11.86,
    'Saturn': 29.46,
    'Uranus': 84.01,
    'Neptune': 164.79,
    'Pluto': 248.59
  };
  
  return periods[body] || 1;
}

/**
 * Calculates elemental balance in a chart
 * @param planets List of planets and their positions
 * @returns Elemental balance data
 */
export function calculateElementalBalance(
  planets: Record<string, CelestialBody>
): { 
  fire: { score: number; planets: string[] };
  earth: { score: number; planets: string[] };
  air: { score: number; planets: string[] };
  water: { score: number; planets: string[] };
} {
  const elements: Record<Element, string[]> = {
    fire: [],
    earth: [],
    air: [],
    water: []
  };
  
  // Count planets in each element
  Object.entries(planets).forEach(([name, body]) => {
    const element = getElement(body.sign);
    elements[element].push(name);
  });
  
  // Calculate scores
  const total = Object.values(planets).length;
  return {
    fire: {
      score: elements.fire.length / total,
      planets: elements.fire
    },
    earth: {
      score: elements.earth.length / total,
      planets: elements.earth
    },
    air: {
      score: elements.air.length / total,
      planets: elements.air
    },
    water: {
      score: elements.water.length / total,
      planets: elements.water
    }
  };
}

/**
 * Calculates modality balance in a chart
 * @param planets List of planets and their positions
 * @returns Modality balance data
 */
export function calculateModalBalance(
  planets: Record<string, CelestialBody>
): { 
  cardinal: { score: number; planets: string[] };
  fixed: { score: number; planets: string[] };
  mutable: { score: number; planets: string[] };
} {
  const modalities: Record<Modality, string[]> = {
    cardinal: [],
    fixed: [],
    mutable: []
  };
  
  // Count planets in each modality
  Object.entries(planets).forEach(([name, body]) => {
    const modality = getModality(body.sign);
    modalities[modality].push(name);
  });
  
  // Calculate scores
  const total = Object.values(planets).length;
  return {
    cardinal: {
      score: modalities.cardinal.length / total,
      planets: modalities.cardinal
    },
    fixed: {
      score: modalities.fixed.length / total,
      planets: modalities.fixed
    },
    mutable: {
      score: modalities.mutable.length / total,
      planets: modalities.mutable
    }
  };
}

import { CelestialBody, ZodiacSign } from '@/types/astrology';
import { format } from 'date-fns';

type PlanetKey = keyof typeof planetIcons;

// Icons for each planet
const planetIcons = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

// Strength descriptions based on orb
const getAspectStrength = (orb: number): { level: string; description: string } => {
  const absOrb = Math.abs(orb);
  if (absOrb < 1) return { level: 'Exact', description: 'Very strong influence' };
  if (absOrb < 3) return { level: 'Strong', description: 'Strong influence' };
  if (absOrb < 5) return { level: 'Moderate', description: 'Moderate influence' };
  return { level: 'Weak', description: 'Mild influence' };
};

// Aspect type descriptions
const aspectDescriptions: Record<string, string> = {
  conjunction: 'A powerful blending of energies',
  sextile: 'Opportunities and creative flow',
  square: 'Challenges and tension to overcome',
  trine: 'Harmonious and supportive energy',
  opposition: 'Polarity and awareness through contrast',
};

// Planet descriptions
const planetMeanings: Record<string, string> = {
  sun: 'Ego, vitality, and conscious self',
  moon: 'Emotions, instincts, and subconscious',
  mercury: 'Communication, thought processes, and learning',
  venus: 'Love, values, and attraction',
  mars: 'Action, desire, and aggression',
  jupiter: 'Expansion, luck, and wisdom',
  saturn: 'Structure, discipline, and limitations',
  uranus: 'Innovation, rebellion, and sudden change',
  neptune: 'Intuition, dreams, and illusions',
  pluto: 'Transformation, power, and rebirth',
};

// Sign descriptions
const signMeanings: Record<string, string> = {
  aries: 'Courageous, energetic, and pioneering',
  taurus: 'Sensual, reliable, and determined',
  gemini: 'Versatile, curious, and communicative',
  cancer: 'Nurturing, intuitive, and protective',
  leo: 'Dramatic, creative, and confident',
  virgo: 'Analytical, practical, and service-oriented',
  libra: 'Diplomatic, fair-minded, and social',
  scorpio: 'Passionate, intense, and transformative',
  sagittarius: 'Adventurous, optimistic, and philosophical',
  capricorn: 'Ambitious, disciplined, and responsible',
  aquarius: 'Humanitarian, innovative, and independent',
  pisces: 'Compassionate, artistic, and spiritual',
};

// House meanings
const houseMeanings: Record<number, string> = {
  1: 'Self, identity, and appearance',
  2: 'Values, possessions, and self-worth',
  3: 'Communication, siblings, and short trips',
  4: 'Home, family, and roots',
  5: 'Creativity, romance, and children',
  6: 'Health, service, and daily routines',
  7: 'Partnerships, marriage, and open enemies',
  8: 'Transformation, shared resources, and intimacy',
  9: 'Philosophy, higher learning, and long journeys',
  10: 'Career, public image, and reputation',
  11: 'Friendships, groups, and aspirations',
  12: 'Subconscious, spirituality, and hidden matters',
};

// Generate detailed aspect description
export const getAspectDetails = (aspect: {
  planet1: string;
  planet2: string;
  aspectType: string;
  orb: number;
  planet1Sign?: string;
  planet2Sign?: string;
  planet1House?: number;
  planet2House?: number;
}) => {
  const { planet1, planet2, aspectType, orb } = aspect;
  const strength = getAspectStrength(orb);
  
  const planet1Name = planet1.charAt(0).toUpperCase() + planet1.slice(1);
  const planet2Name = planet2 ? planet2.charAt(0).toUpperCase() + planet2.slice(1) : '';
  
  let description = `${planet1Name} ${aspectType} ${planet2Name}\n`;
  description += `• Strength: ${strength.level} (${orb.toFixed(1)}° orb)\n`;
  description += `• Nature: ${aspectDescriptions[aspectType] || 'Aspect influence'}\n`;
  
  if (aspect.planet1Sign) {
    description += `• ${planet1Name} in ${aspect.planet1Sign}: ${signMeanings[aspect.planet1Sign.toLowerCase()] || ''}\n`;
  }
  
  if (aspect.planet2Sign) {
    description += `• ${planet2Name} in ${aspect.planet2Sign}: ${signMeanings[aspect.planet2Sign.toLowerCase()] || ''}\n`;
  }
  
  if (aspect.planet1House) {
    description += `• ${planet1Name} in House ${aspect.planet1House}: ${houseMeanings[aspect.planet1House] || ''}\n`;
  }
  
  if (aspect.planet2House) {
    description += `• ${planet2Name} in House ${aspect.planet2House}: ${houseMeanings[aspect.planet2House] || ''}\n`;
  }
  
  return description;
};

// Generate detailed planet position
export const getPlanetPosition = (planet: string, data: any) => {
  const planetData = data.planets?.[planet.toLowerCase()];
  if (!planetData) return null;
  
  const sign = planetData.sign || 'Unknown';
  const degree = Math.floor(planetData.degree || 0);
  const minute = Math.floor((planetData.minute || 0) * 60);
  const retrograde = planetData.retrograde ? ' (Retrograde)' : '';
  
  return {
    position: `${sign} ${degree}°${minute}'`,
    description: `${planetMeanings[planet.toLowerCase()] || ''} in ${sign}: ${signMeanings[sign.toLowerCase()] || ''}${retrograde}`,
    retrograde: !!planetData.retrograde,
    sign: sign.toLowerCase(),
    degree,
    minute
  };
};

// Generate influence score (0-1) based on astrological factors
export const calculateInfluenceScore = (aspect: any, currentDate: Date = new Date()): number => {
  let score = 0.5; // Base score
  
  // Adjust based on aspect type
  const aspectType = aspect.aspectType?.toLowerCase();
  switch (aspectType) {
    case 'conjunction':
    case 'opposition':
      score += 0.3;
      break;
    case 'square':
    case 'trine':
      score += 0.2;
      break;
    case 'sextile':
      score += 0.15;
      break;
    default:
      score += 0.1;
  }
  
  // Adjust based on orb (tighter orbs are stronger)
  const orb = Math.abs(aspect.orb || 0);
  score += (5 - Math.min(orb, 5)) * 0.04; // 0.2 points max for very tight orbs
  
  // Adjust for outer planets (slower moving = more significant)
  const outerPlanets = ['uranus', 'neptune', 'pluto', 'saturn', 'jupiter'];
  if (outerPlanets.includes(aspect.planet1?.toLowerCase()) || 
      outerPlanets.includes(aspect.planet2?.toLowerCase())) {
    score += 0.15;
  }
  
  // Ensure score is between 0 and 1
  return Math.min(Math.max(score, 0), 1);
};

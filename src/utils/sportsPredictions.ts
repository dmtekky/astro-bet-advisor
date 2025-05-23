// src/utils/sportsPredictions.ts
import type { 
  AstroData, 
  CelestialBody, 
  AspectType,
  Aspect
} from '@/types/astrology';
import type { Game, Team } from '@/types';
import type { GamePredictionData } from '@/types/gamePredictions';

// Extended interface to match the actual data structure
type ExtendedAstroData = Omit<AstroData, 'aspects' | 'elements' | 'moon' | 'sun' | 'planets'> & {
  moon?: CelestialBody & { phase_name?: string; illumination?: number; phase?: string };
  sun?: CelestialBody & { sign?: string; retrograde?: boolean };
  planets?: Record<string, CelestialBody & { sign?: string; retrograde?: boolean }>;
  elements?: {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
  };
  aspects?: Array<Aspect | {
    from: string;
    to: string;
    type: string;
    angle?: number;
    orb?: number;
    influence?: string | { description: string; strength: number; area: string[] };
    planets?: string[];
  }>;
};

// Define prediction result type
export interface PredictionResult {
  prediction: string;
  dominantElement: string;
  elementScores: {
    fire: number;
    earth: number;
    water: number;
    air: number;
  };
  moonPhase: string;
  moonIllumination?: number;
  sunSign: string;
  mercuryRetrograde: boolean;
  confidence: number;
  tags: string[];
}

// Interface for game outcome prediction
export interface GameOutcomePrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  prediction: string;
  dominantElement: string;
  moonPhase: string;
  sunSign: string;
  tags: string[];
  confidence: number;
  reasoning?: string;
  predicted_winner?: string | null;
}

// Export GameOutcomePrediction as SportsPrediction for backward compatibility
export type SportsPrediction = GameOutcomePrediction;

/**
 * Calculate sports prediction based on astrological data
 */
export function calculateSportsPredictions(astroData: GamePredictionData | null): PredictionResult | null {
  if (!astroData) return null;
  
  // Extract key data from astro data with safe fallbacks
  const moonPhase = (() => {
    if (astroData.moon?.phase_name) return astroData.moon.phase_name;
    if (astroData.moonPhase?.name) return astroData.moonPhase.name;
    return 'New Moon'; // Default fallback
  })();
  
  const moonIllumination = (() => {
    if (typeof astroData.moon?.illumination === 'number') return astroData.moon.illumination;
    if (typeof astroData.moonPhase?.illumination === 'number') return astroData.moonPhase.illumination;
    return 0; // Default fallback
  })();
  
  // Handle sun sign - check both direct property and planets object
  const sunSign = (() => {
    if (astroData.sun?.sign) return String(astroData.sun.sign);
    if (astroData.planets?.sun?.sign) return String(astroData.planets.sun.sign);
    return 'Aries'; // Default fallback
  })();
  
  // Handle mercury retrograde
  const mercuryRetrograde = (() => {
    if (astroData.planets?.mercury?.retrograde !== undefined) 
      return Boolean(astroData.planets.mercury.retrograde);
    return false;
  })();
  
  // Check for significant aspects that might affect the game
  const significantAspects = (astroData.aspects || []).filter(aspect => {
    // Handle both Aspect type and the simplified aspect format
    const from = 'from' in aspect ? String(aspect.from || '') : '';
    const to = 'to' in aspect ? String(aspect.to || '') : '';
    
    // Check if any of the planets in the aspect are significant
    return [from, to].some(p => 
      p && (p.includes('Sun') || p.includes('Moon') || p.includes('Mercury'))
    );
  });

  // Add aspect influences to tags
  const tags: string[] = [];
  if (significantAspects.length > 0) {
    tags.push('Significant aspects present');
  }
  
  // Calculate element distribution scores with safe access
  const defaultElements = { 
    fire: { score: 0, planets: [] }, 
    earth: { score: 0, planets: [] }, 
    water: { score: 0, planets: [] }, 
    air: { score: 0, planets: [] } 
  };
  
  const elements = astroData.elements || defaultElements;
  
  // Extract scores safely with proper type checking
  const fireScore = (() => {
    if (!elements.fire) return 0;
    if (typeof elements.fire === 'number') return elements.fire;
    if (typeof elements.fire.score === 'number') return elements.fire.score;
    return 0;
  })();
  
  const earthScore = (() => {
    if (!elements.earth) return 0;
    if (typeof elements.earth === 'number') return elements.earth;
    if (typeof elements.earth.score === 'number') return elements.earth.score;
    return 0;
  })();
  
  const waterScore = (() => {
    if (!elements.water) return 0;
    if (typeof elements.water === 'number') return elements.water;
    if (typeof elements.water.score === 'number') return elements.water.score;
    return 0;
  })();
  
  const airScore = (() => {
    if (!elements.air) return 0;
    if (typeof elements.air === 'number') return elements.air;
    if (typeof elements.air.score === 'number') return elements.air.score;
    return 0;
  })();
  
  const totalElements = fireScore + earthScore + waterScore + airScore || 100;
  
  const elementScores = {
    fire: Math.round((fireScore / totalElements) * 100) || 25,
    earth: Math.round((earthScore / totalElements) * 100) || 25,
    water: Math.round((waterScore / totalElements) * 100) || 25,
    air: Math.round((airScore / totalElements) * 100) || 25
  };
  
  // Get dominant element
  const dominantElement = Object.entries(elementScores)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Generate prediction text
  let prediction = '';
  
  // Sun sign influence
  prediction += getSunSignPrediction(sunSign);
  
  // Moon phase influence
  prediction += ' ' + getMoonPhasePrediction(moonPhase, moonIllumination);
  
  // Element influence
  prediction += ' ' + getElementPrediction(dominantElement, elementScores);
  
  // Mercury retrograde (if applicable)
  if (mercuryRetrograde) {
    prediction += ' With Mercury in retrograde, expect communication issues and potential misunderstandings between players and coaches, possibly leading to strategic errors.';
  }
  
  // Return structured prediction data
  return {
    prediction,
    dominantElement,
    elementScores,
    moonPhase,
    moonIllumination,
    sunSign,
    mercuryRetrograde,
    confidence: 0.7,  // Fixed confidence score
    tags: [dominantElement, 'sports_prediction']
  };
}

/**
 * Get sports prediction based on sun sign
 */
function getSunSignPrediction(sign: string): string {
  const predictions: Record<string, string> = {
    'Aries': "Teams with aggressive, fast-paced styles have an advantage today.",
    'Taurus': "Teams with strong defensive fundamentals and patience are favored.",
    'Gemini': "Versatile teams with good passing and communication will perform well.",
    'Cancer': "Home teams have a stronger advantage than usual today.",
    'Leo': "Star players will have outsized impact on game outcomes.",
    'Virgo': "Teams with disciplined, detail-oriented approaches will succeed.",
    'Libra': "Well-balanced teams with good chemistry are at an advantage.",
    'Scorpio': "Intense, defensive battles are likely, with low-scoring games.",
    'Sagittarius': "High-scoring games with long-range shooting success are favored.",
    'Capricorn': "Veterans and experienced teams have an edge today.",
    'Aquarius': "Unconventional strategies and unexpected outcomes are likely.",
    'Pisces': "Intuitive, flow-based play will be rewarded over rigid systems."
  };
  
  return predictions[sign] || "Today's cosmic alignment suggests a balanced playing field.";
}

/**
 * Get sports prediction based on moon phase
 */
function getMoonPhasePrediction(phase: string, illumination: number): string {
  const predictions: Record<string, string> = {
    'New Moon': "This new moon phase indicates fresh strategies will be successful.",
    'Waxing Crescent': "Teams starting new momentum cycles have an advantage.",
    'First Quarter': "Teams overcoming recent challenges will show significant improvement.",
    'Waxing Gibbous': "Teams peaking at the right time will perform especially well.",
    'Full Moon': "Expect dramatic, emotional performances with high intensity.",
    'Waning Gibbous': "Teams with superior conditioning will pull ahead in late-game situations.",
    'Last Quarter': "Teams in rebuilding phases may surprise with strong performances.",
    'Waning Crescent': "Rest and recovery strategies will be particularly important."
  };
  
  return predictions[phase] || `With ${Math.round(illumination * 100)}% lunar illumination, emotional control will be a key factor.`;
}

/**
 * Get sports prediction based on dominant element
 */
function getElementPrediction(
  element: string, 
  scores: {fire: number, earth: number, water: number, air: number}
): string {
  const predictions: Record<string, string> = {
    'fire': `With fire as the dominant element (${scores.fire}%), expect fast-paced, high-energy games where aggressive teams take more risks.`,
    'earth': `Earth's dominance (${scores.earth}%) favors disciplined, structured teams that rely on fundamentals and physical play.`,
    'air': `Air's strong influence (${scores.air}%) benefits teams with superior passing, communication, and strategic adaptability.`,
    'water': `Water's significant presence (${scores.water}%) enhances intuitive team connections and emotional momentum swings.`
  };
  
  return predictions[element] || "A balanced elemental distribution suggests no particular style has a cosmic advantage.";
}

/**
 * Predict which team might have an astrological edge in a matchup
 * @param game - Game data
 * @param homeTeam - Home team data
 * @param awayTeam - Away team data 
 * @param astroData - Astrological data
 * @returns Object with prediction details or null if data is missing
 */
export function predictGameOutcome(
  game: Game, 
  homeTeam: Team | undefined, 
  awayTeam: Team | undefined, 
  astroData: GamePredictionData | null
): GameOutcomePrediction | null {
  if (!astroData || !homeTeam || !awayTeam) {
    return null;
  }
  
  // Extract key astrological data with proper type checking and fallbacks
  const moonPhase = (() => {
    if (astroData.moon?.phase_name) return astroData.moon.phase_name;
    if (astroData.moonPhase?.name) return astroData.moonPhase.name;
    return 'New Moon'; // Default fallback
  })();
    
  const sunSign = (() => {
    if (astroData.sun?.sign) return String(astroData.sun.sign);
    if (astroData.planets?.sun?.sign) return String(astroData.planets.sun.sign);
    return 'Aries'; // Default fallback
  })();
  
  // Get dominant element with proper type checking
  const defaultElements = { 
    fire: { score: 0, planets: [] }, 
    earth: { score: 0, planets: [] }, 
    water: { score: 0, planets: [] }, 
    air: { score: 0, planets: [] } 
  };
  
  const elements = astroData.elements || defaultElements;
  
  // Extract element scores safely with proper type checking
  const elementValues = {
    fire: (() => {
      if (!elements.fire) return 0;
      if (typeof elements.fire === 'number') return elements.fire;
      if (typeof elements.fire.score === 'number') return elements.fire.score;
      return 0;
    })(),
    earth: (() => {
      if (!elements.earth) return 0;
      if (typeof elements.earth === 'number') return elements.earth;
      if (typeof elements.earth.score === 'number') return elements.earth.score;
      return 0;
    })(),
    water: (() => {
      if (!elements.water) return 0;
      if (typeof elements.water === 'number') return elements.water;
      if (typeof elements.water.score === 'number') return elements.water.score;
      return 0;
    })(),
    air: (() => {
      if (!elements.air) return 0;
      if (typeof elements.air === 'number') return elements.air;
      if (typeof elements.air.score === 'number') return elements.air.score;
      return 0;
    })()
  };
  
  const dominantElement = Object.entries(elementValues)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  
  // Calculate baseline edge (home court advantage)
  let homeEdge = 0.52; // Start with basic home court advantage
  
  // Adjust based on moon phase (full moon enhances home court advantage)
  if (moonPhase === 'Full Moon') {
    homeEdge += 0.05;
  } else if (moonPhase === 'New Moon') {
    homeEdge -= 0.02; // New beginnings favor away teams slightly
  }
  
  // Since Team from hooks/useTeams doesn't have primary_color, use a random factor
  const homeColorFactor = Math.random() * 0.2 + 0.4; // Random value between 0.4 and 0.6
  const awayColorFactor = Math.random() * 0.2 + 0.4; // Random value between 0.4 and 0.6
  
  homeEdge += (homeColorFactor - awayColorFactor) * 0.03;
  
  // Limit the edge to a reasonable range
  homeEdge = Math.max(0.4, Math.min(0.6, homeEdge));
  
  // Generate prediction text
  const prediction = generateMatchupPrediction(
    homeTeam.name || 'Home Team', 
    awayTeam.name || 'Away Team', 
    homeEdge, 
    dominantElement, 
    moonPhase,
    sunSign
  );
  
  // Determine predicted winner based on win probability
  const predicted_winner = homeEdge > 0.5 
    ? 'home' 
    : homeEdge < 0.5 
      ? 'away' 
      : null;

  return {
    homeWinProbability: homeEdge,
    awayWinProbability: 1 - homeEdge,
    prediction,
    dominantElement,
    moonPhase,
    sunSign,
    tags: [dominantElement, moonPhase.toLowerCase().replace(/\s+/g, '_')],
    confidence: 0.7 + Math.abs(homeEdge - 0.5), // Higher confidence when edge is stronger
    predicted_winner
  };
}

/**
 * Generate a prediction for a specific matchup
 */
function generateMatchupPrediction(
  homeTeam: string,
  awayTeam: string,
  homeWinProbability: number,
  dominantElement: string,
  moonPhase: string,
  sunSign: string
): string {
  // Determine which team has the edge
  const favoredTeam = homeWinProbability > 0.5 ? homeTeam : awayTeam;
  const underdogTeam = homeWinProbability > 0.5 ? awayTeam : homeTeam;
  const edgeStrength = Math.abs(homeWinProbability - 0.5) * 20; // Convert to percentage points from center
  
  // Create prediction phrases based on edge strength
  let edgePhrase = '';
  if (edgeStrength < 2) {
    edgePhrase = "virtually even matchup with no clear astrological advantage";
  } else if (edgeStrength < 5) {
    edgePhrase = "slight astrological edge";
  } else if (edgeStrength < 8) {
    edgePhrase = "moderate astrological advantage";
  } else {
    edgePhrase = "significant astrological favor";
  }
  
  // Build the prediction text
  let prediction = `The cosmic alignment shows a ${edgePhrase} for ${favoredTeam}. `;
  
  // Add element-based detail
  switch (dominantElement) {
    case 'fire':
      prediction += `The dominant fire element (enhancing aggression and energy) `;
      break;
    case 'earth':
      prediction += `The strong earth element influence (boosting consistency and endurance) `;
      break;
    case 'air':
      prediction += `The prevailing air element (improving strategy and adaptability) `;
      break;
    case 'water':
      prediction += `The powerful water element (heightening intuition and flow) `;
      break;
    default:
      prediction += `The balanced elemental distribution `;
  }
  
  prediction += `combined with the ${moonPhase} and Sun in ${sunSign} `;
  
  if (homeWinProbability > 0.5) {
    prediction += `supports the home team's natural advantage.`;
  } else {
    prediction += `may help the away team overcome the home court disadvantage.`;
  }
  
  return prediction;
}

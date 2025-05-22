// src/utils/sportsPredictionsNew.ts
import type { AstroData } from '@/hooks/useAstroData';
import type { Game } from '@/types';
// Import Team from hooks for Dashboard compatibility
import type { Team } from '@/hooks/useTeams';

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
}

/**
 * Calculate sports prediction based on astrological data
 */
export function calculateSportsPredictions(astroData: AstroData | null): PredictionResult | null {
  if (!astroData) return null;
  
  // Extract key data from astro data
  const moonPhase = astroData.moon?.phase_name || '';
  const moonIllumination = typeof astroData.moon?.illumination === 'number' 
    ? astroData.moon.illumination : 0;
  const sunSign = astroData.sun?.sign || astroData.planets?.sun?.sign || '';
  const mercuryRetrograde = astroData.mercury?.retrograde || 
    (astroData.planets?.mercury as any)?.retrograde || false;
  
  // Calculate element distribution scores
  const elements = astroData.elements || { fire: 0, earth: 0, water: 0, air: 0 };
  
  // Convert to proper format if needed
  let fireScore = 0;
  let earthScore = 0;
  let waterScore = 0;
  let airScore = 0;
  
  if (typeof elements.fire === 'number') {
    fireScore = elements.fire;
    earthScore = elements.earth;
    waterScore = elements.water;
    airScore = elements.air;
  } else if (elements.fire && typeof elements.fire === 'object') {
    // @ts-ignore - Handle potential missing properties
    fireScore = elements.fire.score || 0;
    // @ts-ignore
    earthScore = elements.earth?.score || 0;
    // @ts-ignore
    waterScore = elements.water?.score || 0;
    // @ts-ignore
    airScore = elements.air?.score || 0;
  }
  
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
  astroData: AstroData | null
): GameOutcomePrediction | null {
  if (!astroData || !homeTeam || !awayTeam) {
    return null;
  }
  
  // Extract key astrological data
  const moonPhase = astroData.moon?.phase_name || '';
  const sunSign = astroData.sun?.sign || '';
  
  // Get dominant element
  const elements = astroData.elements || { fire: 0, earth: 0, water: 0, air: 0 };
  let elementValues: Record<string, number> = {};
  
  if (typeof elements.fire === 'number') {
    elementValues = elements as Record<string, number>;
  } else {
    // Handle case where elements have a score property
    Object.entries(elements).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // @ts-ignore
        elementValues[key] = value.score || 0;
      } else {
        elementValues[key] = 0;
      }
    });
  }
  
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
  
  return {
    homeWinProbability: homeEdge,
    awayWinProbability: 1 - homeEdge,
    prediction,
    dominantElement,
    moonPhase,
    sunSign,
    tags: [dominantElement, moonPhase.toLowerCase().replace(/\s+/g, '_')],
    confidence: 0.7 + Math.abs(homeEdge - 0.5) // Higher confidence when edge is stronger
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

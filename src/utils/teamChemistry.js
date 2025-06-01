// Team Chemistry Calculation Utilities
import { getZodiacSign } from './zodiacUtils.js';
// Note: When importing from a TypeScript file in Node.js scripts, we use .js extension
// This is because Node.js will look for the compiled JS file, not the TS source

// Define zodiac element mappings
const zodiacElements = {
  aries: 'fire',
  taurus: 'earth',
  gemini: 'air',
  cancer: 'water',
  leo: 'fire',
  virgo: 'earth',
  libra: 'air',
  scorpio: 'water',
  sagittarius: 'fire',
  capricorn: 'earth',
  aquarius: 'air',
  pisces: 'water'
};

// Define zodiac compatibility scores (0-5, 5 being most compatible)
const elementCompatibility = {
  fire: { fire: 4, earth: 1, air: 5, water: 2 },
  earth: { fire: 1, earth: 4, air: 2, water: 5 },
  air: { fire: 5, earth: 2, air: 4, water: 1 },
  water: { fire: 2, earth: 5, air: 1, water: 4 }
};

// Calculate weighted player scores
export function calculatePlayerWeights(players) {
  if (!players || players.length === 0) return [];

  // Get min and max impact scores for normalization
  const impactScores = players
    .map(p => p.impact_score || 0)
    .filter(score => score > 0);
  
  const minImpact = impactScores.length > 0 ? Math.min(...impactScores) : 0;
  const maxImpact = impactScores.length > 0 ? Math.max(...impactScores) : 100;
  const range = maxImpact - minImpact || 1; // Avoid division by zero

  return players.map(player => {
    // Use impact_score if available, otherwise astro_influence_score, with a default fallback
    const impactScore = player.impact_score || player.astro_influence_score || 0;
    
    // Normalize impact score to 0-1 range
    const normalizedImpact = range > 0 
      ? ((impactScore) - minImpact) / range 
      : 0.5; // Default if all scores are equal
    
    // Apply minimum weight (0.2) so all players have some influence
    // Players with higher impact scores will have more weight (up to 1.0)
    const weight = 0.2 + (0.8 * normalizedImpact);
    
    // Get zodiac sign and element if birth date is available
    let zodiacSign = null;
    let element = null;
    
    if (player.birth_date) {
      zodiacSign = getZodiacSign(player.birth_date);
      element = zodiacSign ? zodiacElements[zodiacSign.toLowerCase()] : null;
    }
    
    return {
      ...player,
      normalizedImpact,
      weight,
      zodiacSign,
      element
    };
  });
}

// Calculate elemental balance
export function calculateElementalBalance(weightedPlayers) {
  // Filter players that have astrological data
  const playersWithElements = weightedPlayers.filter(p => p.element);
  
  if (playersWithElements.length === 0) {
    return {
      fire: 25, 
      earth: 25, 
      air: 25, 
      water: 25, 
      balance: 50
    };
  }
  
  // Calculate weighted elemental distribution
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  let totalWeight = 0;

  playersWithElements.forEach(player => {
    if (player.element) {
      elements[player.element] += player.weight;
      totalWeight += player.weight;
    }
  });

  // Normalize to percentages
  const normalize = (value) => 
    totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 25;

  const normalizedElements = {
    fire: normalize(elements.fire),
    earth: normalize(elements.earth),
    air: normalize(elements.air),
    water: normalize(elements.water)
  };

  // Calculate balance score (higher when elements are more evenly distributed)
  const idealPercentage = 25; // Perfect balance is 25% for each element
  const deviations = Object.values(normalizedElements).map(
    value => Math.abs(value - idealPercentage)
  );
  
  // Average deviation from ideal (0 = perfect balance)
  const avgDeviation = deviations.reduce((sum, val) => sum + val, 0) / deviations.length;
  
  // Convert deviation to balance score (0-100, higher is better)
  const balance = Math.max(0, Math.min(100, 100 - (avgDeviation * 2)));

  return {
    ...normalizedElements,
    balance
  };
}

// Calculate aspects between players
export function calculateTeamAspects(weightedPlayers) {
  // Filter players with zodiac data
  const playersWithZodiac = weightedPlayers.filter(p => p.zodiacSign);
  
  if (playersWithZodiac.length < 2) {
    return {
      harmonyScore: 50,
      challengeScore: 20,
      netHarmony: 50,
      aspects: []
    };
  }

  let totalHarmony = 0;
  let totalChallenge = 0;
  let aspectCount = 0;
  const aspects = [];

  // Compare each player with every other player
  for (let i = 0; i < playersWithZodiac.length; i++) {
    for (let j = i + 1; j < playersWithZodiac.length; j++) {
      const player1 = playersWithZodiac[i];
      const player2 = playersWithZodiac[j];
      
      // Skip if either player doesn't have an element
      if (!player1.element || !player2.element) continue;
      
      // Calculate compatibility score between the two elements (0-5)
      const compatibilityScore = elementCompatibility[player1.element][player2.element];
      
      // Weight based on both players' weights
      const relationshipWeight = (player1.weight + player2.weight) / 2;
      const weightedScore = compatibilityScore * relationshipWeight;
      
      // Track harmony vs challenge
      if (compatibilityScore >= 3) {
        totalHarmony += weightedScore;
      } else {
        totalChallenge += (5 - weightedScore); // Invert for challenge score
      }
      
      // Record this aspect
      aspects.push({
        player1: player1.full_name,
        player2: player2.full_name,
        element1: player1.element,
        element2: player2.element,
        compatibilityScore,
        relationshipWeight,
        weightedScore
      });
      
      aspectCount++;
    }
  }

  // Calculate normalized scores (0-100)
  const maxPossibleScore = 5 * aspectCount; // Max score is 5 per aspect
  
  const harmonyScore = aspectCount > 0 
    ? Math.round((totalHarmony / maxPossibleScore) * 100) 
    : 50;
    
  const challengeScore = aspectCount > 0 
    ? Math.round((totalChallenge / maxPossibleScore) * 100)
    : 20;
    
  // Net harmony is weighted toward harmony, but challenges reduce the score
  const netHarmony = Math.max(0, Math.min(100, 
    harmonyScore - (challengeScore * 0.5)
  ));

  return {
    harmonyScore,
    challengeScore,
    netHarmony,
    aspects
  };
}

// Main function to calculate team chemistry
export function calculateTeamChemistry(players) {
  // Filter out players without birth dates (can't calculate zodiac without them)
  const playersWithData = players.filter(p => p.birth_date);
  
  // Handle case with insufficient data
  if (playersWithData.length < 2) {
    return {
      score: 50,
      elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
      aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
      calculatedAt: new Date().toISOString()
    };
  }

  // Calculate weighted players
  const weightedPlayers = calculatePlayerWeights(playersWithData);
  
  // Calculate components
  const elements = calculateElementalBalance(weightedPlayers);
  const aspects = calculateTeamAspects(weightedPlayers);
  
  // Calculate overall team chemistry score (0-100)
  // 60% from elemental balance, 40% from aspect harmony
  const overallScore = Math.round(
    (elements.balance * 0.6) + 
    (aspects.netHarmony * 0.4)
  );

  return {
    score: Math.min(100, Math.max(0, overallScore)),
    elements,
    aspects,
    calculatedAt: new Date().toISOString()
  };
}

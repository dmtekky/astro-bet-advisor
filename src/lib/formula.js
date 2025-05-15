
/**
 * formula.js - Proprietary astrological impact formula for sports betting
 * 
 * This module calculates the astrological influence on sports performance using:
 * - AIS (Astrological Impact Score): Weighted sum of astrological events
 * - KPW (Key Player Weighting): Impact adjustment based on player importance
 * - TAS (Team Astrological Score): Combined score for team performance
 * - PAF (Performance Adjustment Factor): Historical accuracy adjustment
 * - OAS (Odds Adjustment Score): Final betting odds adjustment
 */

import { supabase } from '@/integrations/supabase/client';
import { getZodiacSign, getMoonPhaseInfo } from '@/lib/astroCalc';

// Base weights for astrological events (initial values)
// These will be updated monthly based on prediction accuracy
let ASTROLOGICAL_WEIGHTS = {
  moon_phase: 0.15,       // Weight for moon phase influence
  moon_sign: 0.10,        // Weight for moon sign compatibility
  mercury_sign: 0.08,     // Weight for Mercury sign influence
  venus_sign: 0.07,       // Weight for Venus sign influence
  mars_sign: 0.12,        // Weight for Mars sign influence
  jupiter_sign: 0.11,     // Weight for Jupiter sign influence
  mercury_retrograde: 0.14, // Weight for Mercury retrograde effect
  sun_mars_aspect: 0.09,  // Weight for Sun-Mars aspects
  sun_saturn_aspect: 0.06, // Weight for Sun-Saturn aspects
  sun_jupiter_aspect: 0.08 // Weight for Sun-Jupiter aspects
};

// Sum of all weights should be 1.0
const validateWeights = () => {
  const sum = Object.values(ASTROLOGICAL_WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(`Warning: Astrological weights sum to ${sum}, not 1.0. Normalizing...`);
    const normalizationFactor = 1.0 / sum;
    Object.keys(ASTROLOGICAL_WEIGHTS).forEach(key => {
      ASTROLOGICAL_WEIGHTS[key] *= normalizationFactor;
    });
  }
};

// Run validation immediately on module load
validateWeights();

/**
 * Calculate Astrological Impact Score (AIS) for a player
 * 
 * @param {Object} player - Player object with birth_date
 * @param {Object} ephemeris - Daily ephemeris data
 * @return {Object} Impact score and detailed breakdown
 */
export const calculateAIS = (player, ephemeris) => {
  if (!player || !player.birth_date || !ephemeris) {
    return { 
      score: 50, 
      breakdown: { error: "Missing player data or ephemeris" },
      influences: []
    };
  }

  const birthDate = new Date(player.birth_date);
  const birthSign = getZodiacSign(birthDate);
  
  // Track detailed breakdown and influences
  const breakdown = {};
  const influences = [];
  
  // 1. Moon phase influence
  const moonPhaseInfo = getMoonPhaseInfo(ephemeris.moon_phase);
  const moonPhaseScore = moonPhaseInfo.value * 5; // Scale to 0-100 range
  breakdown.moon_phase = {
    value: moonPhaseScore,
    weight: ASTROLOGICAL_WEIGHTS.moon_phase,
    weighted: moonPhaseScore * ASTROLOGICAL_WEIGHTS.moon_phase,
    description: moonPhaseInfo.description
  };
  influences.push(`Moon phase (${moonPhaseInfo.phase}): ${moonPhaseScore > 0 ? '+' : ''}${moonPhaseScore}`);
  
  // 2. Moon sign elemental compatibility
  const moonSignScore = calculateElementalCompatibility(birthSign, ephemeris.moon_sign) * 6.25; // Scale to -100 to +100
  breakdown.moon_sign = {
    value: moonSignScore,
    weight: ASTROLOGICAL_WEIGHTS.moon_sign,
    weighted: moonSignScore * ASTROLOGICAL_WEIGHTS.moon_sign,
    description: `${birthSign} compatibility with ${ephemeris.moon_sign} moon`
  };
  influences.push(`${ephemeris.moon_sign} moon ${moonSignScore > 0 ? 'boosts' : 'challenges'} ${birthSign}`);
  
  // 3. Mercury sign influence
  const mercurySignScore = calculatePlanetSignInfluence(birthSign, ephemeris.mercury_sign, "Mercury") * 5;
  breakdown.mercury_sign = {
    value: mercurySignScore,
    weight: ASTROLOGICAL_WEIGHTS.mercury_sign,
    weighted: mercurySignScore * ASTROLOGICAL_WEIGHTS.mercury_sign,
    description: `Mercury in ${ephemeris.mercury_sign}`
  };
  
  // 4. Venus sign influence
  const venusSignScore = calculatePlanetSignInfluence(birthSign, ephemeris.venus_sign, "Venus") * 5;
  breakdown.venus_sign = {
    value: venusSignScore,
    weight: ASTROLOGICAL_WEIGHTS.venus_sign,
    weighted: venusSignScore * ASTROLOGICAL_WEIGHTS.venus_sign,
    description: `Venus in ${ephemeris.venus_sign}`
  };
  
  // 5. Mars sign influence
  const marsSignScore = calculatePlanetSignInfluence(birthSign, ephemeris.mars_sign, "Mars") * 5;
  breakdown.mars_sign = {
    value: marsSignScore,
    weight: ASTROLOGICAL_WEIGHTS.mars_sign,
    weighted: marsSignScore * ASTROLOGICAL_WEIGHTS.mars_sign,
    description: `Mars in ${ephemeris.mars_sign}`
  };
  influences.push(`Mars in ${ephemeris.mars_sign}: ${marsSignScore > 0 ? '+' : ''}${marsSignScore}`);
  
  // 6. Jupiter sign influence
  const jupiterSignScore = calculatePlanetSignInfluence(birthSign, ephemeris.jupiter_sign, "Jupiter") * 5;
  breakdown.jupiter_sign = {
    value: jupiterSignScore,
    weight: ASTROLOGICAL_WEIGHTS.jupiter_sign,
    weighted: jupiterSignScore * ASTROLOGICAL_WEIGHTS.jupiter_sign,
    description: `Jupiter in ${ephemeris.jupiter_sign}`
  };
  
  // 7. Mercury retrograde effect
  const mercuryRetrogradeScore = ephemeris.mercury_retrograde ? -15 : 0;
  breakdown.mercury_retrograde = {
    value: mercuryRetrogradeScore,
    weight: ASTROLOGICAL_WEIGHTS.mercury_retrograde,
    weighted: mercuryRetrogradeScore * ASTROLOGICAL_WEIGHTS.mercury_retrograde,
    description: ephemeris.mercury_retrograde ? "Mercury retrograde (negative)" : "Mercury direct (neutral)"
  };
  if (ephemeris.mercury_retrograde) {
    influences.push(`Mercury retrograde: ${mercuryRetrogradeScore}`);
  }
  
  // 8. Sun-Mars aspect
  const sunMarsAspect = ephemeris.aspects?.sun_mars || null;
  const sunMarsScore = getAspectScore(sunMarsAspect);
  breakdown.sun_mars_aspect = {
    value: sunMarsScore,
    weight: ASTROLOGICAL_WEIGHTS.sun_mars_aspect,
    weighted: sunMarsScore * ASTROLOGICAL_WEIGHTS.sun_mars_aspect,
    description: sunMarsAspect ? `Sun-Mars ${sunMarsAspect}` : "No Sun-Mars aspect"
  };
  if (sunMarsAspect) {
    influences.push(`Sun-Mars ${sunMarsAspect}: ${sunMarsScore > 0 ? '+' : ''}${sunMarsScore}`);
  }
  
  // 9. Sun-Saturn aspect
  const sunSaturnAspect = ephemeris.aspects?.sun_saturn || null;
  const sunSaturnScore = getAspectScore(sunSaturnAspect);
  breakdown.sun_saturn_aspect = {
    value: sunSaturnScore,
    weight: ASTROLOGICAL_WEIGHTS.sun_saturn_aspect,
    weighted: sunSaturnScore * ASTROLOGICAL_WEIGHTS.sun_saturn_aspect,
    description: sunSaturnAspect ? `Sun-Saturn ${sunSaturnAspect}` : "No Sun-Saturn aspect"
  };
  if (sunSaturnAspect) {
    influences.push(`Sun-Saturn ${sunSaturnAspect}: ${sunSaturnScore > 0 ? '+' : ''}${sunSaturnScore}`);
  }
  
  // 10. Sun-Jupiter aspect
  const sunJupiterAspect = ephemeris.aspects?.sun_jupiter || null;
  const sunJupiterScore = getAspectScore(sunJupiterAspect);
  breakdown.sun_jupiter_aspect = {
    value: sunJupiterScore,
    weight: ASTROLOGICAL_WEIGHTS.sun_jupiter_aspect,
    weighted: sunJupiterScore * ASTROLOGICAL_WEIGHTS.sun_jupiter_aspect,
    description: sunJupiterAspect ? `Sun-Jupiter ${sunJupiterAspect}` : "No Sun-Jupiter aspect"
  };
  if (sunJupiterAspect) {
    influences.push(`Sun-Jupiter ${sunJupiterAspect}: ${sunJupiterScore > 0 ? '+' : ''}${sunJupiterScore}`);
  }
  
  // Calculate final weighted score (scale to 0-100 range)
  let totalWeightedScore = 0;
  Object.keys(breakdown).forEach(key => {
    totalWeightedScore += breakdown[key].weighted;
  });
  
  // Normalize to 0-100 range
  const finalScore = Math.min(100, Math.max(0, totalWeightedScore + 50)); // Add 50 to center around 50
  
  return {
    score: Math.round(finalScore),
    breakdown: breakdown,
    influences: influences.slice(0, 5) // Limit to top 5 influences
  };
};

/**
 * Calculate Key Player Weighting (KPW) - adjusts player importance based on win shares
 * 
 * @param {Number} aisScore - Player's Astrological Impact Score
 * @param {Number} winShares - Player's win shares (measure of contribution)
 * @param {Number} avgTeamWinShares - Average win shares for team
 * @return {Object} Weighted impact and details
 */
export const calculateKPW = (aisScore, winShares, avgTeamWinShares = 5.0) => {
  if (typeof winShares !== 'number' || typeof aisScore !== 'number') {
    return { 
      weightedImpact: aisScore || 50,
      playerWeight: 1.0,
      details: "Invalid data, using unmodified score"
    };
  }
  
  // Calculate player's importance relative to average
  const relativeImportance = winShares / avgTeamWinShares;
  
  // Apply diminishing returns formula to prevent outliers from dominating
  const playerWeight = Math.min(2.0, 0.5 + (0.5 * Math.log10(1 + relativeImportance)));
  
  // Calculate the weighted impact
  // Higher win shares = more impact (positive or negative) from astrological score
  // Using distance from neutral (50) to determine magnitude of effect
  const deviation = aisScore - 50;
  const weightedDeviation = deviation * playerWeight;
  const weightedImpact = 50 + weightedDeviation;
  
  return {
    weightedImpact: Math.round(Math.min(100, Math.max(0, weightedImpact))),
    playerWeight: playerWeight.toFixed(2),
    details: `Player with ${winShares} win shares (${playerWeight.toFixed(2)}x weight factor)`
  };
};

/**
 * Calculate Team Astrological Score (TAS)
 * 
 * @param {Array} players - Array of player objects with AIS and KPW calculated
 * @param {Object} teamEphemeris - Additional team-specific astrological factors (optional)
 * @return {Object} Team score and detailed breakdown
 */
export const calculateTAS = (players, teamEphemeris = null) => {
  if (!players || !Array.isArray(players) || players.length === 0) {
    return { 
      score: 50, 
      keyPlayersScore: 50,
      rolePlayersScore: 50,
      teamSpirit: 0,
      details: "Insufficient player data"
    };
  }
  
  // Separate key players (high win shares) from role players
  let keyPlayers = [];
  let rolePlayers = [];
  
  players.forEach(player => {
    if (player.kpw && player.kpw.playerWeight >= 1.2) {
      keyPlayers.push(player);
    } else {
      rolePlayers.push(player);
    }
  });
  
  // Calculate team scores
  const calculateGroupScore = (playerGroup) => {
    if (playerGroup.length === 0) return 50; // Neutral if no players
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    playerGroup.forEach(player => {
      const weight = parseFloat(player.kpw?.playerWeight || 1.0);
      const score = player.ais?.score || 50;
      
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 50;
  };
  
  // Calculate key players and role players scores
  const keyPlayersScore = calculateGroupScore(keyPlayers);
  const rolePlayersScore = calculateGroupScore(rolePlayers);
  
  // Weight distribution between key players and role players
  const keyPlayersWeight = 0.7; // 70% influence from key players
  const rolePlayersWeight = 0.3; // 30% influence from role players
  
  // Calculate team spirit (synergy between players)
  // This is a measure of how similar or complementary the astrological profiles are
  let teamSpirit = 0;
  
  if (players.length > 1) {
    // Calculate standard deviation of player scores
    // Lower deviation = better team spirit (more consistency)
    const scores = players.map(p => p.ais?.score || 50);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to team spirit score (-10 to +10)
    // Lower deviation = higher team spirit
    teamSpirit = Math.max(-10, Math.min(10, 10 - (stdDev / 5)));
  }
  
  // Calculate final team score
  const rawTeamScore = (keyPlayersScore * keyPlayersWeight) + 
                       (rolePlayersScore * rolePlayersWeight) +
                       teamSpirit;
                       
  // Ensure score is within 0-100 range
  const finalTeamScore = Math.min(100, Math.max(0, rawTeamScore));
  
  return {
    score: Math.round(finalTeamScore),
    keyPlayersScore: Math.round(keyPlayersScore),
    rolePlayersScore: Math.round(rolePlayersScore),
    teamSpirit: teamSpirit.toFixed(1),
    keyPlayersCount: keyPlayers.length,
    rolePlayersCount: rolePlayers.length,
    details: `Team score based on ${keyPlayers.length} key players and ${rolePlayers.length} role players`
  };
};

/**
 * Calculate Performance Adjustment Factor (PAF) based on historical accuracy
 * 
 * @param {String} entityId - Player or team ID
 * @param {Boolean} isTeam - Whether the entity is a team
 * @param {String} sportType - Type of sport (e.g., 'nba', 'nfl')
 * @return {Promise<Object>} Adjustment factor and confidence
 */
export const calculatePAF = async (entityId, isTeam = false, sportType = 'nba') => {
  if (!entityId) {
    return {
      adjustmentFactor: 1.0,
      confidence: 0,
      mse: null,
      sampleSize: 0,
      details: "No historical data available"
    };
  }
  
  try {
    // Fetch historical predictions and actual performance
    const { data: historicalData, error } = await supabase
      .from(isTeam ? 'team_predictions' : 'player_predictions')
      .select('prediction_score, actual_performance, prediction_date')
      .eq('entity_id', entityId)
      .eq('sport', sportType)
      .order('prediction_date', { ascending: false })
      .limit(10); // Last 10 predictions
    
    if (error || !historicalData || historicalData.length === 0) {
      return {
        adjustmentFactor: 1.0,
        confidence: 0,
        mse: null,
        sampleSize: 0,
        details: "No historical data available"
      };
    }
    
    // Calculate Mean Squared Error (MSE)
    let sumSquaredErrors = 0;
    historicalData.forEach(record => {
      const error = record.actual_performance - record.prediction_score;
      sumSquaredErrors += error * error;
    });
    
    const mse = sumSquaredErrors / historicalData.length;
    
    // Calculate confidence based on sample size and MSE
    // Higher sample size + lower MSE = higher confidence
    const sampleSizeFactor = Math.min(1.0, historicalData.length / 10); // Max out at 10 samples
    const mseFactor = Math.max(0, 1 - (mse / 2500)); // Scale MSE (0-50 error range)
    const confidence = sampleSizeFactor * mseFactor * 100;
    
    // Calculate adjustment factor
    // If our predictions tend to be too high (MSE > 0), reduce our score
    // If our predictions tend to be too low (MSE < 0), increase our score
    const avgError = historicalData.reduce((sum, record) => {
      return sum + (record.prediction_score - record.actual_performance);
    }, 0) / historicalData.length;
    
    // Calculate adjustment factor - larger corrections for confident assessments
    const maxAdjustment = 0.25; // Max 25% adjustment
    const adjustmentFactor = 1.0 - ((avgError / 100) * (confidence / 100) * maxAdjustment);
    
    return {
      adjustmentFactor: Math.max(0.75, Math.min(1.25, adjustmentFactor)),
      confidence: Math.round(confidence),
      mse: Math.round(mse * 100) / 100,
      sampleSize: historicalData.length,
      details: `Based on ${historicalData.length} historical predictions with MSE: ${Math.round(mse * 100) / 100}`
    };
  } catch (err) {
    console.error("Error calculating PAF:", err);
    return {
      adjustmentFactor: 1.0,
      confidence: 0,
      mse: null,
      sampleSize: 0,
      details: "Error retrieving historical data"
    };
  }
};

/**
 * Calculate Odds Adjustment Score (OAS)
 * 
 * @param {Number} baseScore - Base astrological score (TAS)
 * @param {Number} adjustmentFactor - Performance adjustment factor
 * @param {Object} currentOdds - Current betting odds
 * @return {Object} Adjusted odds recommendation and detailed breakdown
 */
export const calculateOAS = (baseScore, adjustmentFactor = 1.0, currentOdds = null) => {
  // Apply adjustment factor to base score
  const adjustedScore = baseScore * adjustmentFactor;
  
  // Calculate deviation from neutral (50)
  const deviation = adjustedScore - 50;
  
  // Scale deviation to odds impact (-20% to +20% max odds adjustment)
  const oddsImpact = (deviation / 50) * 0.2;
  
  // Calculate money line equivalent if provided with current odds
  let recommendedMoneyLine = null;
  let oddsShift = "neutral";
  
  if (currentOdds && currentOdds.moneyLine) {
    const currentML = currentOdds.moneyLine;
    const currentImpliedProb = moneyLineToImpliedProbability(currentML);
    
    // Adjust implied probability by oddsImpact
    const adjustedImpliedProb = Math.min(0.95, Math.max(0.05, currentImpliedProb * (1 + oddsImpact)));
    
    // Convert back to money line
    recommendedMoneyLine = impliedProbabilityToMoneyLine(adjustedImpliedProb);
    
    // Determine shift direction
    if (recommendedMoneyLine < currentML) {
      oddsShift = "favorable";
    } else if (recommendedMoneyLine > currentML) {
      oddsShift = "unfavorable";
    }
  }
  
  // Calculate a betting recommendation score (0-100)
  // Higher = stronger bet recommendation
  const recommendationStrength = Math.round(Math.min(100, Math.max(0, 50 + (deviation * 1.5))));
  
  return {
    bettingRecommendation: recommendationStrength,
    recommendationCategory: getBettingCategory(recommendationStrength),
    adjustedScore: Math.round(adjustedScore),
    oddsImpact: (oddsImpact * 100).toFixed(1) + "%",
    oddsShift: oddsShift,
    recommendedMoneyLine: recommendedMoneyLine,
    details: `${adjustmentFactor < 1 ? "Reduced" : "Increased"} base score by factor of ${adjustmentFactor.toFixed(2)}`
  };
};

/**
 * Update astrological weight factors based on prediction accuracy
 * 
 * @param {String} sport - Sport type (e.g., 'nba', 'nfl')
 * @param {Object} customConfig - Optional configuration parameters
 * @return {Promise<Object>} Updated weights and statistics
 */
export const updateAstrologicalWeights = async (sport = 'nba', customConfig = {}) => {
  // Configuration with defaults
  const config = {
    lookbackDays: customConfig.lookbackDays || 30,
    learningRate: customConfig.learningRate || 0.05,
    minSampleSize: customConfig.minSampleSize || 50,
    ...customConfig
  };
  
  try {
    // Get date for lookback period
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - config.lookbackDays);
    const lookbackDateStr = lookbackDate.toISOString().split('T')[0];
    
    // Fetch all predictions and actual results within lookback period
    const { data: predictions, error } = await supabase
      .from('predictions_analysis')
      .select('prediction_data, factor_weights, actual_performance')
      .eq('sport', sport)
      .gte('prediction_date', lookbackDateStr);
      
    if (error || !predictions || predictions.length < config.minSampleSize) {
      console.warn(`Insufficient data (${predictions?.length || 0} samples) to update weights for ${sport}`);
      return {
        updated: false,
        oldWeights: {...ASTROLOGICAL_WEIGHTS},
        newWeights: {...ASTROLOGICAL_WEIGHTS},
        sampleSize: predictions?.length || 0,
        message: `Insufficient data to update weights (minimum ${config.minSampleSize} samples required)`
      };
    }
    
    // Calculate prediction errors for each factor
    const factorErrors = {};
    let totalPredictions = 0;
    
    // Initialize factor errors
    Object.keys(ASTROLOGICAL_WEIGHTS).forEach(factor => {
      factorErrors[factor] = {
        sumError: 0,
        sumAbsError: 0,
        count: 0
      };
    });
    
    // Process each prediction
    predictions.forEach(prediction => {
      if (!prediction.prediction_data || !prediction.factor_weights) return;
      
      const actualPerformance = prediction.actual_performance;
      const predictionData = prediction.prediction_data;
      
      // For each factor, calculate error contribution
      Object.keys(ASTROLOGICAL_WEIGHTS).forEach(factor => {
        if (predictionData[factor] !== undefined) {
          const factorValue = predictionData[factor].value;
          const factorWeight = prediction.factor_weights[factor];
          
          // Calculate how this factor contributed to error
          const factorScore = factorValue * factorWeight;
          const factorError = factorScore - (actualPerformance * factorWeight);
          
          factorErrors[factor].sumError += factorError;
          factorErrors[factor].sumAbsError += Math.abs(factorError);
          factorErrors[factor].count++;
        }
      });
      
      totalPredictions++;
    });
    
    // Calculate mean errors
    const meanErrors = {};
    Object.keys(factorErrors).forEach(factor => {
      if (factorErrors[factor].count > 0) {
        meanErrors[factor] = factorErrors[factor].sumError / factorErrors[factor].count;
      } else {
        meanErrors[factor] = 0;
      }
    });
    
    // Store old weights for comparison
    const oldWeights = {...ASTROLOGICAL_WEIGHTS};
    
    // Update weights based on errors
    // Factors with larger errors get reduced weights
    Object.keys(ASTROLOGICAL_WEIGHTS).forEach(factor => {
      if (factorErrors[factor].count > 0) {
        const meanAbsError = factorErrors[factor].sumAbsError / factorErrors[factor].count;
        const errorScale = 1 - (meanAbsError / 100); // Scale error to factor (0-1)
        const adjustment = 1 + (errorScale - 0.5) * config.learningRate;
        
        // Apply adjustment with limits
        ASTROLOGICAL_WEIGHTS[factor] *= adjustment;
        
        // Ensure weight doesn't go below minimum
        ASTROLOGICAL_WEIGHTS[factor] = Math.max(0.01, ASTROLOGICAL_WEIGHTS[factor]);
      }
    });
    
    // Normalize weights to sum to 1.0
    validateWeights();
    
    // Calculate improvement metrics
    const newWeights = {...ASTROLOGICAL_WEIGHTS};
    const weightChanges = {};
    let totalChange = 0;
    
    Object.keys(oldWeights).forEach(factor => {
      const change = ((newWeights[factor] - oldWeights[factor]) / oldWeights[factor]) * 100;
      weightChanges[factor] = change.toFixed(1) + "%";
      totalChange += Math.abs(change);
    });
    
    // Store updated weights in Supabase
    const { error: updateError } = await supabase
      .from('formula_weights')
      .upsert({
        sport: sport,
        weights: newWeights,
        last_updated: new Date().toISOString(),
        sample_size: totalPredictions,
        metric_changes: weightChanges
      });
    
    if (updateError) {
      console.error("Error storing updated weights:", updateError);
    }
    
    return {
      updated: true,
      oldWeights: oldWeights,
      newWeights: newWeights,
      weightChanges: weightChanges,
      totalChangePercent: (totalChange / Object.keys(oldWeights).length).toFixed(1) + "%",
      sampleSize: totalPredictions,
      message: `Successfully updated weights based on ${totalPredictions} predictions`
    };
  } catch (err) {
    console.error("Error updating astrological weights:", err);
    return {
      updated: false,
      error: err.message,
      message: "Error occurred while updating weights"
    };
  }
};

/**
 * Load the latest astrological weights from the database
 * 
 * @param {String} sport - Sport type
 * @return {Promise<Object>} Latest weights
 */
export const loadLatestWeights = async (sport = 'nba') => {
  try {
    const { data, error } = await supabase
      .from('formula_weights')
      .select('weights, last_updated')
      .eq('sport', sport)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !data) {
      console.warn(`No stored weights found for ${sport}, using defaults`);
      return {
        success: false,
        weights: ASTROLOGICAL_WEIGHTS
      };
    }
    
    // Update module weights
    ASTROLOGICAL_WEIGHTS = data.weights;
    
    // Ensure weights are valid
    validateWeights();
    
    return {
      success: true,
      weights: ASTROLOGICAL_WEIGHTS,
      lastUpdated: data.last_updated
    };
  } catch (err) {
    console.error("Error loading latest weights:", err);
    return {
      success: false,
      weights: ASTROLOGICAL_WEIGHTS,
      error: err.message
    };
  }
};

/**
 * Run a complete astrological analysis for a team
 * 
 * @param {Array} teamPlayers - Array of players in the team with birth_date
 * @param {Object} teamData - Team information
 * @param {Object} ephemeris - Current ephemeris data
 * @param {Object} oddsData - Current betting odds data (optional)
 * @return {Promise<Object>} Complete astrological analysis
 */
export const runTeamAnalysis = async (teamPlayers, teamData, ephemeris, oddsData = null) => {
  if (!teamPlayers || teamPlayers.length === 0 || !ephemeris) {
    return {
      teamId: teamData?.id,
      teamName: teamData?.name,
      overallScore: 50,
      bettingRecommendation: 50,
      message: "Insufficient data for analysis"
    };
  }
  
  // Load latest weights for the sport
  await loadLatestWeights(teamData.sport);
  
  // Step 1: Calculate AIS for each player
  const playerResults = teamPlayers.map(player => {
    const ais = calculateAIS(player, ephemeris);
    return {
      id: player.id,
      name: player.name,
      position: player.position,
      winShares: player.win_shares || 0,
      ais: ais
    };
  });
  
  // Step 2: Apply KPW to each player
  // Calculate average win shares first
  const totalWinShares = playerResults.reduce((sum, player) => sum + (player.winShares || 0), 0);
  const avgWinShares = totalWinShares / playerResults.length;
  
  const weightedPlayerResults = playerResults.map(player => {
    const kpw = calculateKPW(player.ais.score, player.winShares, avgWinShares);
    return {
      ...player,
      kpw: kpw
    };
  });
  
  // Step 3: Calculate Team Astrological Score (TAS)
  const tas = calculateTAS(weightedPlayerResults);
  
  // Step 4: Calculate Performance Adjustment Factor (PAF)
  const paf = await calculatePAF(teamData.id, true, teamData.sport);
  
  // Step 5: Calculate Odds Adjustment Score (OAS) 
  const oas = calculateOAS(tas.score, paf.adjustmentFactor, oddsData);
  
  // Compile detailed analysis
  return {
    timestamp: new Date().toISOString(),
    teamId: teamData.id,
    teamName: teamData.name,
    sport: teamData.sport,
    
    // Scores
    baseScore: tas.score,
    adjustedScore: oas.adjustedScore,
    
    // Recommendations
    bettingRecommendation: oas.bettingRecommendation,
    recommendationCategory: oas.recommendationCategory,
    
    // Odds
    currentOdds: oddsData,
    oddsImpact: oas.oddsImpact,
    recommendedOdds: oas.recommendedMoneyLine,
    
    // Key influences
    keyPlayers: weightedPlayerResults
      .filter(p => p.kpw.playerWeight >= 1.2)
      .map(p => ({
        name: p.name,
        score: p.ais.score,
        weight: p.kpw.playerWeight,
        influences: p.ais.influences.slice(0, 2)
      })),
    teamSpirit: tas.teamSpirit,
    
    // Performance metrics
    confidence: paf.confidence,
    sampleSize: paf.sampleSize,
    
    // Raw data for records
    detailedAnalysis: {
      tas: tas,
      paf: paf,
      oas: oas,
      playerScores: weightedPlayerResults.map(p => ({ 
        id: p.id, 
        name: p.name, 
        score: p.ais.score,
        weight: p.kpw.playerWeight
      }))
    }
  };
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Calculate elemental compatibility between two zodiac signs
 * 
 * @param {String} sign1 - First zodiac sign
 * @param {String} sign2 - Second zodiac sign
 * @return {Number} Compatibility score (-16 to +16)
 */
const calculateElementalCompatibility = (sign1, sign2) => {
  const elements = {
    Aries: 'fire',
    Leo: 'fire',
    Sagittarius: 'fire',
    Taurus: 'earth',
    Virgo: 'earth',
    Capricorn: 'earth',
    Gemini: 'air',
    Libra: 'air',
    Aquarius: 'air',
    Cancer: 'water',
    Scorpio: 'water',
    Pisces: 'water'
  };
  
  const element1 = elements[sign1];
  const element2 = elements[sign2];
  
  if (!element1 || !element2) return 0;
  
  // Same element - harmonious
  if (element1 === element2) return 16;
  
  // Complementary elements
  if (
    (element1 === 'fire' && element2 === 'air') ||
    (element1 === 'air' && element2 === 'fire') ||
    (element1 === 'water' && element2 === 'earth') ||
    (element1 === 'earth' && element2 === 'water')
  ) {
    return 8;
  }
  
  // Challenging elements
  if (
    (element1 === 'fire' && element2 === 'water') ||
    (element1 === 'water' && element2 === 'fire') ||
    (element1 === 'air' && element2 === 'earth') ||
    (element1 === 'earth' && element2 === 'air')
  ) {
    return -16;
  }
  
  // Neutral
  return 0;
};

/**
 * Calculate planetary sign influence on a birth sign
 * 
 * @param {String} birthSign - Birth zodiac sign
 * @param {String} planetSign - Current planet's zodiac sign
 * @param {String} planet - Planet name
 * @return {Number} Influence score (-10 to +10)
 */
const calculatePlanetSignInfluence = (birthSign, planetSign, planet) => {
  // Planet in same sign as birth sign (very favorable)
  if (birthSign === planetSign) return 10;
  
  // Calculate elemental compatibility
  const elementalCompat = calculateElementalCompatibility(birthSign, planetSign) / 2;
  
  // Special aspects based on planet and sign
  let specialAspect = 0;
  
  switch (planet) {
    case "Mercury":
      // Mercury in communication signs boosts intellectual signs
      if (['Gemini', 'Virgo', 'Aquarius'].includes(planetSign) &&
          ['Gemini', 'Libra', 'Aquarius'].includes(birthSign)) {
        specialAspect = 5;
      }
      break;
      
    case "Venus":
      // Venus in harmony signs boosts social/relationship signs
      if (['Taurus', 'Libra'].includes(planetSign) && 
          ['Libra', 'Taurus', 'Leo'].includes(birthSign)) {
        specialAspect = 5;
      }
      break;
      
    case "Mars":
      // Mars in action signs boosts physical/athletic signs
      if (['Aries', 'Scorpio'].includes(planetSign) && 
          ['Aries', 'Leo', 'Scorpio', 'Capricorn'].includes(birthSign)) {
        specialAspect = 6;
      }
      break;
      
    case "Jupiter":
      // Jupiter in expansion signs boosts growth/optimism signs
      if (['Sagittarius', 'Pisces'].includes(planetSign) && 
          ['Sagittarius', 'Leo', 'Aquarius'].includes(birthSign)) {
        specialAspect = 6;
      }
      break;
  }
  
  return elementalCompat + specialAspect;
};

/**
 * Get score for an astrological aspect
 * 
 * @param {String} aspect - Aspect type
 * @return {Number} Score value
 */
const getAspectScore = (aspect) => {
  if (!aspect) return 0;
  
  const aspectScores = {
    conjunction: 15,
    opposition: -10,
    trine: 12,
    square: -8,
    sextile: 8
  };
  
  return aspectScores[aspect] || 0;
};

/**
 * Convert money line odds to implied probability
 * 
 * @param {Number} moneyLine - Money line odds
 * @return {Number} Implied probability (0-1)
 */
const moneyLineToImpliedProbability = (moneyLine) => {
  if (!moneyLine) return 0.5;
  
  if (moneyLine > 0) {
    return 100 / (moneyLine + 100);
  } else {
    return Math.abs(moneyLine) / (Math.abs(moneyLine) + 100);
  }
};

/**
 * Convert implied probability to money line odds
 * 
 * @param {Number} probability - Implied probability (0-1)
 * @return {Number} Money line odds
 */
const impliedProbabilityToMoneyLine = (probability) => {
  if (!probability || probability <= 0 || probability >= 1) {
    return 0;
  }
  
  if (probability < 0.5) {
    return Math.round((100 / probability) - 100);
  } else {
    return Math.round(-1 * ((probability * 100) / (1 - probability)));
  }
};

/**
 * Get betting recommendation category based on score
 * 
 * @param {Number} score - Recommendation score (0-100)
 * @return {String} Recommendation category
 */
const getBettingCategory = (score) => {
  if (score >= 80) return "Strong bet";
  if (score >= 65) return "Good opportunity";
  if (score >= 55) return "Slight edge";
  if (score <= 20) return "Strong fade";
  if (score <= 35) return "Avoid";
  if (score <= 45) return "Slight fade";
  return "Neutral";
};

/**
 * Example calculation for a sample player
 */
export const runSamplePlayerCalculation = (ephemeris) => {
  // Sample player data
  const samplePlayer = {
    id: "sample-player-1",
    name: "John Smith",
    birth_date: "1992-06-15",
    position: "PG",
    win_shares: 8.2,
    sport: "nba"
  };
  
  // Calculate AIS
  const ais = calculateAIS(samplePlayer, ephemeris);
  
  // Calculate KPW
  const kpw = calculateKPW(ais.score, samplePlayer.win_shares, 5.0);
  
  return {
    player: samplePlayer,
    astrological_score: ais.score,
    key_influences: ais.influences,
    weighted_impact: kpw.weightedImpact,
    player_weight: kpw.playerWeight
  };
};

/**
 * Example calculation for a sample team
 */
export const runSampleTeamCalculation = (ephemeris) => {
  // Sample team data
  const sampleTeam = {
    id: "sample-team-1",
    name: "Phoenix Suns",
    sport: "nba"
  };
  
  // Sample players
  const samplePlayers = [
    {
      id: "player-1",
      name: "Star Player",
      birth_date: "1994-09-29",
      position: "SG",
      win_shares: 12.5
    },
    {
      id: "player-2",
      name: "Veteran Leader",
      birth_date: "1988-04-20",
      position: "PF",
      win_shares: 8.3
    },
    {
      id: "player-3",
      name: "Role Player 1",
      birth_date: "1996-01-12",
      position: "PG",
      win_shares: 4.7
    },
    {
      id: "player-4",
      name: "Role Player 2",
      birth_date: "1997-11-05",
      position: "C", 
      win_shares: 3.2
    },
    {
      id: "player-5",
      name: "Bench Player",
      birth_date: "1999-06-30",
      position: "SF",
      win_shares: 1.8
    }
  ];
  
  // Calculate AIS for each player
  const playerResults = samplePlayers.map(player => {
    const ais = calculateAIS(player, ephemeris);
    return {
      ...player,
      ais: ais
    };
  });
  
  // Calculate average win shares
  const totalWinShares = samplePlayers.reduce((sum, player) => sum + (player.win_shares || 0), 0);
  const avgWinShares = totalWinShares / samplePlayers.length;
  
  // Apply KPW to each player
  const weightedPlayerResults = playerResults.map(player => {
    const kpw = calculateKPW(player.ais.score, player.win_shares, avgWinShares);
    return {
      ...player,
      kpw: kpw
    };
  });
  
  // Calculate TAS
  const tas = calculateTAS(weightedPlayerResults);
  
  // Sample current odds
  const currentOdds = {
    moneyLine: -150,
    spread: -4,
    overUnder: 220.5
  };
  
  // Sample PAF (would normally be calculated from historical data)
  const paf = {
    adjustmentFactor: 0.92, // Historically over-performing predictions
    confidence: 75,
    mse: 14.6,
    sampleSize: 12
  };
  
  // Calculate OAS
  const oas = calculateOAS(tas.score, paf.adjustmentFactor, currentOdds);
  
  // Return complete analysis
  return {
    team: sampleTeam,
    baseScore: tas.score,
    adjustedScore: oas.adjustedScore,
    bettingRecommendation: oas.bettingRecommendation,
    recommendationCategory: oas.recommendationCategory,
    keyPlayers: weightedPlayerResults
      .filter(p => p.kpw.playerWeight >= 1.2)
      .map(p => ({
        name: p.name,
        score: p.ais.score,
        weight: p.kpw.playerWeight
      })),
    teamSpirit: tas.teamSpirit,
    currentOdds: currentOdds,
    recommendedOdds: oas.recommendedMoneyLine,
    oddsImpact: oas.oddsImpact
  };
};

/**
 * Initialize module
 * This function loads the latest weights and sets up any recurring tasks
 */
export const initializeModule = async () => {
  // Load the latest weights for the default sport (NBA)
  await loadLatestWeights('nba');
  
  console.log("Astrological Formula module initialized");
  return true;
};

// Initialize module on load
initializeModule();

// Make all functions available
export default {
  calculateAIS,
  calculateKPW,
  calculateTAS,
  calculatePAF,
  calculateOAS,
  updateAstrologicalWeights,
  loadLatestWeights,
  runTeamAnalysis,
  runSamplePlayerCalculation,
  runSampleTeamCalculation
};

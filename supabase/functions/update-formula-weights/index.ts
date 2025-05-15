
// update-formula-weights/index.ts
// Edge function to periodically update astrological weights based on prediction accuracy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Define cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FormulaWeight {
  factor: string;
  weight: number;
  error_contribution?: number;
}

interface PredictionRecord {
  id: string;
  prediction_data: Record<string, any>;
  factor_weights: Record<string, number>;
  actual_performance: number;
  error: number;
}

interface SportSettings {
  minSampleSize: number;
  learningRate: number;
  lookbackDays: number;
}

// Different settings for different sports
const sportSettings: Record<string, SportSettings> = {
  nba: { minSampleSize: 50, learningRate: 0.05, lookbackDays: 30 },
  nfl: { minSampleSize: 30, learningRate: 0.04, lookbackDays: 60 },
  mlb: { minSampleSize: 40, learningRate: 0.05, lookbackDays: 30 },
  soccer: { minSampleSize: 35, learningRate: 0.04, lookbackDays: 45 },
  boxing: { minSampleSize: 20, learningRate: 0.03, lookbackDays: 90 },
  default: { minSampleSize: 30, learningRate: 0.04, lookbackDays: 45 }
};

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return null;
}

// Update formula weights for a specific sport
async function updateWeights(sport: string): Promise<Record<string, any>> {
  const settings = sportSettings[sport] || sportSettings.default;
  
  try {
    console.log(`Updating formula weights for ${sport}`);
    
    // Get lookback date
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - settings.lookbackDays);
    const lookbackDateStr = lookbackDate.toISOString().split('T')[0];
    
    // Get current weights
    const { data: currentWeightsData, error: weightError } = await supabase
      .from('formula_weights')
      .select('*')
      .eq('sport', sport)
      .order('last_updated', { ascending: false })
      .limit(1);
      
    if (weightError) {
      console.error(`Error fetching current weights: ${weightError.message}`);
      return { success: false, error: weightError.message };
    }
    
    // Use default weights if none found
    const currentWeights = currentWeightsData && currentWeightsData.length > 0
      ? currentWeightsData[0].weights
      : {
          moon_phase: 0.15,
          moon_sign: 0.10,
          mercury_sign: 0.08,
          venus_sign: 0.07,
          mars_sign: 0.12,
          jupiter_sign: 0.11,
          mercury_retrograde: 0.14,
          sun_mars_aspect: 0.09,
          sun_saturn_aspect: 0.06,
          sun_jupiter_aspect: 0.08
        };
    
    // Fetch prediction data
    const { data: predictions, error: predictionError } = await supabase
      .from('predictions_analysis')
      .select('prediction_data, factor_weights, actual_performance')
      .eq('sport', sport)
      .gte('prediction_date', lookbackDateStr);
      
    if (predictionError) {
      console.error(`Error fetching predictions: ${predictionError.message}`);
      return { success: false, error: predictionError.message };
    }
    
    // Check if we have enough data
    if (!predictions || predictions.length < settings.minSampleSize) {
      console.log(`Insufficient data (${predictions?.length || 0} samples) for ${sport}`);
      return {
        success: false,
        message: `Insufficient data (${predictions?.length || 0} samples, need ${settings.minSampleSize})`,
        currentWeights
      };
    }
    
    // Process prediction data
    const factorErrors: Record<string, {sumError: number, sumAbsError: number, count: number}> = {};
    
    // Initialize factor errors
    Object.keys(currentWeights).forEach(factor => {
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
      Object.keys(currentWeights).forEach(factor => {
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
    });
    
    // Calculate mean errors
    const meanErrors: Record<string, number> = {};
    Object.keys(factorErrors).forEach(factor => {
      if (factorErrors[factor].count > 0) {
        meanErrors[factor] = factorErrors[factor].sumError / factorErrors[factor].count;
      } else {
        meanErrors[factor] = 0;
      }
    });
    
    // Update weights based on errors
    const newWeights = {...currentWeights};
    
    Object.keys(newWeights).forEach(factor => {
      if (factorErrors[factor].count > 0) {
        const meanAbsError = factorErrors[factor].sumAbsError / factorErrors[factor].count;
        const errorScale = 1 - (meanAbsError / 100); // Scale error to factor (0-1)
        const adjustment = 1 + (errorScale - 0.5) * settings.learningRate;
        
        // Apply adjustment with limits
        newWeights[factor] *= adjustment;
        
        // Ensure weight doesn't go below minimum
        newWeights[factor] = Math.max(0.01, newWeights[factor]);
      }
    });
    
    // Normalize weights to sum to 1.0
    const weightSum = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 1.0) > 0.001) {
      const normalizationFactor = 1.0 / weightSum;
      Object.keys(newWeights).forEach(factor => {
        newWeights[factor] *= normalizationFactor;
      });
    }
    
    // Calculate changes
    const weightChanges: Record<string, string> = {};
    let totalChange = 0;
    
    Object.keys(currentWeights).forEach(factor => {
      const change = ((newWeights[factor] - currentWeights[factor]) / currentWeights[factor]) * 100;
      weightChanges[factor] = change.toFixed(1) + "%";
      totalChange += Math.abs(change);
    });
    
    // Store updated weights
    const { data: updateData, error: updateError } = await supabase
      .from('formula_weights')
      .insert({
        sport,
        weights: newWeights,
        last_updated: new Date().toISOString(),
        sample_size: predictions.length,
        metric_changes: weightChanges
      });
    
    if (updateError) {
      console.error(`Error storing updated weights: ${updateError.message}`);
      return { success: false, error: updateError.message };
    }
    
    console.log(`Successfully updated weights for ${sport} based on ${predictions.length} predictions`);
    
    // Return result
    return {
      success: true,
      sport,
      oldWeights: currentWeights,
      newWeights,
      weightChanges,
      totalChangePercent: (totalChange / Object.keys(currentWeights).length).toFixed(1) + "%",
      sampleSize: predictions.length
    };
  } catch (err) {
    console.error(`Exception updating weights for ${sport}: ${err}`);
    return { success: false, error: err.message };
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Check if specific sport requested
    const url = new URL(req.url);
    const requestedSport = url.searchParams.get('sport');
    
    if (requestedSport) {
      // Update weights for specific sport
      const result = await updateWeights(requestedSport);
      
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } else {
      // Update weights for all major sports
      const sports = ['nba', 'nfl', 'mlb', 'soccer', 'boxing'];
      const results: Record<string, any> = {};
      
      for (const sport of sports) {
        results[sport] = await updateWeights(sport);
      }
      
      return new Response(JSON.stringify({ 
        success: true,
        results,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } catch (err) {
    console.error(`Error in update-formula-weights function: ${err}`);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

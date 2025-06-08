// Import ES modules
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createBrotliDecompress } from 'zlib';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import logger from './logger.js';

// Create require for JSON imports if needed
const require = (await import('node:module')).createRequire(import.meta.url);

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const config = {
  supabase: {
    url: process.env.PUBLIC_SUPABASE_URL,
    key: process.env.PUBLIC_SUPABASE_KEY,
    tableName: 'nba_player_season_stats_2025'  // Updated table name
  },
  msf: {
    apiKey: process.env.MY_SPORTS_FEEDS_API_KEY,
    password: process.env.MY_SPORTS_FEEDS_PASSWORD,
    season: process.env.MSF_SEASON || '2024-2025-regular',
    apiHost: 'api.mysportsfeeds.com'
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    batchSize: parseInt(process.env.BATCH_SIZE || '50', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10)
  }
};

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

/**
 * Gets the zodiac sign based on birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {Object} Zodiac sign information or null if invalid date
 */
function getZodiacSign(birthDate) {
  if (!birthDate) return null;
  
  try {
    const date = DateTime.fromISO(birthDate);
    if (!date.isValid) return null;
    
    const month = date.month;
    const day = date.day;
    
    // Zodiac sign date ranges
    const zodiacSigns = [
      { name: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 }, element: 'fire' },
      { name: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 }, element: 'earth' },
      { name: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 }, element: 'air' },
      { name: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 }, element: 'water' },
      { name: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 }, element: 'fire' },
      { name: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 }, element: 'earth' },
      { name: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 }, element: 'air' },
      { name: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 }, element: 'water' },
      { name: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 }, element: 'fire' },
      { name: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 }, element: 'earth' },
      { name: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 }, element: 'air' },
      { name: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 }, element: 'water' }
    ];
    
    // Find the matching zodiac sign
    for (const sign of zodiacSigns) {
      if ((month === sign.start.month && day >= sign.start.day) ||
          (month === sign.end.month && day <= sign.end.day)) {
        return sign;
      }
    }
    
    // Handle Capricorn (crosses year boundary)
    return zodiacSigns[9]; // Capricorn
    
  } catch (error) {
    logger.error('Error determining zodiac sign:', error);
    return null;
  }
}

/**
 * Calculates astrological influence based on player data and zodiac sign
 * @param {Object} playerData - Player data
 * @param {Object} zodiacSign - Zodiac sign information
 * @returns {number} Astro influence score (0-100)
 */
function calculateAstroInfluence(playerData, zodiacSign) {
  if (!zodiacSign) return 50; // Default to neutral if no zodiac sign
  
  // Base influence based on zodiac element
  const elementInfluence = {
    fire: 60,
    earth: 55,
    air: 50,
    water: 65
  };
  
  // Adjust based on moon phase (simplified)
  const now = DateTime.now();
  const moonPhase = (now.toMillis() / 1000) % 2551443; // Approximate moon cycle in seconds
  const moonInfluence = Math.sin(moonPhase / (2551443 / (2 * Math.PI))) * 10; // -10 to 10
  
  // Random factor for variability
  const randomFactor = (Math.random() * 20) - 10; // -10 to 10
  
  // Calculate final influence (clamped between 0 and 100)
  let influence = elementInfluence[zodiacSign.element] + moonInfluence + randomFactor;
  influence = Math.max(0, Math.min(100, influence));
  
  // Ensure exactly 2 decimal places
  return parseFloat(influence.toFixed(2));
}

/**
 * Calculates a comprehensive impact score based on all available player stats
 * @param {Object} stats - Player statistics
 * @returns {number} Impact score (0-100)
 */
function calculateImpactScore(stats) {
  if (!stats) return 0;

  // Define weights for each stat category (positive impact)
  const positiveWeights = {
    // Scoring efficiency
    points: 0.25,
    field_goal_pct: 0.15,
    three_point_pct: 0.10,
    free_throw_pct: 0.02,
    
    // Playmaking
    assists: 0.15,
    
    // Rebounding
    total_rebounds: 0.10,
    offensive_rebounds: 0.02,
    defensive_rebounds: 0.02,
    
    // Defense
    steals: 0.05,
    blocks: 0.05,
    
    // Plus/Minus (heavily weighted)
    plus_minus: 0.35,
    
    // Playing time (minimal weight)
    minutes_played: 0.01,
    games_played: 0.001,
    games_started: 0.001
  };

  // Define negative impact stats
  const negativeWeights = {
    turnovers: -0.03,
    personal_fouls: -0.01,
    field_goals_attempted: -0.002,
    three_point_attempted: -0.002,
    free_throws_attempted: -0.001
  };

  // Normalization factors (per game basis)
  const maxValues = {
    points: 40,
    assists: 15,
    total_rebounds: 20,
    offensive_rebounds: 10,
    defensive_rebounds: 15,
    steals: 4,
    blocks: 5,
    turnovers: 8,
    personal_fouls: 6,
    field_goals_attempted: 30,
    three_point_attempted: 15,
    free_throws_attempted: 15,
    minutes_played: 48,
    games_played: 82,
    games_started: 82
  };

  // Calculate positive impact (without plus/minus for now)
  let positiveScore = 0;
  let totalPositiveWeight = 0;
  let plusMinusValue = 0;

  for (const [stat, weight] of Object.entries(positiveWeights)) {
    if (stats[stat] !== undefined) {
      if (stat === 'plus_minus') {
        plusMinusValue = stats[stat]; // Store for later use
      } else {
        const normalizedValue = stats[stat] / (maxValues[stat] || 1);
        positiveScore += normalizedValue * weight;
        totalPositiveWeight += weight;
      }
    }
  }

  // Calculate negative impact (reduced weight)
  let negativeScore = 0;
  let totalNegativeWeight = 0;

  for (const [stat, weight] of Object.entries(negativeWeights)) {
    if (stats[stat] !== undefined) {
      const normalizedValue = stats[stat] / (maxValues[stat] || 1);
      negativeScore += normalizedValue * weight;
      totalNegativeWeight += Math.abs(weight);
    }
  }

  // Calculate base score from positive and negative contributions
  const positiveContribution = positiveScore / Math.max(1, totalPositiveWeight);
  const negativeContribution = negativeScore / Math.max(1, totalNegativeWeight);
  
  // Combine with 70/30 weighting in favor of positive impact
  let finalScore = (positiveContribution * 0.7) + (negativeContribution * 0.3);
  
  // Apply efficiency multipliers
  if (stats.field_goal_pct) finalScore *= (0.9 + (stats.field_goal_pct / 100 * 0.1));
  if (stats.three_point_pct) finalScore *= (0.9 + (stats.three_point_pct / 100 * 0.1));
  if (stats.free_throw_pct) finalScore *= (0.95 + (stats.free_throw_pct / 100 * 0.05));
  
  // Apply plus/minus as a major adjustment with stronger negative impact
  if (plusMinusValue !== 0) {
    if (plusMinusValue > 0) {
      // For positive plus/minus, apply a moderate boost (scales with value)
      const pmBoost = Math.min(1, plusMinusValue / 15) * 0.2; // Max 20% boost
      finalScore = finalScore * (0.9 + pmBoost);
    } else {
      // For negative plus/minus, apply a stronger penalty (scales with value)
      const pmPenalty = Math.min(1, Math.abs(plusMinusValue) / 10) * 0.5; // Up to 50% penalty
      finalScore = finalScore * (1 - pmPenalty);
    }
  }

  // Normalize to 0-100 range and round to nearest whole number
  finalScore = Math.round(Math.max(0, Math.min(100, finalScore * 100)));
  return finalScore;
}

/**
 * Fetches player details from MySportsFeeds API
 * @param {number} playerId - Player ID
 * @returns {Promise<Object>} Player details
 */
/**
 * Fetches player details with retry logic and rate limiting
 * @param {number} playerId - Player ID to fetch
 * @param {number} retries - Number of retry attempts remaining
 * @returns {Promise<Object>} Player details or null if not found
 */
async function fetchPlayerDetails(playerId, retries = 3) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://${config.msf.apiHost}/v2.1/pull/nba/players.json?player=${playerId}`;
      
      // Add jitter to avoid thundering herd
      const jitter = Math.random() * 1000;
      await delay(jitter);
      
      const response = await axios.get(url, { 
        auth: {
          username: config.msf.apiKey,
          password: config.msf.password
        },
        headers: {
          'Accept-Encoding': 'gzip',
          'Accept': 'application/json',
          'User-Agent': 'AstroBetAdvisor/1.0'
        },
        decompress: true,
        timeout: 10000 // 10 second timeout
      });
      
      if (response.status === 200 && response.data.players?.length > 0) {
        return response.data.players[0].player;
      }
      
      // If we get a 200 but no players, no need to retry
      if (response.status === 200) {
        logger.warn(`No player data found for ID ${playerId}`);
        return null;
      }
      
    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      const retryAfter = error.response?.headers?.['retry-after'] || 5;
      
      if (isRateLimit) {
        const waitTime = parseInt(retryAfter, 10) * 1000 * attempt;
        logger.warn(`Rate limited. Waiting ${waitTime}ms before retry ${attempt}/${retries} for player ${playerId}`);
        await delay(waitTime);
        continue;
      }
      
      logger.error(`Error fetching player ${playerId} (attempt ${attempt}/${retries}):`, error.message);
      
      // For non-rate limit errors, wait with exponential backoff
      if (attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s
        logger.warn(`Retrying in ${backoff}ms...`);
        await delay(backoff);
      }
    }
  }
  
  logger.error(`Failed to fetch player ${playerId} after ${retries} attempts`);
  return null;
}

/**
 * Updates player astro scores in the database
 * @param {Object} player - Player data
 * @param {Object} playerDetails - Player details
 * @returns {Promise<void>}
 */
async function updatePlayerAstroScores(player, playerDetails) {
  try {
    // Get or calculate astrological data
    const zodiacSign = playerDetails.birthDate ? getZodiacSign(playerDetails.birthDate) : null;
    const astroInfluence = calculateAstroInfluence(playerDetails, zodiacSign);
    const impactScore = calculateImpactScore(player);
    
    // Only update the astro-related fields
    const updateData = {
      msf_player_id: player.msf_player_id,
      zodiac_sign: zodiacSign?.name || null,
      zodiac_element: zodiacSign?.element || null,
      astro_influence: astroInfluence,
      impact_score: impactScore,
      updated_at: new Date().toISOString()
    };
    
    logger.debug(`Updating astro scores for player ${player.player_name} (${player.msf_player_id})`);
    
    // Update only the astro fields
    const { error } = await supabase
      .from('nba_player_season_stats_2025')
      .update(updateData)
      .eq('msf_player_id', player.msf_player_id);
    
    if (error) {
      logger.error(`Error updating player ${player.msf_player_id}:`, error);
    } else {
      logger.debug(`Successfully updated astro scores for ${player.player_name}`);
    }
  } catch (error) {
    logger.error(`Error updating astro scores for player ${player.player_name || 'unknown'}:`, error.message);
    throw error;
  }
}

/**
 * Bulk fetch player data from nba_players table
 * @param {string[]} playerExternalIds - Array of external_player_id values to fetch data for
 * @returns {Promise<Object>} Map of external_player_id to player data
 */
async function fetchPlayerData(playerExternalIds) {
  const BATCH_SIZE = 900; // Stay under Supabase's 1000 param limit
  const playerDataMap = {};
  
  for (let i = 0; i < playerExternalIds.length; i += BATCH_SIZE) {
    const batchIds = playerExternalIds.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('nba_players')
      .select('*') // Select all columns
      .in('external_player_id', batchIds);
      
    if (error) {
      logger.error('Error fetching player data:', error);
      throw error;
    }
    
    // Map by external_player_id for easy lookup
    for (const player of data) {
      if (player.external_player_id) {
        playerDataMap[player.external_player_id] = player;
      }
    }
  }
  
  return playerDataMap;
}

/**
 * Main function to sync NBA player astro scores
 */
async function syncNBAPlayerStats() {
  try {
    logger.info('Starting NBA player astro scores update');
    
    // First, get all players from the database
    const { data: players, error: fetchError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*');
      
    if (fetchError) throw fetchError;
    
    logger.info(`Found ${players.length} players in database to update with astro scores`);
    
    // Step 1: Collect all external player IDs that we need data for
    const externalPlayerIds = players
      .filter(p => p.msf_player_id)
      .map(p => p.msf_player_id);

    logger.info(`Fetching data for ${externalPlayerIds.length} players...`);
    
    // Step 2: Fetch all player data in bulk
    const playerDataMap = await fetchPlayerData(externalPlayerIds);
    logger.info(`Fetched data for ${Object.keys(playerDataMap).length} players`);
    
    // Step 3: Process players in batches
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < players.length; i += BATCH_SIZE) {
      const batch = players.slice(i, i + BATCH_SIZE);
      logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(players.length / BATCH_SIZE)}`);
      
      await Promise.all(batch.map(async (player) => {
        try {
          if (player.msf_player_id && playerDataMap[player.msf_player_id]) {
            await updatePlayerAstroScores(player, playerDataMap[player.msf_player_id]);
          } else {
            logger.warn(`No player data found for ID: ${player.msf_player_id}`);
          }
        } catch (error) {
          logger.error(`Error processing player ${player.player_name || player.msf_player_id}:`, error.message);
        }
      }));
    }
    
    logger.info('NBA player astro scores update completed successfully');
  } catch (error) {
    logger.error('Error updating NBA player astro scores:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncNBAPlayerStats().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}

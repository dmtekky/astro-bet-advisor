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

// Promisify zlib functions
const brotliDecompress = promisify(createBrotliDecompress);

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate required environment variables
const requiredEnvVars = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_KEY', 'MY_SPORTS_FEEDS_API_KEY', 'MY_SPORTS_FEEDS_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configuration
const config = {
  supabase: {
    url: process.env.PUBLIC_SUPABASE_URL,
    key: process.env.PUBLIC_SUPABASE_KEY,
    tableName: 'nba_player_season_stats'
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

// Using imported logger

// Zodiac sign date ranges
const ZODIAC_SIGNS = [
  { name: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 }, element: 'fire' },
  { name: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 }, element: 'earth' },
  { name: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 }, element: 'air' },
  { name: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 }, element: 'water' },
  { name: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 }, element: 'fire' },
  { name: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 }, element: 'earth' },
  { name: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 }, element: 'air' },
  { name: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 }, element: 'water' },
  { name: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 }, element: 'fire' },
  { name: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 12, day: 31 }, element: 'earth' },
  { name: 'Capricorn', start: { month: 1, day: 1 }, end: { month: 1, day: 19 }, element: 'earth' },
  { name: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 }, element: 'air' },
  { name: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 }, element: 'water' },
];

// Elemental multipliers for different stats
const ELEMENT_MULTIPLIERS = {
  fire: { points: 1.2, assists: 0.8, rebounds: 0.9, steals: 1.1, blocks: 1.0 },
  earth: { points: 0.9, assists: 1.0, rebounds: 1.2, steals: 0.9, blocks: 1.1 },
  air: { points: 1.0, assists: 1.3, rebounds: 0.8, steals: 1.2, blocks: 0.8 },
  water: { points: 1.1, assists: 1.1, rebounds: 1.0, steals: 0.8, blocks: 1.2 }
};

/**
 * Fetches NBA player stats from the database
 */
async function fetchNBAPlayerStats() {
  try {
    logger.info('Fetching NBA player stats from database...');
    
    // First, get the list of players from nba_players
    const { data: players, error: playersError } = await supabase
      .from('nba_players')
      .select('*')
      .not('birth_date', 'is', null)
      .not('external_player_id', 'is', null);

    if (playersError) {
      logger.error('Error fetching players:', playersError);
      throw playersError;
    }

    logger.info(`Fetched ${players.length} players from nba_players`);
    
    // Get all player stats from nba_player_season_stats_2025
    const { data: allStats, error: statsError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*');

    if (statsError) {
      logger.error('Error fetching player stats:', statsError);
      throw statsError;
    }

    logger.info(`Fetched ${allStats.length} player stats from nba_player_season_stats_2025`);
    
    // Create a map of player_id to stats for easy lookup
    const statsMap = new Map(allStats.map(stat => [stat.msf_player_id, stat]));
    
    // Combine player data with their stats
    const playersWithStats = players.map(player => {
      const playerStats = statsMap.get(player.external_player_id) || {};
      return {
        id: player.id,
        external_id: player.external_player_id,
        first_name: player.first_name,
        last_name: player.last_name,
        birth_date: player.birth_date,
        team_id: player.team_id,
        stats: playerStats
      };
    });
    
    logger.info(`Successfully combined data for ${playersWithStats.length} players`);
    return playersWithStats;
  } catch (error) {
    logger.error('Error in fetchNBAPlayerStats:', error);
    throw error;
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
async function withRetry(fn, operation, maxRetries = config.app.maxRetries, retryDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed for ${operation}. Retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Gets zodiac sign based on birth date
 */
function getZodiacSign(birthDate) {
  if (!birthDate) return null;
  
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // JS months are 0-indexed
  const day = date.getDate();

  // Handle Capricorn (straddles year end)
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { name: 'Capricorn', element: 'earth' };
  }

  // Check other signs
  for (const sign of ZODIAC_SIGNS) {
    if ((month === sign.start.month && day >= sign.start.day) || 
        (month === sign.end.month && day <= sign.end.day)) {
      return { name: sign.name, element: sign.element };
    }
  }
  
  return null;
}

/**
 * Calculates astrological influence score based on player stats and zodiac element
 */
function calculateAstroInfluence(playerStats, zodiacSign) {
  if (!zodiacSign || !playerStats) return 0;
  
  const element = zodiacSign.element;
  if (!element || !ELEMENT_MULTIPLIERS[element]) return 0;
  
  const multipliers = ELEMENT_MULTIPLIERS[element];
  const stats = playerStats.stats || {};
  
  // Get stat values with fallbacks
  const points = parseFloat(stats.pts || 0) || 0;
  const assists = parseFloat(stats.ast || 0) || 0;
  const rebounds = parseFloat(stats.reb || 0) || 0;
  const steals = parseFloat(stats.stl || 0) || 0;
  const blocks = parseFloat(stats.blk || 0) || 0;
  const fgPct = parseFloat(stats.fg_pct || 0) || 0;
  const ftPct = parseFloat(stats.ft_pct || 0) || 0;
  const tov = parseFloat(stats.tov || 0) || 0;
  
  // Calculate base score with element multipliers
  let score = (
    (points * multipliers.points) +
    (assists * multipliers.assists) +
    (rebounds * multipliers.rebounds) +
    (steals * multipliers.steals) +
    (blocks * multipliers.blocks) -
    (tov * 1.5) + // Penalize turnovers
    (fgPct * 100 * 0.5) + // Shooting percentages
    (ftPct * 100 * 0.3)
  ) / 5; // Normalize to a reasonable range
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Upserts player stats to Supabase
 */
async function upsertPlayerStats(playerData) {
  return withRetry(async () => {
    const { player, stats, zodiacSign, astroInfluence } = playerData;
    
    // Validate required fields
    if (!player?.id) {
      throw new Error('Missing player ID');
    }
    
    // Calculate impact score based on player stats
    const impactScore = calculateImpactScore(stats);
    
    const playerRecord = {
      player_id: player.id, // Reference to nba_players table
      season: config.msf.season,
      team_id: player.team?.abbreviation, // Using abbreviation as team_id
      games_played: stats.gamesPlayed || 0,
      minutes: stats.minutes || 0,
      points: stats.points || 0,
      rebounds: stats.rebounds || 0,
      assists: stats.assists || 0,
      steals: stats.steals || 0,
      blocks: stats.blocks || 0,
      turnovers: stats.turnovers || 0,
      field_goals_made: stats.fieldGoalsMade || 0,
      field_goals_attempted: stats.fieldGoalsAttempted || 0,
      three_point_made: stats.threePointersMade || 0,
      three_point_attempted: stats.threePointersAttempted || 0,
      free_throws_made: stats.freeThrowsMade || 0,
      free_throws_attempted: stats.freeThrowsAttempted || 0,
      offensive_rebounds: stats.offensiveRebounds || 0,
      defensive_rebounds: stats.defensiveRebounds || 0,
      personal_fouls: stats.personalFouls || 0,
      plus_minus: stats.plusMinus || 0,
      games_started: stats.gamesStarted || 0,
      field_goal_pct: stats.fieldGoalPercentage || 0,
      three_point_pct: stats.threePointPercentage || 0,
      free_throw_pct: stats.freeThrowPercentage || 0,
      // Astro fields
      zodiac_sign: zodiacSign?.name || null,
      zodiac_element: zodiacSign?.element || null,
      astro_influence: astroInfluence,
      impact_score: impactScore,
      // Additional tracking
      last_updated: new Date().toISOString(),
      raw_stats: stats
    };
    
    logger.debug(`Upserting player ${player.id} (${player.firstName} ${player.lastName})`);
    
    const { data, error } = await supabase
      .from(config.supabase.tableName)
      .upsert(
        { ...playerRecord },
        { 
          onConflict: 'player_id,season',
          ignoreDuplicates: false
        }
      )
      .select();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No data returned from upsert operation');
    }
    
    return data[0];
  }, `upsertPlayerStats for player ${playerData?.player?.id || 'unknown'}`);
}

/**
 * Calculates an impact score based on player statistics
 * @param {Object} stats - Player statistics
 * @returns {number} - Calculated impact score
 */
function calculateImpactScore(stats) {
  if (!stats) return 0;
  
  // Base score on per-game averages if available
  const games = stats.gamesPlayed || 1; // Avoid division by zero
  
  // Calculate per-game stats
  const perGame = {
    points: (stats.points || 0) / games,
    rebounds: (stats.rebounds || 0) / games,
    assists: (stats.assists || 0) / games,
    steals: (stats.steals || 0) / games,
    blocks: (stats.blocks || 0) / games,
    turnovers: (stats.turnovers || 0) / games,
    fgPct: stats.fieldGoalPercentage || 0,
    ftPct: stats.freeThrowPercentage || 0,
    threePct: stats.threePointPercentage || 0
  };
  
  // Weighted components of the impact score
  const components = {
    // Scoring (points weighted by efficiency)
    scoring: perGame.points * (0.5 + perGame.fgPct / 2),
    
    // Playmaking (assists minus turnovers)
    playmaking: (perGame.assists * 2) - (perGame.turnovers * 0.5),
    
    // Rebounding (with slight bonus for offensive boards)
    rebounding: perGame.rebounds + (perGame.offensiveRebounds * 0.5),
    
    // Defense (blocks and steals)
    defense: (perGame.steals * 2) + (perGame.blocks * 1.5),
    
    // Efficiency bonuses
    efficiency: (perGame.fgPct + perGame.ftPct + perGame.threePct) * 10
  };
  
  // Calculate weighted sum
  const weights = {
    scoring: 1.0,
    playmaking: 0.8,
    rebounding: 0.6,
    defense: 0.7,
    efficiency: 0.5
  };
  
  // Calculate total score
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [key, value] of Object.entries(components)) {
    totalScore += value * (weights[key] || 1);
    totalWeight += weights[key] || 1;
  }
  
  // Normalize to a 0-100 scale
  const normalizedScore = Math.min(100, Math.max(0, (totalScore / totalWeight) * 10));
  
  return parseFloat(normalizedScore.toFixed(2));
}

/**
 * Main function to sync NBA player stats with astrological influence scores
 */
async function processPlayerBatch(batch) {
  const results = [];
  
  for (const playerStat of batch) {
    try {
      const player = playerStat.player;
      if (!player) {
        logger.warn('Skipping player with missing player data');
        continue;
      }
      
      const stats = playerStat.stats || {};
      
      // Get zodiac sign based on birth date
      const zodiacSign = getZodiacSign(player.birthDate);
      
      // Calculate astrological influence score
      const astroInfluence = calculateAstroInfluence(playerStat, zodiacSign);
      
      // Upsert player stats with astro influence
      const result = await upsertPlayerStats({
        player,
        stats,
        zodiacSign,
        astroInfluence
      });
      
      results.push({
        playerId: player.id,
        name: `${player.firstName} ${player.lastName}`,
        success: true,
        result
      });
      
    } catch (error) {
      logger.error(`Error processing player ${playerStat.player?.id || 'unknown'}:`, error);
      results.push({
        playerId: playerStat.player?.id || 'unknown',
        name: playerStat.player ? `${playerStat.player.firstName} ${playerStat.player.lastName}` : 'unknown',
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Main function to sync NBA player stats with astrological influence scores
 */
async function syncNBAAstroScores() {
  const startTime = Date.now();
  logger.info('Starting NBA player stats and astro influence sync...');
  
  try {
    // 1. Fetch player stats from MySportsFeeds
    logger.info('Fetching NBA player stats...');
    const playerStats = await fetchNBAPlayerStats();
    
    if (!playerStats || !Array.isArray(playerStats)) {
      throw new Error('No player stats returned from API');
    }
    
    logger.info(`Fetched stats for ${playerStats.length} players`);
    
    // 2. Process players in batches to avoid overwhelming the database
    const batchSize = config.app.batchSize;
    let processed = 0;
    let successful = 0;
    const errors = [];
    
    for (let i = 0; i < playerStats.length; i += batchSize) {
      const batch = playerStats.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, playerStats.length)} of ${playerStats.length})`);
      
      try {
        const batchResults = await processPlayerBatch(batch);
        
        // Update counters
        const batchSuccess = batchResults.filter(r => r.success).length;
        const batchErrors = batchResults.filter(r => !r.success);
        
        successful += batchSuccess;
        errors.push(...batchErrors);
        processed += batch.length;
        
        logger.info(`Processed batch: ${batchSuccess} successful, ${batchErrors.length} failed`);
        
        // Add a small delay between batches if not the last batch
        if (i + batchSize < playerStats.length) {
          const delayMs = 1000; // 1 second delay
          logger.debug(`Waiting ${delayMs}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (batchError) {
        logger.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: batchError.message
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Sync completed in ${duration}s. Successfully processed ${successful} of ${playerStats.length} players.`);
    
    if (errors.length > 0) {
      logger.warn(`Encountered ${errors.length} errors during sync`);
      if (config.app.nodeEnv !== 'production') {
        logger.debug('Error details:', JSON.stringify(errors.slice(0, 5), null, 2));
      }
    }
    
    return { 
      success: successful > 0, 
      processed: playerStats.length, 
      successful, 
      failed: errors.length,
      duration: `${duration}s`,
      errors: config.app.nodeEnv !== 'production' ? errors : errors.length
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error(`Sync failed after ${duration}s:`, error);
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}s`
    };
  }
}

// Main execution
async function main() {
  try {
    logger.info('Starting NBA Astro Scores Sync');
    
    // Execute the sync
    const result = await syncNBAAstroScores();
    
    if (result.success) {
      logger.info(`Sync completed successfully in ${result.duration}`);
      logger.info(`Processed: ${result.processed}, Successful: ${result.successful}, Failed: ${result.failed}`);
      
      if (result.failed > 0) {
        logger.warn(`Encountered ${result.failed} errors during sync`);
        if (config.app.nodeEnv !== 'production' && result.errors) {
          logger.debug('First 5 errors:', JSON.stringify(result.errors, null, 2));
        }
      }
      
      process.exit(0);
    } else {
      logger.error(`Sync failed after ${result.duration}: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error during sync:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Start the sync
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for testing
export {
  syncNBAAstroScores,
  calculateAstroInfluence,
  getZodiacSign,
  withRetry,
  config,
  fetchNBAPlayerStats
};

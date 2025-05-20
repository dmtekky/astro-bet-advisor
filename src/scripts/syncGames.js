/**
 * Weekly Sync Script for The Odds API
 * 
 * This script fetches NBA and MLB game data from The Odds API
 * and stores it in Supabase. It's designed to be run once per week
 * to minimize API usage while keeping game data up-to-date.
 * 
 * Usage:
 * - Run manually: node syncGames.js
 * - Set up as a cron job to run weekly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import TeamMatchingService from '../services/teamMatching.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { access, constants } from 'fs/promises';

// Get the project root directory (3 levels up from src/scripts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = '/Users/dmtekk/Desktop/FMO1/astro-bet-advisor';

// Load environment variables from .env file in the project root
const envPath = '/Users/dmtekk/Desktop/FMO1/astro-bet-advisor/.env';

// Use synchronous file operations to load .env
import { existsSync, readFileSync } from 'fs';

if (existsSync(envPath)) {
  console.log('Found .env file at:', envPath);
  console.log('Reading .env file content...');
  const envContent = readFileSync(envPath, 'utf8');
  console.log('.env content:', envContent);
  
  const envConfig = dotenv.parse(envContent);
  console.log('Parsed environment variables:', JSON.stringify(envConfig, null, 2));
  
  // Merge with process.env
  Object.assign(process.env, envConfig);
  
  console.log('Successfully loaded environment variables from .env file');
  console.log(`- VITE_THE_ODDS_API_KEY: ${process.env.VITE_THE_ODDS_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`- VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`- VITE_SUPABASE_KEY: ${process.env.VITE_SUPABASE_KEY ? 'Set' : 'Not set'}`);
  
  // Debug: List all environment variables
  console.log('All environment variables:', Object.keys(process.env).join(', '));
} else {
  console.log('No .env file found, using system environment variables');
  console.log('Current working directory:', process.cwd());
  console.log('All environment variables:', Object.keys(process.env).join(', '));
}

// API key for The Odds API
const API_KEY = process.env.VITE_THE_ODDS_API_KEY || process.env.THE_ODDS_API_KEY;

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;

// Validate required environment variables
if (!API_KEY || !supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:');
  console.error(`- VITE_THE_ODDS_API_KEY: ${API_KEY ? 'Set' : 'Missing'}`);
  console.error(`- VITE_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
  console.error(`- VITE_SUPABASE_KEY: ${supabaseKey ? 'Set' : 'Missing'}`);
  throw new Error('Missing required environment variables. Please check your .env file or system environment variables.');
}

// Initialize Supabase client
console.log('Initializing Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Initialize team matching service
const teamMatching = new TeamMatchingService(supabase);
await teamMatching.initialize();

// Sports to sync
const SPORTS = ['basketball_nba', 'baseball_mlb'];

/**
 * Syncs game schedules from The Odds API to Supabase with team integration
 * @param {string} sport - The sport key to sync
 * @returns {Promise<{success: boolean, gameCount?: number, error?: string}>}
 */
async function syncGameSchedules(sport) {
  const { sport: sportType, league } = getSportAndLeague(sport);
  try {
    console.log(`Syncing ${sport} games...`);
    
    // Fetch games from The Odds API
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const games = await response.json();
    if (!games || !games.length) {
      console.log(`No ${sport} games found to sync`);
      return { success: true, gameCount: 0 };
    }

    // Store raw response in cached_odds
    try {
      const { error: cacheError } = await supabase
        .from('cached_odds')
        .upsert({
          sport,
          data: games,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'sport'
        });

      if (cacheError) {
        console.error('Error caching odds:', cacheError);
      }
    } catch (cacheError) {
      console.error('Error in cache operation:', cacheError);
    }

    const { sport: sportType, league } = getSportAndLeague(sport);
    const gameRecords = [];
    for (const game of games) {
      try {
        console.log(`\nProcessing game: ${game.home_team} vs ${game.away_team}`);
        
        // Find or create home team
        const homeTeam = await teamMatching.findOrCreateTeam(
          game.home_team,
          sportType,
          league
        );
        
        if (!homeTeam || !homeTeam.id) {
          console.error(`Failed to process home team: ${game.home_team}`);
          continue;
        }
        
        // Find or create away team
        const awayTeam = await teamMatching.findOrCreateTeam(
          game.away_team,
          sportType,
          league
        );
        
        if (!awayTeam || !awayTeam.id) {
          console.error(`Failed to process away team: ${game.away_team}`);
          continue;
        }
        
        // Create game record
        const gameRecord = {
          home_team: homeTeam.name,
          away_team: awayTeam.name,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          game_time: game.commence_time,
          status: 'scheduled',
          last_updated: new Date().toISOString(),
          odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes || [],
          sport_type: sportType,
          metadata: {
            original_home_team: game.home_team,
            original_away_team: game.away_team,
            home_team_confidence: homeTeam.confidence || 0,
            away_team_confidence: awayTeam.confidence || 0,
            home_team_is_new: homeTeam.isNew || false,
            away_team_is_new: awayTeam.isNew || false
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Generate a unique game ID
        const gameId = `${sportType}_${game.home_team.replace(/\s+/g, '_')}_${game.away_team.replace(/\s+/g, '_')}_${new Date(game.commence_time).getTime()}`;
        gameRecord.id = gameId;
        
        console.log(`Adding game record: ${gameId}`);
        gameRecords.push(gameRecord);
        
      } catch (error) {
        console.error(`Error processing game ${game.home_team} vs ${game.away_team} [${sportType}]:`, error);
      }
    }
    if (gameRecords.length > 0) {
      const { error } = await supabase
        .from('schedules')
        .upsert(gameRecords, { onConflict: 'id' });
      if (error) throw error;
      console.log(`✅ Successfully synced ${gameRecords.length} ${sportType} games`);
    }
    return gameRecords;
  } catch (error) {
    console.error(`❌ Sync failed for ${sportType}:`, error);
    throw error;
  }
}

function getSportAndLeague(sportType) {
  if (sportType.includes('basketball')) {
    return { sport: 'basketball', league: 'NBA' };
  } else if (sportType.includes('baseball')) {
    return { sport: 'baseball', league: 'MLB' };
  }
  return { sport: 'other', league: 'OTHER' };
}

async function syncAllSports() {
  try {
    const sports = ['basketball_nba', 'baseball_mlb'];
    
    for (const sport of sports) {
      console.log(`\nSyncing ${sport}...`);
      await syncGameSchedules(sport);
    }
    
    console.log('\n✅ Sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAllSports()
    .then(() => {
      console.log('Sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}

export {
  syncGameSchedules,
  syncAllSports
};

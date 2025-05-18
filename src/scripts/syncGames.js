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

// Sports to sync
const SPORTS = ['basketball_nba', 'baseball_mlb'];

/**
 * Syncs game schedules from The Odds API to Supabase with team integration
 * @param {string} sport - The sport key to sync
 * @returns {Promise<{success: boolean, gameCount?: number, error?: string}>}
 */
async function syncGameSchedules(sport) {
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

    // Match teams with existing teams in the database
    // Process each game to include team IDs
    const processedGames = [];
    
    for (const game of games) {
      // Find home team in teams table
      const { data: homeTeam } = await supabase
        .from('teams')
        .select('id, name')
        .or(`name.eq.${game.home_team},name.ilike.${game.home_team}`)
        .eq('sport', sport.includes('basketball') ? 'nba' : 'mlb')
        .limit(1)
        .single();

      // Find away team in teams table
      const { data: awayTeam } = await supabase
        .from('teams')
        .select('id, name')
        .or(`name.eq.${game.away_team},name.ilike.${game.away_team}`)
        .eq('sport', sport.includes('basketball') ? 'nba' : 'mlb')
        .limit(1)
        .single();

      // Determine sport type based on the sport key
      const sportType = sport.includes('basketball') ? 'basketball' : 
                      sport.includes('baseball') ? 'baseball' : 'other';
      
      // Prepare game record matching the existing schedules table structure
      const gameRecord = {
        home_team: game.home_team,
        away_team: game.away_team,
        game_time: game.commence_time,
        status: 'scheduled',
        last_updated: new Date().toISOString(),
        odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes || [],
        sport_type: sportType
      };
      
      // Set the ID based on home_team, away_team, and game_time
      const gameId = `${sportType}_${game.home_team.replace(/\s+/g, '_')}_${game.away_team.replace(/\s+/g, '_')}_${new Date(game.commence_time).getTime()}`;
      gameRecord.id = gameId;

      processedGames.push(gameRecord);
    }

    // Upsert processed games to schedules table
    const { error: upsertError } = await supabase
      .from('schedules')
      .upsert(processedGames, { onConflict: 'id' });

    if (upsertError) {
      throw new Error(`Error upserting games: ${upsertError.message}`);
    }

    console.log(`✅ Successfully synced ${processedGames.length} ${sport} games`);
    return { success: true, gameCount: processedGames.length };

  } catch (error) {
    console.error(`❌ Sync failed for ${sport}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to sync all sports
 */
async function syncAllSports() {
  try {
    console.log('Starting sync for all sports...');
    console.log(`Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
    
    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);
      
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    
    console.log('Successfully connected to Supabase');
    
    // Sync each sport
    for (const sport of SPORTS) {
      console.log(`\nSyncing ${sport}...`);
      await syncGameSchedules(sport);
      console.log(`Completed sync for ${sport}`);
    }
    
    console.log('\nSync completed successfully');
    return { success: true, message: 'Sync completed successfully' };
  } catch (error) {
    console.error('Error during sync:', error);
    return { success: false, error: error.message };
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

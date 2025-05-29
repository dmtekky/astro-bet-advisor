// Script to fetch player data from API-Sports Baseball API
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Constants
const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = 'https://v1.baseball.api-sports.io';
const TEAM_ID = 29; // Arizona Diamondbacks (assuming this is their ID)
const SEASON = 2025;
const LEAGUE_ID = 1; // MLB

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchPlayerStats() {
  console.log('Fetching player stats from API-Sports...');
  console.log(`API Key: ${API_KEY ? '✓ Found' : '✗ Missing'}`);
  
  try {
    // First, fetch team players
    const playersUrl = `${BASE_URL}/players?team=${TEAM_ID}&season=${SEASON}`;
    console.log(`Requesting: ${playersUrl}`);
    
    const playersResponse = await fetch(playersUrl, {
      headers: {
        'x-rapidapi-host': 'v1.baseball.api-sports.io',
        'x-rapidapi-key': API_KEY
      }
    });
    
    if (!playersResponse.ok) {
      throw new Error(`API request for players failed: ${playersResponse.status} ${playersResponse.statusText}`);
    }
    
    const playersData = await playersResponse.json();
    console.log(`Retrieved ${playersData.results || 0} players`);
    
    // Save the raw response to a file for examination
    fs.writeFileSync(
      path.join(__dirname, 'api-sports-players-response.json'),
      JSON.stringify(playersData, null, 2)
    );
    console.log('Saved raw players response to api-sports-players-response.json');
    
    // If we have players, fetch stats for the first player
    if (playersData.response && playersData.response.length > 0) {
      const firstPlayer = playersData.response[0];
      const playerId = firstPlayer.id;
      
      console.log(`Fetching stats for player ID: ${playerId} (${firstPlayer.name})`);
      
      const statsUrl = `${BASE_URL}/players/statistics?league=${LEAGUE_ID}&season=${SEASON}&player=${playerId}`;
      console.log(`Requesting: ${statsUrl}`);
      
      const statsResponse = await fetch(statsUrl, {
        headers: {
          'x-rapidapi-host': 'v1.baseball.api-sports.io',
          'x-rapidapi-key': API_KEY
        }
      });
      
      if (!statsResponse.ok) {
        throw new Error(`API request for player stats failed: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      
      const statsData = await statsResponse.json();
      
      // Save the player stats response to a file
      fs.writeFileSync(
        path.join(__dirname, 'api-sports-player-stats-response.json'),
        JSON.stringify(statsData, null, 2)
      );
      console.log('Saved player stats response to api-sports-player-stats-response.json');
      
      // Analyze the response to suggest table structure
      analyzeResponseForTableStructure(statsData);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function analyzeResponseForTableStructure(data) {
  console.log('\n=== SUGGESTED TABLE STRUCTURE BASED ON API RESPONSE ===\n');
  
  if (!data.response || data.response.length === 0) {
    console.log('No data to analyze. The API response might be empty.');
    return;
  }
  
  // Player basic info
  console.log('CREATE TABLE baseball_player_stats (');
  console.log('  id SERIAL PRIMARY KEY,');
  console.log('  player_id INTEGER NOT NULL, -- API-Sports player ID');
  console.log('  player_name TEXT NOT NULL,');
  console.log('  team_id INTEGER NOT NULL, -- API-Sports team ID');
  console.log('  team_name TEXT NOT NULL,');
  console.log('  position TEXT,');
  console.log('  season INTEGER NOT NULL,');
  console.log('  league_id INTEGER NOT NULL,');
  
  // Extract stats fields from the first player
  const playerStats = data.response[0];
  
  if (playerStats.statistics) {
    const stats = playerStats.statistics;
    
    // Basic stats
    if (stats.games) {
      console.log('  games_played INTEGER,');
      console.log('  games_started INTEGER,');
    }
    
    // Batting stats
    if (stats.hitting) {
      const hitting = stats.hitting;
      Object.keys(hitting).forEach(key => {
        let dataType = 'NUMERIC'; // Default
        if (typeof hitting[key] === 'number' && Number.isInteger(hitting[key])) {
          dataType = 'INTEGER';
        } else if (typeof hitting[key] === 'number') {
          dataType = 'NUMERIC(10,3)';
        } else if (typeof hitting[key] === 'string') {
          dataType = 'TEXT';
        }
        console.log(`  batting_${key} ${dataType},`);
      });
    }
    
    // Pitching stats
    if (stats.pitching) {
      const pitching = stats.pitching;
      Object.keys(pitching).forEach(key => {
        let dataType = 'NUMERIC'; // Default
        if (typeof pitching[key] === 'number' && Number.isInteger(pitching[key])) {
          dataType = 'INTEGER';
        } else if (typeof pitching[key] === 'number') {
          dataType = 'NUMERIC(10,3)';
        } else if (typeof pitching[key] === 'string') {
          dataType = 'TEXT';
        }
        console.log(`  pitching_${key} ${dataType},`);
      });
    }
    
    // Fielding stats
    if (stats.fielding) {
      const fielding = stats.fielding;
      Object.keys(fielding).forEach(key => {
        let dataType = 'NUMERIC'; // Default
        if (typeof fielding[key] === 'number' && Number.isInteger(fielding[key])) {
          dataType = 'INTEGER';
        } else if (typeof fielding[key] === 'number') {
          dataType = 'NUMERIC(10,3)';
        } else if (typeof fielding[key] === 'string') {
          dataType = 'TEXT';
        }
        console.log(`  fielding_${key} ${dataType},`);
      });
    }
  }
  
  console.log('  created_at TIMESTAMPTZ DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMPTZ DEFAULT NOW()');
  console.log(');');
  
  console.log('\n-- Indexes for better query performance');
  console.log('CREATE INDEX idx_baseball_player_stats_player_id ON baseball_player_stats(player_id);');
  console.log('CREATE INDEX idx_baseball_player_stats_team_id ON baseball_player_stats(team_id);');
  console.log('CREATE INDEX idx_baseball_player_stats_season ON baseball_player_stats(season);');
}

// Run the function
fetchPlayerStats();

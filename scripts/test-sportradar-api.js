import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';

// Base URL for MLB API (trying the trial endpoint with schedule)
const BASE_URL = 'http://api.sportradar.us/mlb/trial/v8/en';

// Get yesterday's date in the required format (YYYY/MM/DD)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const year = yesterday.getFullYear();
const month = String(yesterday.getMonth() + 1).padStart(2, '0');
const day = String(yesterday.getDate()).padStart(2, '0');

// Endpoint to fetch the schedule for today
const scheduleEndpoint = `${BASE_URL}/games/${year}/${month}/${day}/schedule.json?api_key=${API_KEY}`;

console.log('Fetching schedule for:', `${year}-${month}-${day}`);
console.log('Using API key:', API_KEY ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not found');

async function fetchSchedule() {
  try {
    console.log(`Fetching schedule from: ${scheduleEndpoint}`);
    const response = await fetch(scheduleEndpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching schedule:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return null;
  }
}

async function fetchWithDelay(url, delayMs = 1000) {
  await setTimeout(delayMs);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching ${url}:`, response.status, errorText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

async function fetchGameSummary(gameId) {
  const gameSummaryEndpoint = `${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`;
  console.log(`Fetching game summary for game ID: ${gameId}`);
  return await fetchWithDelay(gameSummaryEndpoint);
}

async function fetchPlayerStats(playerId) {
  const playerStatsEndpoint = `${BASE_URL}/players/${playerId}/profile.json?api_key=${API_KEY}`;
  console.log(`Fetching stats for player ID: ${playerId}`);
  return await fetchWithDelay(playerStatsEndpoint);
}

async function testSportsRadarAPI() {
  // Fetch the schedule for today
  const schedule = await fetchSchedule();
  
  if (!schedule || !schedule.games || schedule.games.length === 0) {
    console.log('No games scheduled for today.');
    return;
  }
  
  console.log(`Found ${schedule.games.length} games scheduled for today.`);
  
  // Get the first game ID from the schedule
  const firstGame = schedule.games[0];
  console.log('First game:', {
    id: firstGame.id,
    home: firstGame.home?.name,
    away: firstGame.away?.name,
    scheduled: firstGame.scheduled
  });
  
  // Fetch the game summary for the first game with a delay
  console.log('Fetching game summary...');
  const gameSummary = await fetchGameSummary(firstGame.id);
  
  if (gameSummary) {
    console.log('Game summary available.');
    // Extract player IDs from the game summary if available
    if (gameSummary.players && gameSummary.players.length > 0) {
      const playerId = gameSummary.players[0].id;
      console.log(`Fetching stats for player ID: ${playerId}`);
      const playerStats = await fetchPlayerStats(playerId);
      if (playerStats) {
        console.log('Player stats:', JSON.stringify(playerStats, null, 2));
      }
    }
  } else {
    console.log('No game summary available or access denied.');
  }
  
  // List all games for reference
  console.log('\nAll games scheduled for today:');
  schedule.games.forEach((game, index) => {
    console.log(`${index + 1}. ${game.away?.name} @ ${game.home?.name} (${game.scheduled})`);
  });
}

// Simple delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to explore available game data
async function exploreGameData(gameId) {
  console.log(`\nExploring data for game ID: ${gameId}`);
  
  // Try different endpoints
  const endpoints = [
    { name: 'summary', path: `${BASE_URL}/games/${gameId}/summary.json` },
    { name: 'boxscore', path: `${BASE_URL}/games/${gameId}/boxscore.json` },
    { name: 'playbyplay', path: `${BASE_URL}/games/${gameId}/pbp.json` },
    { name: 'news', path: `${BASE_URL}/games/${gameId}/news.json` },
    { name: 'recap', path: `${BASE_URL}/games/${gameId}/recap.json` }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint.name}`);
    try {
      const url = `${endpoint.path}?api_key=${API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        results[endpoint.name] = {
          status: 'success',
          data: Object.keys(data).slice(0, 5) // Just log the first few keys to see structure
        };
        console.log(`✅ ${endpoint.name} success:`, Object.keys(data));
        
        // If we got a successful response, log a sample of the data
        if (endpoint.name === 'summary' || endpoint.name === 'boxscore') {
          console.log(`Sample ${endpoint.name} data:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
        }
      } else {
        const errorText = await response.text().catch(() => 'No error details');
        results[endpoint.name] = {
          status: 'error',
          statusCode: response.status,
          statusText: response.statusText,
          error: errorText
        };
        console.log(`❌ ${endpoint.name} error: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      results[endpoint.name] = {
        status: 'exception',
        error: error.message
      };
      console.log(`⚠️ ${endpoint.name} exception:`, error.message);
    }
    
    // Add a small delay between requests (500ms)
    await delay(500);
  }
  
  return results;
}

// Function to extract player names from game data
function extractPlayerNamesFromGame(gameData) {
  const playerNames = new Set();
  
  // Helper to extract names from a player object
  const addPlayer = (player) => {
    if (player && player.full_name) {
      playerNames.add(player.full_name);
    }
  };
  
  // Check different possible locations for player data
  if (gameData.home && gameData.home.players) {
    gameData.home.players.forEach(addPlayer);
  }
  
  if (gameData.away && gameData.away.players) {
    gameData.away.players.forEach(addPlayer);
  }
  
  return Array.from(playerNames);
}

// Main function to test API endpoints
async function testEndpoints() {
  const schedule = await fetchSchedule();
  
  if (!schedule || !schedule.games || schedule.games.length === 0) {
    console.log('No games scheduled for today.');
    return;
  }
  
  // Get the first game
  const firstGame = schedule.games[0];
  console.log(`\nTesting endpoints for game: ${firstGame.away?.name} @ ${firstGame.home?.name}`);
  
  // Explore available data for this game
  const results = await exploreGameData(firstGame.id);
  
  // If we have a summary, try to extract player names
  if (results.summary?.status === 'success') {
    console.log('\nAttempting to extract player names from game summary...');
    try {
      const summaryUrl = `${BASE_URL}/games/${firstGame.id}/summary.json?api_key=${API_KEY}`;
      const response = await fetch(summaryUrl);
      if (response.ok) {
        const summaryData = await response.json();
        const playerNames = extractPlayerNamesFromGame(summaryData);
        console.log(`\nExtracted ${playerNames.length} player names from game summary.`);
        console.log('Sample player names:', playerNames.slice(0, 5).join(', '), '...');
      }
    } catch (error) {
      console.log('Error extracting player names:', error.message);
    }
  }
  
  console.log('\nEndpoint test results:', JSON.stringify(results, null, 2));
  
  // Next steps would be to:
  // 1. Match these player names with your database
  // 2. Fetch additional player data from your database
  // 3. Use Claude to generate content based on the game data
}

// Run the tests
(async () => {
  await testEndpoints();
})();

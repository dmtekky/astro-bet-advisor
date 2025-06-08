import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';

// Base URL for MLB API
const BASE_URL = 'http://api.sportradar.us/mlb/trial/v8/en';

// List of common MLB endpoints to test
const endpoints = [
  { name: 'daily_schedule', path: `${BASE_URL}/games/2025/05/30/schedule.json` },
  { name: 'game_summary', path: `${BASE_URL}/games/73b696a7-0a79-4964-a1c9-7081dc04af74/summary.json` }, // Add game summary endpoint
  { name: 'league_hierarchy', path: `${BASE_URL}/league/hierarchy.json` },
  { name: 'team_roster', path: `${BASE_URL}/teams/1d7adaf0-16d8-4d92-8a0b-4109a68bda85/roster.json` }, // Sample team ID
  { name: 'player_profile', path: `${BASE_URL}/players/1d7adaf0-16d8-4d92-8a0b-4109a68bda85/profile.json` }, // Sample player ID
  { name: 'league_leaders', path: `${BASE_URL}/seasons/2024/REG/leaders/offense/statistics.json` },
  { name: 'game_playbyplay', path: `${BASE_URL}/games/73b696a7-0a79-4964-a1c9-7081dc04af74/pbp.json` } // Sample game ID
];

async function testEndpoint(endpoint) {
  console.log(`\n🔍 Testing endpoint: ${endpoint.name}`);
  console.log(`🔗 URL: ${endpoint.path}`);
  
  try {
    const response = await fetch(endpoint.path, {
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error (${response.status}): ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
      return { success: false, status: response.status };
    }
    
    const data = await response.json();
    console.log(`✅ Success! Status: ${response.status}`);
    
    // Log response structure
    if (data) {
      console.log(`📋 Response keys:`, Object.keys(data));
      
      // Log a sample of the data if it's an array
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📝 First item sample:`, JSON.stringify(data[0], null, 2).substring(0, 300) + '...');
      } else if (typeof data === 'object') {
        console.log('📝 Response sample:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
    }
    
    return { success: true, status: response.status };
  } catch (error) {
    console.error('⚠️ Exception:', error.message);
    return { success: false, error: error.message };
  }
}

// Test all endpoints
(async () => {
  console.log('🚀 Starting MLB API Endpoint Tests');
  console.log('================================');
  console.log(`Using API key: ${API_KEY ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not found'}`);
  
  const results = {};
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results[endpoint.name] = result.success ? '✅ Success' : '❌ Failed';
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results:');
  console.log('===============');
  console.table(results);
  
  console.log('\n🔍 Next Steps:');
  console.log('1. Check which endpoints are available with your API key');
  console.log('2. Review the API documentation for the correct endpoints');
  console.log('3. Ensure your API key has the necessary permissions');
  console.log('4. Check if you need to upgrade your plan for certain endpoints');
})();

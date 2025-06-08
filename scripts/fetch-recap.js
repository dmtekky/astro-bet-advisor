import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';

// Base URL for MLB API
const BASE_URL = 'http://api.sportradar.us/mlb/trial/v8/en';

// Get yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const year = yesterday.getFullYear();
const month = String(yesterday.getMonth() + 1).padStart(2, '0');
const day = String(yesterday.getDate()).padStart(2, '0');

// List of endpoint variations to try
const endpointVariations = [
  { 
    name: 'analysis_recap', 
    path: `${BASE_URL}/analysis/${year}/${month}/${day}/recap.json`
  },
  { 
    name: 'news', 
    path: `${BASE_URL}/news/${year}/${month}/${day}/recap.json`
  },
  { 
    name: 'recaps', 
    path: `${BASE_URL}/recaps/${year}/${month}/${day}/recap.json`
  },
  { 
    name: 'latest_news',
    path: `${BASE_URL}/news/latest.json`
  },
  {
    name: 'game_summary',
    path: `${BASE_URL}/games/2025-05-30/summary.json`
  }
];

async function testEndpoint(endpoint) {
  console.log(`\nTesting endpoint: ${endpoint.name}`);
  console.log(`URL: ${endpoint.path}`);
  
  try {
    const response = await fetch(endpoint.path, {
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error (${response.status}): ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Response keys:`, Object.keys(data));
    
    // Log a sample of the data
    if (Array.isArray(data) && data.length > 0) {
      console.log(`📋 First item sample:`, JSON.stringify(data[0], null, 2));
    } else if (typeof data === 'object') {
      console.log('📋 Response sample:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    }
    
    return data;
  } catch (error) {
    console.error('⚠️ Exception:', error.message);
    return null;
  }
}

// Test all endpoints
(async () => {
  console.log(`Testing endpoints for date: ${year}-${month}-${day}`);
  console.log('Using API key:', API_KEY ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not found');
  
  const results = {};
  
  for (const endpoint of endpointVariations) {
    const result = await testEndpoint(endpoint);
    results[endpoint.name] = result ? 'Success' : 'Failed';
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTest results:', results);
  console.log('\nNote: If all endpoints failed, please check:');
  console.log('1. Your API key has access to the MLB API');
  console.log('2. The endpoint paths are correct');
  console.log('3. The API documentation for the correct endpoints');
})();

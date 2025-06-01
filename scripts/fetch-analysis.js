import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';

// Base URL for SportsRadar Content API
const BASE_URL = 'https://api.sportradar.com';

// Get yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const year = yesterday.getFullYear();
const month = String(yesterday.getMonth() + 1).padStart(2, '0');
const day = String(yesterday.getDate()).padStart(2, '0');

// Analysis endpoint parameters
const params = {
  sport: 'mlb',
  access_level: 't', // Trial access
  provider: 'ap',   // Associated Press
  year: year,
  month: month,
  day: day,
  type: 'recap',    // Can be 'all', 'preview', or 'recap'
  format: 'json'
};

// Construct the analysis URL
const analysisUrl = `${BASE_URL}/content-${params.sport}-${params.access_level}3/${params.provider}/analysis/${params.year}/${params.month}/${params.day}/${params.type}.${params.format}`;

console.log('Analysis API Test');
console.log('=================');
console.log(`Date: ${year}-${month}-${day}`);
console.log(`API Key: ${API_KEY ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not found'}`);
console.log(`Request URL: ${analysisUrl}`);

async function fetchAnalysis() {
  console.log('\nFetching analysis data...');
  
  try {
    const response = await fetch(analysisUrl, {
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY
      }
    });
    
    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      
      // Check for rate limiting headers
      console.log('\nResponse Headers:');
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      return null;
    }
    
    const data = await response.json();
    console.log('\n✅ Success! Response Structure:', Object.keys(data));
    
    // Log a sample of the data
    if (Array.isArray(data) && data.length > 0) {
      console.log(`\n📋 First item sample:`, JSON.stringify(data[0], null, 2));
    } else if (typeof data === 'object') {
      console.log('\n📋 Response sample:', JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('\n⚠️ Exception:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    return null;
  }
}

// Run the fetch
(async () => {
  const analysisData = await fetchAnalysis();
  
  if (!analysisData) {
    console.log('\n🔴 Failed to fetch analysis data. Please check:');
    console.log('1. Your API key has access to the Content API');
    console.log('2. The endpoint URL is correct');
    console.log('3. The required parameters are valid');
    console.log('4. Your plan includes access to this endpoint');
  } else {
    console.log('\n🟢 Analysis data fetched successfully!');
  }
})();

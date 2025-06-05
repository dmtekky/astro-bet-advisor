import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const API_KEY = process.env.MY_SPORTS_FEEDS_API_KEY;
const API_PASSWORD = 'MYSPORTSFEEDS';
const SEASON = '2024-2025-regular';

function fetchNBAData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mysportsfeeds.com',
      path: `/v2.1/pull/nba/${SEASON}/player_stats_totals.json`,
      auth: `${API_KEY}:${API_PASSWORD}`,
      headers: {
        'Accept': 'application/json'
      }
    };

    console.log('Making request to:', `https://${options.hostname}${options.path}`);
    console.log('Auth:', options.auth);

    const req = https.get(options, (res) => {
      console.log('Response status code:', res.statusCode);
      console.log('Response headers:', res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Response data type:', typeof jsonData);
          console.log('Response keys:', Object.keys(jsonData));
          
          if (jsonData.playerStatsTotals) {
            console.log('playerStatsTotals length:', jsonData.playerStatsTotals.length);
            if (jsonData.playerStatsTotals.length > 0) {
              const firstPlayer = jsonData.playerStatsTotals[0];
              console.log('\nFirst player data structure:', {
                player: firstPlayer.player,
                team: firstPlayer.team,
                stats: firstPlayer.statistics || 'No statistics field',
                allKeys: Object.keys(firstPlayer)
              });
              
              // Log all properties of the first player
              console.log('\nAll properties of first player:');
              Object.entries(firstPlayer).forEach(([key, value]) => {
                console.log(`- ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
              });
            }
          }
          
          resolve(jsonData);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.error('Raw response data:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error making request:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    if (!API_KEY) {
      throw new Error('MY_SPORTS_FEEDS_API_KEY environment variable is not set');
    }
    
    console.log('Starting NBA API test...');
    const data = await fetchNBAData();
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();

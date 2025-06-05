import https from 'https';

// MySportsFeeds API configuration
const MSF_API_KEY = '8844c949-54d6-4e72-ba93-203dfd';
const MSF_PASSWORD = 'MYSPORTSFEEDS';

// Function to make API requests
function makeApiRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${MSF_API_KEY}:${MSF_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    };

    console.log(`Making request to: ${url}`);
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            console.error('Error parsing JSON response:', error);
            reject(error);
          }
        } else {
          console.error(`API request failed with status: ${res.statusCode}`);
          reject(new Error(`API request failed with status: ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      console.error('Error making API request:', error);
      reject(error);
    });
  });
}

// Main function to inspect API response structure
async function inspectResponseStructure() {
  try {
    console.log('Fetching sample NBA player stats...');

    // Fetch player stats from MySportsFeeds (with limit=1 to get just one record)
    const statsUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nba/2024-2025-regular/player_stats_totals.json?limit=1';
    const statsData = await makeApiRequest(statsUrl);
    
    if (!statsData || !statsData.playerStatsTotals) {
      throw new Error('No player stats data returned from API');
    }
    
    // Print the entire structure of the first player
    console.log('API Response Structure:');
    console.log(JSON.stringify(statsData, null, 2));
    
    // Print the specific stats fields for easier reference
    if (statsData.playerStatsTotals[0] && statsData.playerStatsTotals[0].stats) {
      console.log('\n\nStats Fields Available:');
      const stats = statsData.playerStatsTotals[0].stats;
      Object.keys(stats).forEach(key => {
        console.log(`${key}: ${stats[key]}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error inspecting API response:', error);
    throw error;
  }
}

// Run the inspection
inspectResponseStructure()
  .then(() => {
    console.log('✅ Inspection completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

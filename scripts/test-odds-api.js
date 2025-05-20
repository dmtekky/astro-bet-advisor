// Test script to verify The Odds API connection

const API_KEY = '7da44c016789de1c80969ac1ee9a7260';
const API_BASE_URL = 'https://api.the-odds-api.com/v4';

async function testConnection() {
  try {
    console.log('Testing connection to The Odds API...');
    
    // First, let's check if we can get the list of available sports
    const response = await fetch(`${API_BASE_URL}/sports?apiKey=${API_KEY}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message || response.statusText}`);
    }
    
    const sports = await response.json();
    
    console.log('✅ Successfully connected to The Odds API!');
    console.log(`\nAvailable sports (${sports.length}):`);
    sports.forEach(sport => {
      console.log(`- ${sport.title} (${sport.key})`);
    });
    
    // If we got this far, let's also test fetching odds for NBA
    console.log('\nTesting NBA odds fetch...');
    const oddsResponse = await fetch(
      `${API_BASE_URL}/sports/basketball_nba/odds?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals`
    );
    
    if (!oddsResponse.ok) {
      const error = await oddsResponse.json();
      throw new Error(`Odds API Error: ${error.message || oddsResponse.statusText}`);
    }
    
    const oddsData = await oddsResponse.json();
    console.log(`✅ Successfully fetched ${oddsData.length} NBA games with odds!`);
    
    if (oddsData.length > 0) {
      console.log('\nSample game:');
      const sampleGame = oddsData[0];
      console.log(`${sampleGame.home_team} vs ${sampleGame.away_team}`);
      console.log(`Commence time: ${sampleGame.commence_time}`);
      console.log(`Bookmakers: ${sampleGame.bookmakers?.length || 0} bookmakers available`);
    }
    
  } catch (error) {
    console.error('❌ Error testing The Odds API:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', error.response.data);
    }
  }
}

testConnection();

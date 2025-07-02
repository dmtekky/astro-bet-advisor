// Simple script to test the astrology API
import fetch from 'node-fetch';

async function testAstrologyAPI() {
  // Make sure all fields are provided as strings to match API expectations
  const birthData = {
    year: "1991",
    month: "2",
    day: "7",
    hour: "12",
    minute: "0",
    latitude: "35.994",
    longitude: "-78.8986",
    timezoneOffset: "-300" // EST timezone offset
  };

  console.log('Sending test request to API with birth data:', birthData);
  
  try {
    const response = await fetch('http://localhost:3001/api/astrology/positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(birthData)
    });
    
    console.log('API Response Status:', response.status);
    
    const data = await response.json();
    
    if (response.status !== 200) {
      console.error('API returned an error:', data);
      return;
    }
    
    // Extract and log the Sun's position
    const sun = data.planets?.find(p => p.name === 'Sun');
    console.log('\n--- SUN POSITION ---');
    console.log(`Longitude: ${sun.angle}°`);
    console.log(`Sign: ${sun.sign}`);
    console.log(`House: ${sun.house}`);
    
    // Log all planetary positions
    console.log('\n--- ALL PLANETARY POSITIONS ---');
    data.planets.forEach(planet => {
      console.log(`${planet.name}: ${planet.angle}° (${planet.sign}) in house ${planet.house}`);
    });
    
    console.log('\n--- FULL API RESPONSE ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAstrologyAPI();

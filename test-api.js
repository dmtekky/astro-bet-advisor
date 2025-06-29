// Simple script to test the astrology API endpoint

const testData = {
  year: 1990,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  city: "New York"
};

async function testAstrologyAPI() {
  try {
    console.log('Sending test request to API...');
    const response = await fetch('http://localhost:3001/api/astrology/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    return data;
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAstrologyAPI();

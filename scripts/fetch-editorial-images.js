import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';

// Base URL for SportsRadar Editorial API
const BASE_URL = 'https://api.sportradar.com';

// Using a provider_content_id from our previous analysis response
// This is just a sample ID - replace with actual IDs from your content
const SAMPLE_PROVIDER_CONTENT_ID = '5d27af9ae75805a75dc856677fb5aca5';

// Construct the editorial image URL
const editorialImageUrl = `${BASE_URL}/content-mlbt3/images/${SAMPLE_PROVIDER_CONTENT_ID}`;

console.log('Editorial Image API Test');
console.log('========================');
console.log(`API Key: ${API_KEY ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not found'}`);
console.log(`Provider Content ID: ${SAMPLE_PROVIDER_CONTENT_ID}`);
console.log(`Request URL: ${editorialImageUrl}`);

async function fetchEditorialImage() {
  console.log('\nFetching editorial image...');
  
  try {
    const response = await fetch(editorialImageUrl, {
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY
      },
      // Follow redirects to get the actual image URL
      redirect: 'follow'
    });
    
    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    
    // Log response headers for debugging
    console.log('\nResponse Headers:');
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return null;
    }
    
    // Check if the response is an image or JSON
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('\n✅ Success! Response:', JSON.stringify(data, null, 2));
      return data;
    } else if (contentType && contentType.startsWith('image/')) {
      console.log('\n✅ Success! Received image data.');
      console.log('Image type:', contentType);
      // For actual image data, you might want to save it to a file
      // const imageBuffer = await response.buffer();
      // fs.writeFileSync('image.jpg', imageBuffer);
      return { type: 'image', contentType };
    } else {
      console.log('\n⚠️ Unexpected response type:', contentType);
      const text = await response.text();
      console.log('Response text:', text.substring(0, 200) + '...');
      return { type: 'unknown', data: text };
    }
  } catch (error) {
    console.error('\n⚠️ Exception:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    return null;
  }
}

// Run the fetch
(async () => {
  const imageData = await fetchEditorialImage();
  
  if (!imageData) {
    console.log('\n🔴 Failed to fetch editorial image. Please check:');
    console.log('1. Your API key has access to the Editorial Images API');
    console.log('2. The provider_content_id is valid and has associated images');
    console.log('3. Your plan includes access to this endpoint');
  } else {
    console.log('\n🟢 Editorial image data fetched successfully!');
  }
})();

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Check required environment variables
const requiredVars = [
  'PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_KEY',
  'MY_SPORTS_FEEDS_API_KEY' // Added MySportsFeeds API key as it's crucial
];

console.log('Checking environment variables...\n');

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = value !== undefined && value !== '';
  
  console.log(`${varName}: ${isPresent ? '✅ Present' : '❌ Missing'}`);
  
  if (!isPresent) {
    allVarsPresent = false;
  } else if (varName.includes('KEY') && value) {
    // Don't log the actual key, just show first few characters
    console.log(`   Value: ${value.substring(0, 5)}...${value.substring(value.length - 5)}`);
  } else if (varName.includes('URL') && value) {
    // Don't log the full URL, just show the domain
    try {
      const url = new URL(value);
      console.log(`   Value: ${url.protocol}//${url.hostname}`);
    } catch (e) {
      console.log('   Value: [Invalid URL]');
    }
  } else {
    console.log(`   Value: ${value}`);
  }
  
  console.log('');
});

if (!allVarsPresent) {
  console.error('❌ Error: Some required environment variables are missing');
  console.log('\nPlease make sure your .env file contains all the following variables:');
  console.log(requiredVars.map(v => {
    if (v === 'MY_SPORTS_FEEDS_API_KEY') return `${v}=your_mysportsfeeds_api_key`;
    if (v === 'PUBLIC_SUPABASE_URL') return `${v}=your_supabase_url`;
    if (v === 'PUBLIC_SUPABASE_KEY') return `${v}=your_supabase_service_key`;
    return `${v}=your_value_here`;
  }).join('\n'));
  console.log('\nNote: SUPABASE_DB_URL is also used by some scripts but not checked here.');
  process.exit(1);
}

console.log('✅ All required environment variables are present!');
console.log('\nYou can now run the database verification script.');

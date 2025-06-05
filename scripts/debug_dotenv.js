import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the project root
const envPath = path.resolve(__dirname, '../../.env');
console.log(`Attempting to load .env file from: ${envPath}`);

const result = dotenv.config({ path: envPath, debug: true });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('\nSuccessfully loaded .env file. Parsed content:');
  console.log(result.parsed);
}

console.log('\n--- All process.env variables after dotenv ---');
// Filter to show only custom variables, not all system vars
const customEnv = {};
for (const key in process.env) {
  if (key.startsWith('PUBLIC_') || key.startsWith('MY_SPORTS_') || key.startsWith('VITE_') || key.startsWith('SPORTSDATA_')) {
    customEnv[key] = process.env[key];
  }
}
console.log(JSON.stringify(customEnv, null, 2));

console.log(`
--- Specific check for required variables ---`);
console.log(`PUBLIC_SUPABASE_URL: ${process.env.PUBLIC_SUPABASE_URL}`);
console.log(`PUBLIC_SUPABASE_KEY: ${process.env.PUBLIC_SUPABASE_KEY}`);
console.log(`MY_SPORTS_FEEDS_API_KEY: ${process.env.MY_SPORTS_FEEDS_API_KEY}`);

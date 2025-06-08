// Test script for the Edge Function
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const sportsDbApiKey = process.env.VITE_SPORTSDB_API_KEY;

if (!supabaseUrl || !supabaseKey || !sportsDbApiKey) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Run the Edge Function locally using the Supabase CLI
console.log('Starting Edge Function locally...');

try {
  // Set environment variables for the Edge Function
  const env = {
    ...process.env,
    DENO_TLS_CA_STORE: 'mozilla', // Required for Deno to work with HTTPS
  };

  // Run the Edge Function using the Supabase CLI
  execSync(
    `supabase functions serve thesportsdb-data-sync --no-verify-jwt --env-file .env`,
    {
      stdio: 'inherit',
      env,
      cwd: __dirname,
    }
  );
} catch (error) {
  console.error('Error running Edge Function:', error);
  process.exit(1);
}

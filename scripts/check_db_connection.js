import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log environment variables for debugging
console.log('Environment Variables:');
console.log(`PUBLIC_SUPABASE_URL: ${process.env.PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}`);
console.log(`PUBLIC_SUPABASE_KEY: ${process.env.PUBLIC_SUPABASE_KEY ? 'Set' : 'Not set'}`);

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
  { 
    auth: { persistSession: false },
    db: {
      schema: 'public' // Explicitly set the schema
    }
  }
);

async function checkConnection() {
  try {
    // Test connection by querying a known table
    const { data, error } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying nba_player_season_stats_2025:', error);
      return;
    }
    
    console.log('\nSuccessfully connected to Supabase');
    
    // Get row count
    const { count, error: countError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error getting row count:', countError);
      return;
    }
    
    console.log(`\nNumber of rows in nba_player_season_stats_2025: ${count}`);
    
    // Get a sample of players
    if (count > 0) {
      const { data: sample, error: sampleError } = await supabase
        .from('nba_player_season_stats_2025')
        .select('player_name, games_played, points')
        .limit(5);
        
      if (sampleError) {
        console.error('Error getting sample data:', sampleError);
        return;
      }
      
      console.log('\nSample player data:');
      console.log(sample);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkConnection();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function checkPlayerCount() {
  try {
    // Get total count of players
    const { count, error: countError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`Total players in nba_player_season_stats_2025: ${count}`);
    
    // Get a sample of players
    const { data: samplePlayers, error: sampleError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('player_name, games_played, points')
      .limit(5);
      
    if (sampleError) throw sampleError;
    
    console.log('\nSample players:');
    console.log(samplePlayers);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkPlayerCount();

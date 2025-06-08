import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with both possible environment variable names
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase with URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set');

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  { 
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);

async function listTables() {
  try {
    // Try to get a list of all tables by querying known tables
    const knownTables = [
      'nba_player_season_stats_2025',
      'nba_players',
      'players',
      'player_stats',
      'nba_player_stats',
      'nba_players_2025',
      'player_season_stats'
    ];
    
    console.log('Checking for known tables...');
    
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ Table exists: ${tableName}`);
          
          // If table exists, get its row count
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          console.log(`   Rows: ${count}`);
          
          // Get column names
          if (data && data.length > 0) {
            console.log('   Sample columns:', Object.keys(data[0]).slice(0, 5).join(', ') + '...');
          }
        }
      } catch (err) {
        // Table doesn't exist or other error
        console.log(`❌ Table not found: ${tableName}`);
      }
    }
    
  } catch (err) {
    console.error('Error listing tables:', err);
  }
}

listTables();

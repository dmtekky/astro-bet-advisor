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

async function checkTableStructure() {
  try {
    // Check if table exists and get column info
    const { data: columns, error } = await supabase
      .rpc('get_columns_info', { table_name: 'nba_player_season_stats_2025' });

    if (error) {
      console.error('Error fetching table structure:', error);
      return;
    }

    if (!columns || columns.length === 0) {
      console.log('Table nba_player_season_stats_2025 does not exist or has no columns');
      
      // Try to list all tables in the public schema
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');
        
      if (tablesError) {
        console.error('Error listing tables:', tablesError);
      } else {
        console.log('\nAvailable tables in public schema:');
        console.log(tables.map(t => t.table_name).join('\n'));
      }
      return;
    }

    console.log('\nTable structure for nba_player_season_stats_2025:');
    console.log(columns);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTableStructure();

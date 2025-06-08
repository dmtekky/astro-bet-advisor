import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
console.log('Initializing Supabase client...');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'Found' : 'Missing');
console.log('Supabase Key:', process.env.VITE_SUPABASE_KEY ? 'Found' : 'Missing');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_KEY) {
  console.error('❌ Supabase URL or Key is missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

async function checkNbaStats() {
  try {
    // Check if the table exists and has any rows
    console.log('Checking nba_player_season_stats_2025 table...');
    const { data: stats, error } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error querying nba_player_season_stats_2025:', error.message);
      return;
    }

    if (!stats || stats.length === 0) {
      console.log('ℹ️  No data found in nba_player_season_stats_2025 table.');
      
      // Check if the table exists by querying its structure
      console.log('\nChecking table structure...');
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_columns', { 
          table_schema: 'public',
          table_name: 'nba_player_season_stats_2025' 
        });
      
      if (columnsError) {
        console.error('❌ Error checking table structure:', columnsError.message);
        console.log('\nTrying alternative method to check table structure...');
        
        // Alternative method to check table structure
        const { data: sampleData, error: sampleError } = await supabase
          .from('nba_player_season_stats_2025')
          .select('*')
          .limit(1);
          
        if (sampleError) {
          console.error('❌ Error with alternative check:', sampleError.message);
        } else {
          console.log('✅ Table structure (sample):', sampleData);
        }
      } else {
        console.log('✅ Table structure:', columns);
      }
      
      // Check if there are any other similar tables
      console.log('\nChecking for similar tables...');
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');
        
      if (tablesError) {
        console.error('❌ Error listing tables:', tablesError.message);
      } else {
        const nbaTables = tables.filter(t => t.table_name.includes('nba'));
        console.log('NBA-related tables:', nbaTables);
      }
      
    } else {
      console.log('✅ Found data in nba_player_season_stats_2025:', stats);
    }
    
  } catch (err) {
    console.error('❌ An unexpected error occurred:', err.message);
  }
}

checkNbaStats();

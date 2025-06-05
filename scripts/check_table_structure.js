import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName) {
  try {
    // Try to query the table with a limit 0 to just check if it exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log(`Table ${tableName} does not exist`);
        return false;
      }
      throw error;
    }
    
    console.log(`Table ${tableName} exists with ${data.length} rows`);
    return true;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function main() {
  const tableName = 'nba_player_season_stats';
  const exists = await checkTableExists(tableName);
  
  if (exists) {
    console.log(`\nChecking structure of ${tableName}...`);
    
    try {
      // Get a single row to inspect the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Sample row structure:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('Table is empty');
      }
    } catch (error) {
      console.error('Error fetching sample row:', error);
    }
  }
  
  // Also check the nba_players table for reference
  console.log('\nChecking nba_players table...');
  await checkTableExists('nba_players');
}

main().catch(console.error);

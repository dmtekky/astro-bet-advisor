import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or Key is not defined in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('🔍 Checking nba_players table schema...');
    
    // Get one row to see the structure
    const { data, error } = await supabase
      .from('nba_players')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log('📋 nba_players columns:', Object.keys(data[0]));
      console.log('Sample player data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('ℹ️ No data found in nba_players table');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkSchema();

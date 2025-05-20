import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';

// Load environment variables from local .env file
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshSchema() {
  try {
    // Refresh the schema cache using SQL
    const { error } = await supabase
      .rpc('refresh_schema_cache')
      .then(() => {
        console.log('Schema cache refreshed successfully');
        process.exit(0);
      });
    
    if (error) {
      console.error('Error refreshing schema cache:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error refreshing schema:', error);
    process.exit(1);
  }
}

refreshSchema();

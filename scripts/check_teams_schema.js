import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamsSchema() {
  try {
    // Get a sample team to check the schema
    const { data: sampleTeam, error: sampleError } = await supabase
      .from('teams')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      if (sampleError.code === 'PGRST116') { // No rows returned
        console.log('teams table is empty');
      } else {
        throw sampleError;
      }
    } else {
      console.log('Teams table columns:');
      console.table(Object.entries(sampleTeam).map(([key, value]) => ({
        column: key,
        type: typeof value,
        sample_value: value
      })));
    }
  } catch (error) {
    console.error('Error checking teams table:', error);
    process.exit(1);
  }
}

checkTeamsSchema();

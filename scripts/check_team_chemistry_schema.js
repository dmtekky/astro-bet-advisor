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

async function checkTeamChemistrySchema() {
  try {
    // Check if table exists and get a sample row
    const { data: sampleData, error: sampleError } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(1);

    if (sampleError) {
      if (sampleError.code === '42P01') {
        console.log('team_chemistry table does not exist');
      } else {
        throw sampleError;
      }
    } else {
      console.log('Team Chemistry Table exists. Sample row:');
      console.log(sampleData);
      
      // Get column types from the first row
      if (sampleData && sampleData.length > 0) {
        console.log('\nColumns and their types:');
        const columns = Object.entries(sampleData[0]).map(([key, value]) => ({
          column: key,
          type: typeof value,
          value: value
        }));
        console.table(columns);
      }
    }

  } catch (error) {
    console.error('Error checking team_chemistry table:', error);
    process.exit(1);
  }
}

checkTeamChemistrySchema();

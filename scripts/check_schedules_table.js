import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchedulesTable() {
  try {
    // Get a sample of the data
    const { data: sampleData, error: sampleError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);
    
    if (sampleError) throw sampleError;
    
    console.log('Sample data from schedules table:');
    console.log(JSON.stringify(sampleData, null, 2));
    
    // Get column names from the first row
    if (sampleData && sampleData.length > 0) {
      console.log('\nColumns in schedules table:');
      console.log(Object.keys(sampleData[0]));
    } else {
      console.log('No data found in schedules table');
    }
    
  } catch (error) {
    console.error('Error checking schedules table:', error);
  }
}

checkSchedulesTable();

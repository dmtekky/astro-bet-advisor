// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to check table structure
async function checkTableStructure() {
  try {
    console.log('Fetching table structure...');
    
    // Get a single row to inspect the structure
    const { data, error } = await supabase
      .from('baseball_players')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching table structure:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No data found in the table');
      return;
    }

    console.log('\n📊 Table Structure (first row):');
    console.log(JSON.stringify(data[0], null, 2));
    
    // Show column names
    console.log('\n📋 Column Names:');
    console.log(Object.keys(data[0]));
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

// Run the check
checkTableStructure();

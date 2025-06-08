// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to check the database schema
async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Get column information for baseball_players table
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'baseball_players')
      .order('ordinal_position');

    if (error) {
      console.error('❌ Error fetching schema:', error);
      return;
    }

    if (!columns || columns.length === 0) {
      console.log('No columns found in the baseball_players table.');
      return;
    }

    console.log('\n📊 baseball_players table schema:');
    console.log('Column Name          | Data Type     | Nullable');
    console.log('---------------------|---------------|-----------');
    
    columns.forEach(column => {
      console.log(
        `${column.column_name.padEnd(20)} | ${column.data_type.padEnd(13)} | ${column.is_nullable}`
      );
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

// Run the function
checkSchema();

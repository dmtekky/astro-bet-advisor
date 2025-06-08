import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY
);

async function checkTeamChemistryTable() {
  try {
    // Check if table exists by querying it
    const { data, error } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error checking team_chemistry table:', error);
      
      // Check if error is because table doesn't exist
      if (error.code === '42P01') {
        console.log('The team_chemistry table does not exist in the database.');
        console.log('Please run the create_team_chemistry_table.sql script in your Supabase SQL editor.');
      }
      return false;
    }

    console.log('✅ team_chemistry table exists');
    console.log(`Found ${data ? data.length : 0} rows`);
    
    if (data && data.length > 0) {
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    }
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Run the check
checkTeamChemistryTable()
  .then(success => {
    process.exit(success ? 0 : 1);
  });

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Check if players table exists and get its structure
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(1);

    if (playersError) {
      console.error('Error fetching players table:', playersError);
    } else {
      console.log('Players table structure:', playersData[0] ? Object.keys(playersData[0]) : 'No data');
    }

    // Check if teams table exists and get its structure
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (teamsError) {
      console.error('Error fetching teams table:', teamsError);
    } else {
      console.log('Teams table structure:', teamsData[0] ? Object.keys(teamsData[0]) : 'No data');
    }

    // Check if player_mapping table exists
    const { data: mappingData, error: mappingError } = await supabase
      .from('player_mapping')
      .select('*')
      .limit(1);

    if (mappingError) {
      console.log('player_mapping table does not exist or error:', mappingError.message);
    } else {
      console.log('player_mapping table structure:', mappingData[0] ? Object.keys(mappingData[0]) : 'No data');
    }

  } catch (error) {
    console.error('Error checking database structure:', error);
  }
}

checkTables();

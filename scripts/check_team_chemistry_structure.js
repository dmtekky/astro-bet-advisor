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

async function checkTeamChemistryStructure() {
  try {
    // Get a sample row from team_chemistry
    const { data, error } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      console.log('No data in team_chemistry table');
      return;
    }

    console.log('Team Chemistry table structure:');
    console.log(Object.keys(data).map(key => ({
      column: key,
      type: typeof data[key],
      sample_value: data[key]
    })));

    // Check if we can insert a test record
    const testData = {
      team_id: data.team_id, // Use an existing team_id to avoid FK violation
      team_name: 'Test Team',
      team_abbreviation: 'TST',
      score: 50,
      elements: {},
      aspects: {},
      calculated_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    console.log('\nAttempting to insert test record with team_id:', data.team_id);
    const { data: inserted, error: insertError } = await supabase
      .from('team_chemistry')
      .upsert([testData], { onConflict: 'team_id' })
      .select();

    if (insertError) throw insertError;
    console.log('Successfully upserted test record:', inserted);

  } catch (error) {
    console.error('Error checking team_chemistry structure:', error);
  }
}

checkTeamChemistryStructure();

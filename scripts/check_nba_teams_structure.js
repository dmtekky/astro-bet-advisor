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

async function checkNBATeamsStructure() {
  try {
    // Get a sample row from nba_teams
    const { data, error } = await supabase
      .from('nba_teams')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      console.log('No data in nba_teams table');
      return;
    }

    console.log('NBA Teams table structure:');
    console.log(Object.keys(data).map(key => ({
      column: key,
      type: typeof data[key],
      sample_value: data[key]
    })));

    // Check if we can update a test record
    const testData = {
      chemistry_score: 75,
      chemistry_updated_at: new Date().toISOString(),
      chemistry_elements: {
        air: 25,
        fire: 25,
        earth: 25,
        water: 25,
        balance: 0,
        synergyBonus: 0,
        diversityBonus: 0,
        chemistryElementScore: 50
      },
      chemistry_aspects: {
        score: 0,
        aspects: [],
        netHarmony: 0,
        harmonyScore: 0,
        challengeScore: 0
      }
    };

    console.log('\nAttempting to update test record with ID:', data.id);
    const { data: updated, error: updateError } = await supabase
      .from('nba_teams')
      .update(testData)
      .eq('id', data.id)
      .select();

    if (updateError) throw updateError;
    console.log('Successfully updated test record:', updated);

  } catch (error) {
    console.error('Error checking nba_teams structure:', error);
  }
}

checkNBATeamsStructure();

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

async function checkTeamChemistryConstraint() {
  try {
    // Get the foreign key constraints for team_chemistry
    const { data, error } = await supabase.rpc('get_foreign_key_relationships', {
      table_name: 'team_chemistry'
    });

    if (error) {
      console.error('Error getting foreign key constraints:', error);
      // Fall back to a simpler query if the function doesn't exist
      const { data: constraints } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', 'team_chemistry');
      
      console.log('Table constraints:', constraints);
      
      const { data: keyUsage } = await supabase
        .from('information_schema.key_column_usage')
        .select('constraint_name, column_name, table_name')
        .eq('table_name', 'team_chemistry');
      
      console.log('Key column usage:', keyUsage);
      
      return;
    }

    console.log('Foreign key constraints for team_chemistry:', data);
  } catch (error) {
    console.error('Error checking team_chemistry constraints:', error);
    
    // Try a direct query to check the constraint
    try {
      const { data: teamChem, error: teamChemError } = await supabase
        .from('team_chemistry')
        .insert([{
          team_id: '00000000-0000-0000-0000-000000000000', // Invalid team ID
          team_name: 'Test Team',
          team_abbreviation: 'TST',
          score: 50,
          elements: {},
          aspects: {},
          calculated_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }])
        .select();
      
      if (teamChemError) {
        console.error('Error inserting test record:', teamChemError);
      } else {
        console.log('Test record inserted successfully:', teamChem);
      }
    } catch (insertError) {
      console.error('Error in test insert:', insertError);
    }
  }
}

checkTeamChemistryConstraint();

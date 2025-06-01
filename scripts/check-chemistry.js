import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamChemistry() {
  console.log('🔍 Checking team chemistry data...');
  
  try {
    // Check if the table exists
    const { data: tableData, error: tableError } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing team_chemistry table:', tableError);
      return;
    }
    
    console.log(`✅ team_chemistry table exists with ${tableData?.length || 0} records`);
    
    // Get count of records
    const { count, error: countError } = await supabase
      .from('team_chemistry')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting records:', countError);
    } else {
      console.log(`📊 Total team chemistry records: ${count}`);
    }
    
    // Get some sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('team_chemistry')
      .select('team_name, team_abbreviation, overall_score, calculated_at')
      .order('overall_score', { ascending: false })
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }
    
    if (!sampleData || sampleData.length === 0) {
      console.log('ℹ️ No team chemistry data found');
      return;
    }
    
    console.log('\n🏆 Top 5 Teams by Chemistry Score:');
    console.table(sampleData);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTeamChemistry();

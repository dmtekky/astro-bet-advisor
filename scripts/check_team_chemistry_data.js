import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or Key is not defined in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamChemistry(teamId) {
  console.log(`🔍 Checking chemistry data for team ID: ${teamId}`);
  
  try {
    // 1. First try to find the team in the teams table
    console.log('\n🔍 Looking up team in teams table...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name, external_id, league_id, league:leagues(id, name, key)')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      console.error('❌ Error fetching team:', teamError);
      throw teamError;
    }
    
    if (!teamData) {
      console.log('❌ Team not found in teams table');
      return;
    }
    
    console.log(`✅ Found team: ${teamData.name} (ID: ${teamData.id})`);
    console.log(`   External ID: ${teamData.external_id}, League: ${teamData.league?.name || 'N/A'} (${teamData.league?.key || 'N/A'})`);
    
    // 2. Check team_chemistry table by UUID
    console.log('\n🔍 Checking team_chemistry table by UUID...');
    const { data: chemByUuid, error: uuidError } = await supabase
      .from('team_chemistry')
      .select('*')
      .eq('team_id', teamId);
      
    if (uuidError) {
      console.error('❌ Error querying by UUID:', uuidError);
    } else {
      console.log(`✅ Found ${chemByUuid?.length || 0} entries by UUID`);
    }
    
    // 3. If we have an external_id, try that too
    if (teamData.external_id) {
      console.log(`\n🔍 Checking team_chemistry table by external ID (${teamData.external_id})...`);
      const { data: chemByExtId, error: extIdError } = await supabase
        .from('team_chemistry')
        .select('*')
        .eq('team_id', teamData.external_id.toString());
        
      if (extIdError) {
        console.error('❌ Error querying by external ID:', extIdError);
      } else {
        console.log(`✅ Found ${chemByExtId?.length || 0} entries by external ID`);
      }
      
      if (chemByExtId && chemByExtId.length > 0) {
        console.log('\n🧪 Chemistry data found by external ID:');
        console.log('  Score:', chemByExtId[0].score);
        console.log('  Elements:', JSON.stringify(chemByExtId[0].elements, null, 2));
        console.log('  Aspects:', JSON.stringify(chemByExtId[0].aspects, null, 2));
        console.log('  Last Updated:', chemByExtId[0].last_updated || chemByExtId[0].calculated_at);
      }
    }
    
    // 4. If we found chemistry data by UUID, show it
    if (chemByUuid && chemByUuid.length > 0) {
      console.log('\n🧪 Chemistry data found by UUID:');
      console.log('  Score:', chemByUuid[0].score);
      console.log('  Elements:', JSON.stringify(chemByUuid[0].elements, null, 2));
      console.log('  Aspects:', JSON.stringify(chemByUuid[0].aspects, null, 2));
      console.log('  Last Updated:', chemByUuid[0].last_updated || chemByUuid[0].calculated_at);
    } else {
      console.log('\n❌ No chemistry data found for this team in team_chemistry table');
      
      // 5. Check if there's any data in nba_teams as fallback (for NBA teams)
      if (teamData.league?.key === 'nba') {
        console.log('\n🔍 Checking nba_teams table for chemistry data...');
        const { data: nbaTeamData, error: nbaError } = await supabase
          .from('nba_teams')
          .select('id, name, chemistry_score, elemental_balance, last_astro_update')
          .eq('id', teamId)
          .single();
          
        if (nbaError) {
          console.error('❌ Error querying nba_teams:', nbaError);
        } else if (nbaTeamData) {
          console.log('✅ Found NBA team data:');
          console.log('  Chemistry Score:', nbaTeamData.chemistry_score);
          console.log('  Elemental Balance:', nbaTeamData.elemental_balance);
          console.log('  Last Astro Update:', nbaTeamData.last_astro_update);
        } else {
          console.log('❌ No data found in nba_teams table');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking team chemistry:', error);
  }
}

// The team ID from the URL: 1b8311d5-9f37-4638-9b2d-16ebbeab895a
const TEAM_ID = '1b8311d5-9f37-4638-9b2d-16ebbeab895a';
console.log('Starting debug for team ID:', TEAM_ID);
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? '***' : 'Not set');
console.log('Supabase Key:', process.env.VITE_SUPABASE_KEY ? '***' : 'Not set');

// Run the check
checkTeamChemistry(TEAM_ID).catch(console.error);

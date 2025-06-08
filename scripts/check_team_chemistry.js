import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamChemistry(teamId) {
  try {
    console.log(`Checking chemistry data for team ID: ${teamId}`);
    
    // Check nba_teams table
    const { data: nbaTeam, error: nbaError } = await supabase
      .from('nba_teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (nbaError) {
      console.error('Error fetching from nba_teams:', nbaError);
    } else if (nbaTeam) {
      console.log('NBA Team Data:', {
        id: nbaTeam.id,
        name: nbaTeam.name,
        chemistry_score: nbaTeam.chemistry_score,
        elemental_balance: nbaTeam.elemental_balance,
        last_astro_update: nbaTeam.last_astro_update
      });
    } else {
      console.log('No data found in nba_teams for team ID:', teamId);
    }

    // Check team_chemistry table
    const { data: teamChem, error: chemError } = await supabase
      .from('team_chemistry')
      .select('*')
      .eq('team_id', teamId);

    if (chemError) {
      console.error('Error fetching from team_chemistry:', chemError);
    } else if (teamChem && teamChem.length > 0) {
      console.log('Team Chemistry Data:', teamChem);
    } else {
      console.log('No data found in team_chemistry for team ID:', teamId);
    }

  } catch (error) {
    console.error('Error checking team chemistry:', error);
  }
}

// Run with the team ID from your URL
const teamId = '1b8311d5-9f37-4638-9b2d-16ebbeab895a';

async function checkTeamWithExternalId(teamId) {
  // First get the team data to check external_id
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('id, name, external_id, league_id')
    .eq('id', teamId)
    .single();

  if (teamError) {
    console.error('Error fetching team data:', teamError);
    return;
  }

  console.log('Team Data:', {
    id: teamData.id,
    name: teamData.name,
    external_id: teamData.external_id,
    league_id: teamData.league_id
  });

  // Now check team_chemistry with both UUID and external_id
  if (teamData.external_id) {
    console.log('\nChecking team_chemistry with external_id:', teamData.external_id);
    const { data: chemByExternalId, error: chemError } = await supabase
      .from('team_chemistry')
      .select('*')
      .eq('team_id', teamData.external_id);

    if (chemError) {
      console.error('Error fetching chemistry by external_id:', chemError);
    } else if (chemByExternalId && chemByExternalId.length > 0) {
      console.log('Chemistry data found by external_id:', chemByExternalId);
    } else {
      console.log('No chemistry data found with external_id');
    }
  }

  // Also check with UUID
  console.log('\nChecking team_chemistry with UUID:', teamId);
  const { data: chemByUuid, error: uuidError } = await supabase
    .from('team_chemistry')
    .select('*')
    .eq('team_id', teamId);

  if (uuidError) {
    console.error('Error fetching chemistry by UUID:', uuidError);
  } else if (chemByUuid && chemByUuid.length > 0) {
    console.log('Chemistry data found by UUID:', chemByUuid);
  } else {
    console.log('No chemistry data found with UUID');
  }
}

// Run the checks
checkTeamChemistry(teamId);
checkTeamWithExternalId(teamId);

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

async function checkNBAPlayersStructure() {
  try {
    // Get a sample row from nba_players
    const { data: player, error } = await supabase
      .from('nba_players')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!player) {
      console.log('No data in nba_players table');
      return;
    }

    console.log('NBA Players table structure:');
    console.log(Object.keys(player).map(key => ({
      column: key,
      type: typeof player[key],
      sample_value: player[key]
    })));

    // Check if we can find players for a specific team
    const teamId = '1'; // Example team ID
    console.log(`\nChecking for players with team_id = ${teamId}`);
    
    const { data: players, error: playersError } = await supabase
      .from('nba_players')
      .select('*')
      .eq('team_id', teamId)
      .limit(5);
      
    if (playersError) throw playersError;
    
    if (!players || players.length === 0) {
      console.log(`No players found for team_id ${teamId}`);
      
      // Check what team_ids exist
      const { data: teams, error: teamsError } = await supabase
        .from('nba_teams')
        .select('external_team_id, name')
        .limit(5);
        
      if (teamsError) throw teamsError;
      
      console.log('\nSample of team IDs in nba_teams:');
      console.log(teams);
      
      // Check what team_ids are in nba_players
      const { data: playerTeams, error: playerTeamsError } = await supabase
        .from('nba_players')
        .select('team_id')
        .limit(5);
        
      if (playerTeamsError) throw playerTeamsError;
      
      console.log('\nSample of team_ids in nba_players:');
      console.log([...new Set(playerTeams.map(p => p.team_id))].filter(Boolean));
    } else {
      console.log(`Found ${players.length} players for team_id ${teamId}:`);
      console.log(players.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        team_id: p.team_id,
        active: p.active,
        birth_date: p.birth_date
      })));
    }

  } catch (error) {
    console.error('Error checking nba_players structure:', error);
  }
}

checkNBAPlayersStructure();

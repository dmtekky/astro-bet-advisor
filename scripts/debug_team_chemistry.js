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

async function debugTeamChemistry() {
  console.log('🔍 Starting debug script...');
  
  try {
    // 1. Check if we can connect to the database
    console.log('\n🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('nba_teams')
      .select('count', { count: 'exact', head: true });
    
    if (testError) throw testError;
    console.log('✅ Database connection successful');
    
    // 2. Get a single NBA team to test with
    console.log('\n🔄 Fetching a single NBA team...');
    const { data: team, error: teamError } = await supabase
      .from('nba_teams')
      .select('id, name, external_team_id')
      .limit(1)
      .single();
      
    if (teamError) throw teamError;
    console.log(`📋 Selected team: ${team.name} (ID: ${team.id}, External ID: ${team.external_team_id})`);
    
    // 3. Try to fetch players for this team
    console.log(`\n👥 Fetching players for team ${team.name}...`);
    const { data: players, error: playersError } = await supabase
      .from('nba_players')
      .select('id, first_name, last_name, team_id, impact_score, astro_influence, birth_date, active, current_injury')
      .eq('team_id', team.external_team_id)
      .limit(5);
      
    if (playersError) throw playersError;
    console.log(`✅ Found ${players.length} players for ${team.name}`);
    
    if (players.length > 0) {
      console.log('Sample player:', {
        name: `${players[0].first_name} ${players[0].last_name}`,
        team_id: players[0].team_id,
        active: players[0].active,
        current_injury: players[0].current_injury,
        impact_score: players[0].impact_score,
        has_astro: !!players[0].astro_influence,
        has_birth_date: !!players[0].birth_date
      });
    }
    
    // 4. Try to update the team's chemistry score
    console.log('\n🔄 Updating team chemistry...');
    const { error: updateError } = await supabase
      .from('nba_teams')
      .update({
        chemistry_score: 75, // Test value
        last_astro_update: new Date().toISOString()
      })
      .eq('id', team.id);
      
    if (updateError) throw updateError;
    console.log('✅ Successfully updated team chemistry');
    
    console.log('\n🎉 Debug script completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
  }
}

// Run the debug function
debugTeamChemistry();

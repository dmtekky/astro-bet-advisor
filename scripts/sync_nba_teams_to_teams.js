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

console.log('Supabase client initialized with URL:', supabaseUrl ? '***' : 'Not found');
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncNBATeams() {
  console.log('🔍 Starting NBA teams sync...');
  
  try {
    // 1. Fetch all NBA teams
    console.log('Fetching NBA teams...');
    const { data: nbaTeams, error: nbaTeamsError } = await supabase
      .from('nba_teams')
      .select('*');
    
    if (nbaTeamsError) throw nbaTeamsError;
    console.log(`Found ${nbaTeams.length} NBA teams`);
    
    // 2. Fetch existing teams to avoid duplicates
    const { data: existingTeams, error: existingTeamsError } = await supabase
      .from('teams')
      .select('id, name, external_id, league_id');
    
    if (existingTeamsError) throw existingTeamsError;
    
    // Create a map of external_id to team ID for quick lookup
    const existingTeamsMap = new Map(
      existingTeams
        .filter(team => team.external_id && team.league_id === 'f51781ac-9e68-4e0c-a16c-d63e36b295c6')
        .map(team => [team.external_id, team.id])
    );
    
    // 3. Prepare teams data for upsert
    const teamsToUpsert = nbaTeams.map(team => {
      const teamData = {
        city: team.city, // Populate the city column
        name: team.name,   // Use only the mascot name for the 'name' column
        abbreviation: team.abbreviation,
        external_id: team.external_team_id,
        league_id: 'f51781ac-9e68-4e0c-a16c-d63e36b295c6', // NBA League ID
        logo_url: team.logo_url,
        primary_color: team.team_colours_hex?.[0] || null,
        // created_at will be set by default or trigger if not provided for new records
        // updated_at will be set by trigger
      };
      const existingId = existingTeamsMap.get(team.external_team_id);
      if (existingId) {
        teamData.id = existingId;
      } else {
        // For new records, ensure created_at is set if not handled by DB default on insert
        teamData.created_at = new Date().toISOString();
      }
      // Always set updated_at for both new and existing records if not handled by DB trigger for upsert
      teamData.updated_at = new Date().toISOString();
      return teamData;
    });
    
    // 4. Upsert teams
    console.log('Upserting teams...');
    const { data: upsertedTeams, error: upsertError } = await supabase
      .from('teams')
      .upsert(teamsToUpsert, { onConflict: 'external_id,league_id' })
      .select('id, name, external_id, league_id');
    
    if (upsertError) throw upsertError;
    
    console.log(`✅ Successfully synced ${upsertedTeams.length} NBA teams`);
    console.log('Sample of upserted teams:', upsertedTeams.slice(0, 3));
    
    return { success: true, count: upsertedTeams.length };
    
  } catch (error) {
    console.error('❌ Error syncing NBA teams:', error);
    return { success: false, error };
  }
}

// Run the sync
syncNBATeams()
  .then(({ success, count, error }) => {
    if (success) {
      console.log(`\n🏁 NBA teams sync completed successfully. Synced ${count} teams.`);
      process.exit(0);
    } else {
      console.error('❌ NBA teams sync failed:', error);
      process.exit(1);
    }
  });

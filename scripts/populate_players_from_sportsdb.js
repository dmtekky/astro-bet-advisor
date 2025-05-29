import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Using node-fetch for broader Node version compatibility
import { createHash } from 'crypto';

dotenv.config({ path: '../.env' }); // Ensure .env is loaded from project root

// Helper function to ensure string doesn't exceed max length
function limitString(str, maxLength) {
  if (!str) return str;
  return String(str).slice(0, maxLength);
}

// Helper function to format external ID to ensure it's not too long
function formatExternalId(id) {
  // Convert to string and take first 10 characters
  return limitString(id, 10);
}

// Function to validate and clean player data
function cleanPlayerData(player) {
  return {
    external_id: formatExternalId(player.idPlayer),
    first_name: limitString(player.strPlayer.split(' ')[0], 100),
    last_name: limitString(player.strPlayer.split(' ').slice(1).join(' '), 100),
    full_name: limitString(player.strPlayer, 200),
    birth_date: limitString(player.dateBorn, 50),
    birth_city: limitString(player.strBirthLocation, 200),
    birth_country: limitString(player.strNationality, 100),
    nationality: limitString(player.strNationality, 100),
    height: player.strHeight ? parseInt(player.strHeight.replace(/[^0-9]/g, '')) || 0 : 0,
    weight: player.strWeight ? parseInt(player.strWeight.replace(/[^0-9]/g, '')) || 0 : 0,
    primary_position: limitString(player.strPosition, 50),
    primary_number: player.strNumber ? parseInt(player.strNumber) || 0 : 0,
    headshot_url: limitString(player.strCutout || player.strThumb, 500),
    current_team_id: player.teamId,
    idteam: limitString(player.idTeam, 20),
    strteam: limitString(player.strTeam, 100),
    is_active: player.strStatus === 'Active',
    external_source: 'TheSportsDB',
    last_updated: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY; // Using anon key is fine for reads, but service_role for writes
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey; // Fallback to anon key if service_role not set, but recommend service_role

const sportsDbApiKey = process.env.THESPORTSDB_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !sportsDbApiKey) {
  console.error('Supabase URL, Service Key, or TheSportsDB API Key is missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchPlayersFromSportsDB(teamExternalId) {
  const url = `https://www.thesportsdb.com/api/v1/json/${sportsDbApiKey}/lookup_all_players.php?id=${teamExternalId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching players for team ${teamExternalId}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data.player; // The API returns an object with a 'player' array
  } catch (error) {
    console.error(`Network error fetching players for team ${teamExternalId}:`, error);
    return null;
  }
}

async function populatePlayers() {
  console.log('Starting player population script...');

  // 1. Fetch all teams from Supabase
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, external_id, league_id'); // Removed non-existent sport field

  if (teamsError) {
    console.error('Error fetching teams from Supabase:', teamsError);
    return;
  }

  if (!teams || teams.length === 0) {
    console.log('No teams found in Supabase. Exiting.');
    return;
  }

  console.log(`Found ${teams.length} teams. Fetching players for each...`);

  for (const team of teams) {
    if (!team.external_id) {
      console.warn(`Team '${team.name}' (ID: ${team.id}) is missing an external_id. Skipping.`);
      continue;
    }

    console.log(`Fetching players for team: ${team.name} (Supabase ID: ${team.id}, TheSportsDB ID: ${team.external_id})`);
    const playersData = await fetchPlayersFromSportsDB(team.external_id);

    if (!playersData || playersData.length === 0) {
      console.log(`No players found on TheSportsDB for team ${team.name} (TheSportsDB ID: ${team.external_id}).`);
      continue;
    }

    console.log(`Found ${playersData.length} players for ${team.name}. Processing...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process players one by one to handle individual errors
    for (const player of playersData) {
      // Ensure external_id is a string and not too long
      const playerData = cleanPlayerData({
        ...player,
        teamId: team.id
      });
      
      console.log(`Player: ${player.strPlayer}, Original ID: ${player.idPlayer}, Formatted ID: ${playerData.external_id}, Type: ${typeof playerData.external_id}, Length: ${playerData.external_id ? playerData.external_id.length : 0}`);
      console.log('Player data to be saved:', JSON.stringify(playerData, null, 2));

      try {
        const formattedId = formatExternalId(player.idPlayer);
        console.log(`Processing player ${player.strPlayer} (${player.idPlayer}) with formatted ID: ${formattedId}`);
        
        // First, try to update existing player
        console.log(`Checking for existing player with external_id: ${playerData.external_id}`);
        const { data: existingPlayer, error: fetchError } = await supabase
          .from('players')
          .select('id, external_id')
          .eq('external_id', playerData.external_id)
          .maybeSingle();
          
        console.log('Existing player check result:', { existingPlayer, fetchError });

        let error;
        try {
          if (existingPlayer) {
            console.log(`Updating existing player ID: ${existingPlayer.id}`);
            const { data, error: updateError } = await supabase
              .from('players')
              .update(playerData)
              .eq('id', existingPlayer.id)
              .select();
            
            console.log('Update result:', { data, error: updateError });
            error = updateError;
          } else {
            console.log('Inserting new player');
            const { data, error: insertError } = await supabase
              .from('players')
              .insert([playerData])
              .select();
              
            console.log('Insert result:', { data, error: insertError });
            error = insertError;
          }
        } catch (dbError) {
          console.error('Database operation error:', dbError);
          error = dbError;
        }

        if (error) {
          console.error(`Error processing player ${player.strPlayer} (${player.idPlayer}):`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Unexpected error processing player ${player.strPlayer} (${player.idPlayer}):`, err);
        errorCount++;
      }
    }
    
    console.log(`Processed players for ${team.name}: ${successCount} successful, ${errorCount} errors`);
    
    // Optional: Add a small delay to avoid hitting API rate limits if any
    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
  }

  console.log('Player population script finished.');
}

populatePlayers().catch(console.error);

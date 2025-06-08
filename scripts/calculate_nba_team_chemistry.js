#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateTeamChemistry } from '../src/utils/teamChemistry.js';

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

// Helper to get current date in YYYY-MM-DD format
function getCurrentDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to fetch astrodata for a given date
async function fetchAstroDataForDate(dateString) {
  try {
    const { data, error } = await supabase
      .from('astro_data')
      .select('*')
      .eq('date', dateString)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
      console.error(`❌ Error fetching astrodata for ${dateString}:`, error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`❌ Exception fetching astrodata for ${dateString}:`, error.message);
    return null;
  }
}

async function updateNBATeamChemistry() {
  const startTime = new Date();
  console.log(`\n🔮 Starting NBA team chemistry update at ${startTime.toISOString()}`);
  console.log('Environment:', {
    node: process.version,
    cwd: process.cwd(),
    envPath: path.resolve(__dirname, '../.env'),
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set'
  });

  try {
    console.log('Fetching NBA teams...');
    const { data: teams, error: teamsError, count: teamsCount } = await supabase
      .from('nba_teams')
      .select('id, name, abbreviation, external_team_id, team_colours_hex, logo_url', { count: 'exact' });
    
    console.log(`Found ${teams?.length || 0} NBA teams`);
    if (teams?.length > 0) {
      console.log('Sample team:', {
        id: teams[0].id,
        name: teams[0].name,
        abbreviation: teams[0].abbreviation,
        external_team_id: teams[0].external_team_id
      });
    }

    if (teamsError) {
      throw new Error(`Error fetching NBA teams: ${teamsError.message}`);
    }

    if (!teams || teams.length === 0) {
      console.log('No NBA teams found.');
      return true;
    }

    console.log(`✅ Found ${teams.length} NBA teams to process.`);
    let errorCount = 0;
    let teamsUpdated = 0;
    let teamsSkipped = 0;

    const currentDateStr = getCurrentDate();
    console.log(`📅 Fetching master astrodata for date: ${currentDateStr}`);
    const masterAstroDataToday = await fetchAstroDataForDate(currentDateStr);
    if (!masterAstroDataToday) {
      console.warn('⚠️ Master astrodata for today could not be fetched. Chemistry scores might be less accurate.');
    }

    for (const team of teams) {
      console.log(`\n--- Processing team ${team.name} (${team.abbreviation || team.id}) ---`);
      
      console.log(`Fetching players for team ${team.id} (${team.name}) using external_team_id = ${team.external_team_id}...`);
      console.log(`Fetching players for team ${team.name} (external_team_id: ${team.external_team_id})...`);
      const { data: players, error: playersError, count: playersCount } = await supabase
        .from('nba_players')
        .select('*')
        .eq('team_id', team.external_team_id)
        .not('birth_date', 'is', null)
        .not('impact_score', 'is', null)
        .not('astro_influence', 'is', null)
        .limit(15); // Limit to 15 players per team for performance
      
      console.log(`Found ${playersCount} players for team ${team.id}:`, { playersError, playersSample: players?.slice(0, 1) });

      if (playersError) {
        console.error(`❌ Error fetching players for team ${team.name}:`, playersError);
        errorCount++;
        continue;
      }

      if (!players || players.length === 0) {
        console.log(`⚠️ No players with required data found for team ${team.name}. Setting chemistry to 0.`);
        const zeroChemistryData = {
          team_id: team.id,
          team_name: team.name,
          team_abbreviation: team.abbreviation || '',
          score: 0,
          elements: { 
            chemistryElementScore: 0, 
            balance: 0, 
            fire: 0, 
            earth: 0, 
            air: 0, 
            water: 0, 
            synergyBonus: 0, 
            diversityBonus: 0 
          },
          aspects: { 
            netHarmony: 0, 
            harmonyScore: 0, 
            challengeScore: 0, 
            aspects: [], 
            score: 0 
          },
          calculated_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
        
        // Ensure the team exists in the main teams table
        const { data: mainTeam, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('name', team.name)
          .maybeSingle();

        let teamId = mainTeam?.id;
        
        // If team doesn't exist in main teams table, create it
        if (!mainTeam) {
          console.log(`ℹ️  Team ${team.name} not found in main teams table, creating...`);
          const { data: newTeam, error: createError } = await supabase
            .from('teams')
            .insert([
              {
                name: team.name,
                abbreviation: team.abbreviation,
                league_id: 'nba',
                external_team_id: team.id.toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error(`❌ Error creating team ${team.name}:`, createError);
            continue;
          }
          teamId = newTeam.id;
          console.log(`✅ Created team ${team.name} with ID: ${teamId}`);
        } else {
          teamId = mainTeam.id;
        }

        // Upsert zero chemistry data
        const { data: updatedChemistry, error: upsertError } = await supabase
          .from('team_chemistry')
          .upsert(
            {
              ...zeroChemistryData,
              team_id: teamId
            },
            { onConflict: 'team_id' }
          )
          .select()
          .single();

        if (upsertError) {
          console.error(`❌ Error upserting zero chemistry data for ${team.name}:`, upsertError);
          errorCount++;
        } else {
          console.log(`✅ Set zero chemistry for team ${team.name} (no eligible players)`);
          teamsUpdated++;
        }
        continue;
      }
      
      console.log(`Found ${players.length} players for team ${team.name}.`);

      const mappedPlayers = players.map(player => {
        const mappedPlayer = {
          id: player.id,
          name: `${player.first_name} ${player.last_name}`.trim(),
          team_id: player.team_id,
          position: player.primary_position,
          birth_date: player.birth_date,
          impact_score: player.impact_score || 0,
          astro_influence: player.astro_influence || 0,
          is_active: player.active !== false, // Default to true if null/undefined
          injury_status: 'active'
        };

        // Set injury status if player has a current injury
        if (player.current_injury) {
          const status = String(player.current_injury).toLowerCase();
          if (status.includes('day-to-day') || status.includes('dtd')) {
            mappedPlayer.injury_status = 'day-to-day';
          } else if (status.includes('out') || status.includes('o')) {
            mappedPlayer.injury_status = 'out';
          } else if (status.trim()) {
            mappedPlayer.injury_status = 'injured';
          }
        }

        // Recalculate is_active based on final injury_status for calculatePlayerWeights
        mappedPlayer.is_active = !(mappedPlayer.injury_status === 'out' || mappedPlayer.injury_status === 'injured_reserve');
        
        return mappedPlayer;
      });

      console.log(`Calculating chemistry for ${mappedPlayers.length} mapped players...`);
      const chemistry = calculateTeamChemistry(mappedPlayers, { 
        teamAstroData: masterAstroDataToday 
      });

      try {
        // Prepare the update data with proper number formatting and constraints
        const updateData = {
          chemistry_score: Math.min(100, Math.max(0, Math.round(chemistry.score || 0))),
          influence_score: Math.min(100, Math.max(0, Math.round((chemistry.aspects?.netHarmony || 0) * 100))), // Convert to 0-100 scale and cap at 100
          elemental_balance: {
            Air: Math.min(100, Math.max(0, Math.round((chemistry.elements?.air || 0) * 100))) / 100,
            Fire: Math.min(100, Math.max(0, Math.round((chemistry.elements?.fire || 0) * 100))) / 100,
            Earth: Math.min(100, Math.max(0, Math.round((chemistry.elements?.earth || 0) * 100))) / 100,
            Water: Math.min(100, Math.max(0, Math.round((chemistry.elements?.water || 0) * 100))) / 100,
            balance_score: Math.min(100, Math.max(0, Math.round((chemistry.elements?.balance || 0) * 100))) / 100,
    }

    const endTime = new Date();
    const durationMs = endTime - startTime;
    console.log(`\n🏁 NBA Team chemistry update finished in ${durationMs / 1000}s.`);
    console.log(`Updated: ${teamsUpdated} teams, Skipped: ${teamsSkipped} teams, Errors: ${errorCount} teams.`);
    return errorCount === 0;

  } catch (error) {
    console.error('❌ Fatal error during NBA team chemistry update:', error);
    return false;
  }
}

// Run the update
updateNBATeamChemistry()
  .then(success => {
    console.log(`Script ${success ? 'completed successfully' : 'completed with errors'}.`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled exception:', err);
    process.exit(1);
  });

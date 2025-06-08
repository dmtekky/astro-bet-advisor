import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { join } from 'path';

const streamPipeline = promisify(pipeline);

dotenv.config();

const SPORTS_DB_API_KEY = process.env.VITE_SPORTSDB_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase URL or service role key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to normalize team names for matching
function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function updateTeamLogos() {
  try {
    // 1. Fetch all teams from your database
    console.log('Fetching teams from database...');
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) throw error;
    if (!teams || teams.length === 0) {
      throw new Error('No teams found in database');
    }
    console.log(`Found ${teams.length} teams in database`);

    // 2. Fetch all MLB teams from TheSportsDB
    const apiKey = process.env.VITE_SPORTSDB_API_KEY || process.env.SPORTSDB_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_SPORTSDB_API_KEY is not set in .env');
    }

    const apiUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=MLB`;
    console.log('Fetching MLB teams from:', apiUrl);
    
    const apiResponse = await axios.get(apiUrl);
    const apiTeams = apiResponse.data?.teams || [];
    
    if (apiTeams.length === 0) {
      throw new Error('No teams found in TheSportsDB API response');
    }
    console.log(`Found ${apiTeams.length} teams in TheSportsDB`);

    // 3. Create a map of team IDs to API team data
    const teamMap = new Map();
    for (const team of apiTeams) {
      if (team.idTeam) {
        teamMap.set(team.idTeam, team);
      }
    }

    // 4. Process each team in the database
    let updatedCount = 0;
    let errorCount = 0;

    for (const team of teams) {
      try {
        console.log(`\nProcessing ${team.name}...`);
        
        // Find matching team in API data using external_id
        if (!team.external_id) {
          console.warn(`⚠️ No external_id found for team: ${team.name}`);
          errorCount++;
          continue;
        }

        // Handle external_id whether it's a number or string
        let teamId: string;
        let teamSlug: string;
        const externalId = team.external_id;
        
        if (typeof externalId === 'number') {
          teamId = externalId.toString();
          teamSlug = team.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        } else if (typeof externalId === 'string') {
          // If it's a string in format "135267-arizona-diamondbacks"
          const parts = externalId.split('-');
          teamId = parts[0];
          teamSlug = parts.slice(1).join('-');
        } else {
          console.warn(`⚠️ Unexpected external_id type for ${team.name}:`, typeof externalId, externalId);
          errorCount++;
          continue;
        }

        console.log(`Looking up details for team ID: ${teamId} (${team.name})`);
        
        // Fetch team details
        const teamDetailUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupteam.php?id=${teamId}`;
        console.log(`Fetching team details from: ${teamDetailUrl}`);
        
        const teamResponse = await axios.get(teamDetailUrl);
        const teamData = teamResponse.data?.teams?.[0];
        
        if (!teamData) {
          console.warn(`⚠️ No team details found for ID: ${teamId} (${team.name})`);
          errorCount++;
          continue;
        }
        
        // Debug: Log team data
        console.log('Team Data:', {
          id: teamData.idTeam,
          name: teamData.strTeam,
          badge: teamData.strBadge,
          badge2: teamData.strBadge2,
          logo: teamData.strTeamLogo,
          jersey: teamData.strTeamJersey,
          banner: teamData.strTeamBanner,
          // Add more fields as needed
        });
        
        // Try to find a valid badge URL (strBadge is the correct field)
        const badgeUrl = teamData.strBadge || 
                        teamData.strBadge2 ||
                        teamData.strTeamBadge ||
                        teamData.strTeamBadge2 || 
                        teamData.strTeamLogo ||
                        teamData.strTeamJersey ||
                        teamData.strTeamBanner ||
                        `https://www.thesportsdb.com/images/media/team/badge/${teamSlug}.png`;

        if (!badgeUrl) {
          console.warn(`⚠️ No badge URL found for: ${team.name}`);
          console.log('Available fields:', Object.keys(teamData).filter(k => k.startsWith('strTeam')));
          errorCount++;
          continue;
        }
        
        console.log(`Using badge URL: ${badgeUrl}`);
        
        // Update the team in the database
        const { error: updateError } = await supabase
          .from('teams')
          .update({ 
            logo_url: badgeUrl, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', team.id);
        
        if (updateError) {
          console.error(`❌ Database error updating ${team.name}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully updated ${team.name} logo`);
          updatedCount++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error processing team ${team.name}:`, error.message);
        errorCount++;
      }
    }

    // 5. Print summary
    console.log('\n--- Logo Update Summary ---');
    console.log(`✅ Successfully updated: ${updatedCount} teams`);
    console.log(`⚠️  Errors/Warnings: ${errorCount}`);
    console.log('---------------------------');
    console.log('Team logo update completed');
  } catch (error) {
    console.error('❌ Error in updateTeamLogos:', error.message);
    process.exit(1);
  }
}

// Run the function
updateTeamLogos();

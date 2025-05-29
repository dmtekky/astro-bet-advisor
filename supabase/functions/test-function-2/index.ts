import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface Player {
  id: string;
  name: string;
  position: string;
  jersey?: string;
  age?: number;
  height?: string;
  weight?: string;
  stats?: any; // This will hold the detailed stats object
  error?: string; // For any errors fetching stats for this specific player
}

const DEFAULT_TEAM_ID = '29'; // Arizona Diamondbacks
const CURRENT_SEASON = new Date().getFullYear();

// Function to fetch team roster
async function fetchTeamRoster(teamId: string): Promise<Player[]> {
  console.log(`Fetching roster for team ID: ${teamId}...`);
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/roster`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch roster for team ${teamId}: ${response.status} ${response.statusText}. URL: ${url}. Response:`, errorText);
      throw new Error(`Roster fetch failed for team ${teamId}: ${response.status}`);
    }
    const rosterData = await response.json();
    const positionGroups = rosterData.athletes;

    if (positionGroups && Array.isArray(positionGroups)) {
      console.log(`Found 'data.athletes' array with ${positionGroups.length} position groups for team ${teamId}.`);
      const extractedPlayers: Player[] = [];

      for (const group of positionGroups) {
        if (group.items && Array.isArray(group.items)) {
          console.log(`Processing group '${group.position || 'Unknown Group'}' with ${group.items.length} items.`);
          for (const athlete of group.items) {
            if (athlete && athlete.id && athlete.fullName) {
              extractedPlayers.push({
                id: athlete.id.toString(),
                name: athlete.fullName,
                position: athlete.position ? athlete.position.displayName : (group.position || 'N/A'),
                jersey: athlete.jersey || 'N/A',
                age: athlete.age,
                height: athlete.displayHeight,
                weight: athlete.displayWeight,
              });
            } else {
              console.warn(`Skipping an athlete object in group '${group.position || 'Unknown Group'}' due to missing id or fullName:`, athlete);
            }
          }
        } else {
          console.warn(`Position group '${group.position || 'Unknown Group'}' did not have a valid 'items' array:`, group);
        }
      }

      if (extractedPlayers.length > 0) {
        console.log(`Successfully extracted ${extractedPlayers.length} players from roster for team ${teamId}.`);
        return extractedPlayers;
      } else {
        console.error(`No players were extracted for team ${teamId} after processing all position groups. URL: ${url}`);
        // It's possible the raw data was logged if positionGroups itself was problematic, but here we confirm no players were extracted from valid groups.
        return []; 
      }
    } else {
      console.error(`'data.athletes' key (expected to be position groups) was NOT found or was NOT an array for team ${teamId}. URL: ${url}.`);
      console.log(`RAW ESPN ROSTER RESPONSE for team ${teamId}:`, JSON.stringify(rosterData, null, 2));
      throw new Error(`No roster data (position groups) found in response or 'data.athletes' is not an array for team ${teamId}.`);
    }
  } catch (error) {
    console.error(`Critical error in fetchTeamRoster for team ${teamId} (URL: ${url}):`, error);
    return []; 
  }
}

// Function to fetch team stats
async function fetchTeamStats(teamId: string, season: number): Promise<Record<string, any> | null> {
  console.log(`Fetching team stats for team ID: ${teamId}, Season: ${season}...`);
  // Try the team statistics endpoint first
  const statsUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/statistics?season=${season}`;
  // Also try the team stats summary endpoint as a fallback
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/stats?season=${season}`;
  
  try {
    // Try the main statistics endpoint first
    let response = await fetch(statsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });
    
    let responseText = await response.text();
    
    // If first endpoint fails, try the fallback
    if (!response.ok) {
      console.log(`First team stats endpoint failed (${response.status}). Trying fallback endpoint...`);
      response = await fetch(summaryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        }
      });
      responseText = await response.text();
      
      if (!response.ok) {
        console.error(`Both team stats endpoints failed. Last error: ${response.status} ${response.statusText}. URL: ${summaryUrl}. Response:`, responseText);
        return null;
      }
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log(`Successfully fetched and parsed team stats for team ${teamId} (Season ${season}).`);
      return data;
    } catch (parseError) {
      console.error(`Failed to parse JSON team stats response for team ${teamId} (Season ${season}). Error:`, parseError);
      console.error('Response text that failed to parse for team stats:', responseText);
      return null;
    }
  } catch (error) {
    console.error(`Critical error in fetchTeamStats for team ${teamId} (Season ${season}). Error:`, error);
    return null;
  }
}

// Function to fetch player stats using the correct ESPN API endpoint
async function fetchPlayerStats(playerId: string, season: number, teamId: string = '29'): Promise<Record<string, any> | null> {
  console.log(`Fetching stats for player ID: ${playerId}, Season: ${season}...`);
  
  try {
    // Use the correct ESPN core API endpoint for player statistics
    const coreApiUrl = `https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/seasons/${season}/athletes/${playerId}/statistics`;
    console.log(`Using core API URL: ${coreApiUrl}`);
    
    const response = await fetch(coreApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Failed to fetch stats from core API for player ${playerId} (Season ${season}): ${response.status} ${response.statusText}. Response:`, responseText);
      
      // If the core API fails, try the old site API endpoint as fallback
      console.log(`Trying fallback site API endpoint for player ${playerId}...`);
      const siteApiUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/athletes/${playerId}/stats?season=${season}`;
      
      const fallbackResponse = await fetch(siteApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        }
      });
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        console.log(`Successfully fetched and parsed stats from site API for player ${playerId} (Season ${season}).`);
        return data;
      } else {
        console.log(`Both API endpoints failed for player ${playerId}. Falling back to team stats approach...`);
        
        // If both individual player endpoints fail, try to get stats from team stats
        const teamStats = await fetchTeamStats(teamId, season);
        
        if (!teamStats) {
          console.error(`Failed to fetch team stats for team ${teamId} (Season ${season}).`);
          return null;
        }
        
        // Log the structure of team stats to help debug
        console.log(`Team stats structure keys: ${Object.keys(teamStats).join(', ')}`);
        
        // Try to extract player stats from team stats
        let playerStats = null;
        
        // If we have categories with player stats
        if (teamStats.categories && Array.isArray(teamStats.categories)) {
          console.log(`Found ${teamStats.categories.length} stat categories in team stats.`);
          
          // Extract player stats if available
          for (const category of teamStats.categories) {
            if (category.athletes && Array.isArray(category.athletes)) {
              const playerData = category.athletes.find((athlete: any) => 
                athlete.id === playerId || athlete.athlete?.id === playerId
              );
              
              if (playerData) {
                if (!playerStats) playerStats = {};
                playerStats[category.name || 'unknown'] = playerData;
              }
            }
          }
        }
        
        if (playerStats) {
          console.log(`Successfully extracted stats for player ${playerId} from team stats.`);
          return playerStats;
        } else {
          console.log(`Could not find player ${playerId} in team stats.`);
          return null;
        }
      }
    } else {
      try {
        const data = JSON.parse(responseText);
        console.log(`Successfully fetched and parsed stats from core API for player ${playerId} (Season ${season}).`);
        return data;
      } catch (parseError) {
        console.error(`Failed to parse JSON response from core API for player ${playerId}:`, parseError);
        console.error('Response text that failed to parse:', responseText);
        return null;
      }
    }
  } catch (error) {
    console.error(`Critical error in fetchPlayerStats for player ${playerId} (Season ${season}). Error:`, error);
    return null;
  }
}

console.log('ESPN Stats Scraper Function (Focused Version with improved roster logging) starting...');

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  const requestUrl = new URL(req.url);
  const teamIdParam = requestUrl.searchParams.get('team_id') || DEFAULT_TEAM_ID;
  const playerIdParam = requestUrl.searchParams.get('player_id');
  const seasonParam = parseInt(requestUrl.searchParams.get('season') || String(CURRENT_SEASON), 10);

  if (isNaN(seasonParam) || seasonParam < 1900 || seasonParam > CURRENT_SEASON + 2) { // Allow current year + 1 for future season, +2 for buffer
    return new Response(JSON.stringify({ error: `Invalid season parameter. Please provide a valid year.` }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 400
    });
  }

  try {
    if (playerIdParam) {
      console.log(`Processing request for single player: ID ${playerIdParam}, Season ${seasonParam}`);
      const stats = await fetchPlayerStats(playerIdParam, seasonParam);
      if (stats) {
        return new Response(JSON.stringify(stats, null, 2), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 200
        });
      } else {
        return new Response(JSON.stringify({ error: `Stats not found for player ${playerIdParam} for season ${seasonParam}.` }, null, 2), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 404
        });
      }
    } else {
      console.log(`Processing request for full team roster and all player stats. Team ID: ${teamIdParam}, Season ${seasonParam}`);
      const roster = await fetchTeamRoster(teamIdParam);
      if (!roster || roster.length === 0) {
        // Updated error message to guide user to check logs
        return new Response(JSON.stringify({ error: `No players found or extracted for team ${teamIdParam}. Check Supabase function logs for details on API response and parsing.`, teamId: teamIdParam, season: seasonParam }, null, 2), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 404
        });
      }

      const playersWithStats: Player[] = [];
      await Promise.all(roster.map(async (player) => {
        const stats = await fetchPlayerStats(player.id, seasonParam);
        playersWithStats.push({
          ...player,
          stats: stats || { error: `Stats not found or error fetching for player ${player.id} (S${seasonParam})` }
        });
      }));
      
      playersWithStats.sort((a, b) => a.name.localeCompare(b.name));

      return new Response(JSON.stringify({ teamId: teamIdParam, season: seasonParam, playerCount: playersWithStats.length, players: playersWithStats }, null, 2), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200
      });
    }
  } catch (error) {
    console.error('Critical error in main request handler:', error);
    return new Response(JSON.stringify({ error: 'An unexpected server error occurred.', details: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500
    });
  }
});

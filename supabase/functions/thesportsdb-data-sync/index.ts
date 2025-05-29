// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// @ts-ignore - Deno will resolve this at runtime
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Deno will resolve this at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper to safely get environment variables in Deno
function getEnv(key: string): string {
  // @ts-ignore - Deno.env is available in Deno
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

console.log("Initializing Supabase client...");
const supabaseUrl = getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL");
const supabaseKey =
  getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  getEnv("VITE_SUPABASE_SERVICE_ROLE_KEY") ||
  getEnv("VITE_SUPABASE_KEY");
const sportsDbApiKey =
  getEnv("SPORTS_DB_API_KEY") ||
  getEnv("THESPORTSDB_API_KEY") ||
  getEnv("VITE_SPORTSDB_API_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Starting games sync...");
    
    // Call the sync_games function
    const { data, error } = await supabase
      .rpc('sync_games', { 
        p_api_key: sportsDbApiKey 
      });

    if (error) {
      console.error("Error syncing games:", error);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: error.message,
          details: error 
        }), 
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    console.log("Games sync result:", data);
    return new Response(
      JSON.stringify({ 
        status: "success", 
        data 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: err.message || "Unknown error occurred",
        stack: err.stack 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
    const data = await response.json();
    console.log('5. API Response - teams count:', data.teams?.length || 0);
    
    // 4. Log sample data (first team)
    if (data.teams && data.teams.length > 0) {
      console.log('6. Sample team data:', JSON.stringify({
        id: data.teams[0].idTeam,
        name: data.teams[0].strTeam,
        league: data.teams[0].strLeague
      }, null, 2));
    }
    
    const teams = data.teams || [];
    
    if (teams.length === 0) {
      console.log('7. No teams found in the API response');
      return [];
    }
    
    console.log(`8. Fetched ${teams.length} teams`);
    
    // 5. Get or create league
    console.log('9. Getting or creating league...');
    const leagueId = await getOrCreateMapping(
      MLB_LEAGUE_ID,
      'Major League Baseball',
      'league'
    );
    
    if (!leagueId) {
      throw new Error('10. Failed to get or create league');
    }
    console.log('11. League ID:', leagueId);
    
    // 6. Process teams
    const teamIds = [];
    
    for (const team of teams) {
      try {
        console.log(`12. Processing team: ${team.strTeam} (${team.idTeam})`);
        
        const teamId = await getOrCreateMapping(
          team.idTeam,
          team.strTeam || `Team ${team.idTeam}`,
          'team',
          leagueId
        );
        
        if (!teamId) {
          console.error(`13. Failed to get/create mapping for team: ${team.strTeam}`);
          continue;
        }
        
        teamIds.push(teamId);
        
        // 7. Prepare team data
        const teamData = {
          id: teamId,
          name: team.strTeam,
          short_name: team.strTeamShort,
          alternate_name: team.strAlternate,
          formed_year: parseInteger(team.intFormedYear),
          sport: team.strSport || 'Baseball',
          league_id: leagueId,
          league_name: team.strLeague || 'MLB',
          stadium: team.strStadium,
          stadium_thumbnail: team.strStadiumThumb,
          stadium_description: team.strStadiumDescription,
          stadium_location: team.strStadiumLocation,
          stadium_capacity: parseInteger(team.intStadiumCapacity),
          website: team.strWebsite,
          facebook: team.strFacebook,
          twitter: team.strTwitter,
          instagram: team.strInstagram,
          description: team.strDescriptionEN,
          gender: team.strGender,
          country: team.strCountry,
          badge: team.strTeamBadge,
          jersey: team.strTeamJersey,
          logo: team.strTeamLogo,
          banner: team.strTeamBanner,
          api_last_updated: new Date().toISOString()
        };
        
        console.log('14. Upserting team data:', JSON.stringify({
          id: teamData.id,
          name: teamData.name
        }, null, 2));
        
        const { error } = await globalThis.supabase
          .from('teams')
          .upsert(teamData, { onConflict: 'id' });
          
        if (error) {
          console.error('15. Error upserting team:', error);
        } else {
          console.log('16. Successfully upserted team:', teamData.name);
        }
        
      } catch (teamError) {
        console.error(`Error processing team ${team.idTeam}:`, teamError);
      }
    }
    
    console.log(`17. Successfully processed ${teamIds.length} teams`);
    return teamIds;
    
  } catch (error) {
    console.error('18. Error in fetchAndStoreMlbTeams:', error);
    throw error;
  }
}

// Fetches MLB venues and stores them in Supabase.
async function fetchAndStoreMlbVenues(): Promise<void> {
  try {
    // First, get team data to extract venue information
    const teamIds = await fetchAndStoreMlbTeams();
    console.log(`Found ${teamIds.length} teams to extract venue information`);
    
    // Get team data from Supabase
    const { data: teams, error } = await globalThis.supabase
      .from('teams')
      .select('team_id, name, stadium, stadium_location, stadium_capacity, stadium_thumbnail, stadium_description')
      .in('team_id', teamIds);
    
    if (error) {
      throw new Error(`Error fetching teams from Supabase: ${error.message}`);
    }
    
    if (!teams || teams.length === 0) {
      console.log('No teams found in the database to extract venue information');
      return;
    }
    
    console.log(`Processing venues for ${teams.length} teams`);
    
    // Process each team's venue
    for (const team of teams) {
      if (!team.stadium) continue;
      
      try {
        // Get or create venue mapping
        const venueId = await getOrCreateMapping(
          `venue_${team.team_id}`,
          team.stadium,
          'venue'
        );
        
        if (!venueId) {
          console.error(`Failed to create venue mapping for team ${team.team_id}`);
          continue;
        }
        
        // Create a venue object from team data
        const venueData = {
          id: venueId, // Use the ID from getOrCreateMapping
          name: team.stadium,
          location: team.stadium_location || '',
          capacity: team.stadium_capacity,
          description: team.stadium_description || '',
          image: team.stadium_thumbnail || '',
          team_id: team.team_id,
          team_name: team.name,
          api_last_updated: new Date().toISOString()
        };
        
        // Upsert venue data
        const { error: venueError } = await globalThis.supabase
          .from('venues')
          .upsert(venueData, { onConflict: 'id' });
          
        if (venueError) {
          console.error(`Error upserting venue ${venueId}:`, venueError);
          continue;
        }  
        console.log(`Stored venue: ${venueData.name}`);
        
      } catch (error) {
        console.error(`Error processing venue for team ${team.name}:`, error);
      }
    }
    
    console.log('MLB venues sync completed');
    
  } catch (error) {
    console.error('Error fetching or storing MLB venues:', error);
    throw error;
  }
}

// Helper function to get or create a mapping
async function getOrCreateMapping(
  externalId: string, 
  name: string,
  type: 'league' | 'team' | 'venue',
  parentId?: string
): Promise<string | null> {
  console.log(`1. getOrCreateMapping called with:`, { externalId, name, type, parentId });
  
  if (!externalId) {
    console.error('2. Error: No externalId provided');
    return null;
  }
  
  try {
    // Try to find existing mapping
    console.log(`3. Checking for existing ${type} mapping for externalId:`, externalId);
    const { data: existingMapping, error: lookupError } = await globalThis.supabase
      .from(`${type}_mappings`)
      .select('internal_id, name')
      .eq('external_id', externalId)
      .single();
      
    if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`4. Error looking up ${type} mapping:`, lookupError);
    }
    
    if (existingMapping) {
      console.log(`5. Found existing ${type} mapping:`, existingMapping);
      // If name is different, update it
      if (name && existingMapping.name !== name) {
        console.log(`6. Updating ${type} name from '${existingMapping.name}' to '${name}'`);
        const { error: updateError } = await globalThis.supabase
          .from(`${type}_mappings`)
          .update({ name })
          .eq('external_id', externalId);
          
        if (updateError) {
          console.error(`7. Error updating ${type} name:`, updateError);
        }
      }
      return existingMapping.internal_id;
    }

    // Prepare record data with type-specific fields
    const recordData: any = {
      id: crypto.randomUUID(),
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(type === 'league' && { 
        key: externalId, // Use externalId directly as the league key
        sport_type: 'baseball',
        is_active: true
      }),
      ...(type === 'team' && parentId && { league_id: parentId })
    };

    console.log(`8. Creating new ${type} record:`, JSON.stringify(recordData, null, 2));

    // Insert the new record
    const { data: newRecord, error: createError } = await globalThis.supabase
      .from(`${type}s`)
      .insert(recordData)
      .select('id')
      .single();

    if (createError) {
      console.error(`9. Error creating ${type} record:`, createError);
      return null;
    }
    
    const newId = newRecord?.id || recordData.id;
    console.log(`10. Created new ${type} with ID:`, newId);
    
    if (!newId) {
      console.error('11. Error: No ID returned after creating record');
      return null;
    }
    
    // Create the mapping
    console.log(`12. Creating ${type} mapping for external ID:`, externalId);
    const { error: mappingError } = await globalThis.supabase
      .from(`${type}_mappings`)
      .insert({
        external_id: externalId,
        internal_id: newId,
        name: name,
        created_at: new Date().toISOString()
      });
      
    if (mappingError) {
      console.error(`13. Error creating ${type} mapping:`, mappingError);
      return null;
    }
    
    console.log(`14. Successfully created ${type} and mapping`);
    return newId;
    
  } catch (error) {
    console.error(`15. Unexpected error in getOrCreateMapping for ${type}:`, error);
    return null;
  }
}

// Fetches MLB schedule for a given season and stores it in Supabase.
async function fetchAndStoreMlbSchedule(season: string): Promise<void> {
  const mlbLeagueId = await getOrCreateMapping(MLB_LEAGUE_ID, 'Major League Baseball', 'league');
  if (!mlbLeagueId) {
    console.error('Failed to get or create MLB league ID for schedule processing. Aborting schedule sync.');
    throw new Error('Failed to get or create MLB league ID for schedule processing.');
  }
  try {
    const API_KEY = getApiKey();
    const SCHEDULE_API_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${MLB_LEAGUE_ID}&s=${season}`;
    console.log(`Fetching MLB schedule for season ${season} from: ${SCHEDULE_API_URL}`);
    
    const response = await fetch(SCHEDULE_API_URL);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Raw MLB Schedule API Response for season ${season}:`, JSON.stringify(data, null, 2));
    const events = data.events || [];
    
    if (events.length === 0) {
      console.log(`No events found for season ${season}`);
      return;
    }
    
    console.log(`Fetched ${events.length} events for season ${season}`);
    
    // Process events in batches to avoid hitting Supabase limits
    const BATCH_SIZE = 10; // Reduced batch size to handle mappings
    
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(events.length / BATCH_SIZE)}`);
      
      // Process each event in the batch
      const gameDataPromises = batch.map(async (event: any) => {
        try {
          // Get or create league first
          const leagueId = await getOrCreateMapping(
            event.idLeague,
            event.strLeague || 'MLB',
            'league'
          );
          
          if (!leagueId) {
            console.error('Failed to get or create league');
            return null;
          }
          
          // Then get or create teams with the league ID
          const [homeTeamId, awayTeamId, venueId] = await Promise.all([
            getOrCreateMapping(
              event.idHomeTeam,
              event.strHomeTeam,
              'team',
              leagueId  // Pass league ID when creating teams
            ),
            getOrCreateMapping(
              event.idAwayTeam,
              event.strAwayTeam,
              'team',
              leagueId  // Pass league ID when creating teams
            ),
            event.idVenue ? getOrCreateMapping(
              event.idVenue,
              event.strVenue || 'Unknown Venue',
              'venue'
            ) : Promise.resolve(null)
          ]);
          
          return {
            external_id: event.idEvent,
            league_id: leagueId,
            season: parseInt(season) || null,
            season_type: 'regular',
            game_date: event.dateEvent ? new Date(event.dateEvent).toISOString() : null,
            game_time_utc: event.strTimestamp ? new Date(event.strTimestamp).toISOString() : null,
            game_time_local: event.dateEvent && event.strTime ? 
              new Date(`${event.dateEvent}T${event.strTime}`).toISOString() : null,
            status: event.strStatus || 'Scheduled',
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            venue_id: venueId,
            home_team_score: parseInteger(event.intHomeScore),
            away_team_score: parseInteger(event.intAwayScore),
            attendance: parseInteger(event.intSpectators) || null,
            home_team: event.strHomeTeam || null,
            away_team: event.strAwayTeam || null,
            league_name: event.strLeague || null,
            notes: event.strDescriptionEN || null,
            ...(event.strEventAlternate && { alternate_name: event.strEventAlternate }),
            api_last_updated: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error processing event:', error);
          return null;
        }
      });
      
      // Wait for all mappings and process the batch
      const gameData = (await Promise.all(gameDataPromises)).filter(Boolean);
      
      if (gameData.length === 0) {
        console.log('No valid game data to insert in this batch');
        continue;
      }
      
      // Insert the batch
      const { error } = await globalThis.supabase
        .from('games')
        .upsert(gameData, { onConflict: 'external_id' });
      
      if (error) {
        console.error(`Supabase error storing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        console.log('Skipping to next batch...');
      } else {
        console.log(`Successfully processed batch ${Math.floor(i / BATCH_SIZE) + 1} (${gameData.length} events)`);
      }
      
      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < events.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Completed processing ${events.length} events for season ${season}`);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in fetchAndStoreMlbSchedule for season ${season}:`, error);
    throw new Error(`MLB schedules sync failed: ${errorMessage}`);
  }
}

// Fetches all MLB players for all teams and stores them.
async function fetchAndStoreAllMlbPlayers(): Promise<void> {
  try {
    const API_KEY = getApiKey();
    console.log('Starting to fetch all MLB players...');
    
    // First, get all team IDs
    const teamIds = await fetchAndStoreMlbTeams();
    
    if (teamIds.length === 0) {
      console.log('No MLB teams found, cannot fetch players');
      return;
    }
    
    console.log(`Fetching players for ${teamIds.length} teams`);
    
    // Fetch players for each team
    for (const teamId of teamIds) {
      try {
        const PLAYERS_API_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookup_all_players.php?id=${teamId}`;
        console.log(`Fetching players for team ${teamId} from: ${PLAYERS_API_URL}`);
        
        const response = await fetch(PLAYERS_API_URL);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const playerDataFromApi = await response.json(); // Use 'response' from fetch
        console.log(`Raw MLB Players API Response for team ${teamId}:`, JSON.stringify(playerDataFromApi, null, 2)); // Use 'teamId' from loop
        const players = playerDataFromApi.player || []; // Use data from 'playerDataFromApi'
        
        if (players.length === 0) {
          console.log(`No players found for team ${teamId}`);
          continue;
        }
        
        console.log(`Fetched ${players.length} players for team ${teamId}`);
        
        // Store players in Supabase
        const { error } = await globalThis.supabase
          .from('players')
          .upsert(
            players.map((player: any) => ({
              player_id: player.idPlayer,
              team_id: teamId,
              name: player.strPlayer,
              position: player.strPosition,
              birth_date: player.dateBorn ? new Date(player.dateBorn).toISOString() : null,
              nationality: player.strNationality,
              height: player.strHeight,
              weight: player.strWeight,
              thumb: player.strThumb,
              cutout: player.strCutout,
              banner: player.strBanner,
              description: player.strDescriptionEN,
              gender: player.strGender,
              status: player.strStatus,
              api_last_updated: new Date().toISOString()
            })),
            { onConflict: 'player_id' }
          );
        
        if (error) {
          console.error(`Supabase error storing players for team ${teamId}:`, error);
        } else {
          console.log(`Successfully stored ${players.length} players for team ${teamId}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing team ${teamId}:`, error);
        // Continue with the next team even if one fails
      }
    }
    
    console.log('MLB players sync completed');
    
  } catch (error) {
    console.error('Error fetching or storing all MLB players:', error);
    throw error;
  }
}

// Helper to safely get environment variables in Deno
const getEnv = (key: string): string => {
  try {
    // @ts-ignore - Deno.env is available in Deno
    const value = Deno.env.get(key);
    if (!value) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  } catch (error) {
    console.error(`Error getting environment variable ${key}:`, error);
    throw new Error(`Failed to get environment variable: ${key}`);
  }
};

// Initialize the Supabase client
console.log('Initializing Supabase client...');
try {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_KEY');

  // Create and set the Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  setSupabaseClient(supabase);

  // Log the initialization
  console.log('Supabase client initialized with URL:', supabaseUrl);
  console.log('thesportsdb-data-sync Edge Function initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw error;
}

serve(async (req: Request) => {
  try {
    // Check for initial load flag in query params
    const url = new URL(req.url);
    const initialLoad = url.searchParams.get('initial') === 'true';
    const forceSync = url.searchParams.get('force') === 'true';
    
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfMonth = now.getUTCDate();
    const currentYear = now.getUTCFullYear().toString();

    console.log('1. Function execution started at:', now.toISOString());
    console.log('2. Execution mode:', { initialLoad, forceSync, dayOfWeek, dayOfMonth, currentYear });

    // Initialize results object
    const results = {
      daily: { status: 'skipped', message: '' },
      weekly: { status: 'skipped', message: '' },
      monthly: { status: 'skipped', message: '' },
    };

    // --- Daily Tasks (Teams & Players) ---
    if (dayOfMonth === 1 || initialLoad || forceSync) {
      try {
        console.log('3. Starting daily sync: Teams and Players');
        const teamIds = await fetchAndStoreMlbTeams();
        console.log(`4. Fetched ${teamIds?.length || 0} teams`);
        
        await fetchAndStoreAllMlbPlayers();
        console.log('5. Completed fetching all players');
        
        results.daily = { status: 'success', message: 'MLB teams and players sync completed.' };
      } catch (e: any) {
        results.daily = { status: 'error', message: `MLB teams and players sync failed: ${e.message}` };
        console.error('6. Error in daily sync:', e);
      }
    } else {
      results.daily.message = 'Skipped daily sync: Not the 1st of the month and not an initial load.';
      console.log('7. ' + results.daily.message);
    }

    // --- Weekly Tasks (Schedules) - Run on Mondays or during initial/force load ---
    if (dayOfWeek === 1 || initialLoad || forceSync) {
      try {
        console.log('8. Starting weekly sync: Schedules');
        await fetchAndStoreMlbSchedule(currentYear);
        results.weekly = { status: 'success', message: `MLB schedules sync for season ${currentYear} completed.` };
        console.log('9. ' + results.weekly.message);
      } catch (e: any) {
        results.weekly = { status: 'error', message: `MLB schedules sync failed: ${e.message}` };
        console.error('10. Error in weekly sync:', e);
      }
    } else {
      results.weekly.message = `Skipped weekly sync: Today (day ${dayOfWeek}) is not the scheduled day (Monday, day 1).`;
      console.log('11. ' + results.weekly.message);
    }
    
    // --- Monthly Tasks (Venues) - Run on the 1st of the month or during initial/force load ---
    if (dayOfMonth === 1 || initialLoad || forceSync) {
      try {
        console.log('12. Starting monthly sync: Venues');
        await fetchAndStoreMlbVenues();
        results.monthly = { status: 'success', message: 'MLB venues sync completed.' };
        console.log('13. ' + results.monthly.message);
      } catch (e: any) {
        results.monthly = { status: 'error', message: `MLB venues sync failed: ${e.message}` };
        console.error('14. Error in monthly sync:', e);
      }
    } else {
      results.monthly.message = `Skipped monthly sync: Today (day ${dayOfMonth}) is not the 1st of the month.`;
      console.log('15. ' + results.monthly.message);
    }
    
    console.log('16. All sync tasks processing finished.');
    
    return new Response(
      JSON.stringify({ message: 'Sync completed successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('14. Error in function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

console.log('thesportsdb-data-sync Edge Function is ready to serve requests.');

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/thesportsdb-data-sync' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

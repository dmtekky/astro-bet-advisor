// Use the global Supabase client that will be set by the Edge Function
// @ts-ignore - Global supabase client will be set by the Edge Function
const supabase = globalThis.supabase || {};

// Get API key from environment variables
const getApiKey = () => {
  // Helper to safely get env vars in both Deno and Node.js
  const getEnv = (key: string): string | undefined => {
    try {
      // @ts-ignore - Check for Deno environment
      if (typeof Deno !== 'undefined' && Deno.env) {
        // @ts-ignore - Deno.env is available
        return Deno.env.get(key);
      }
      // Fall back to process.env for Node.js
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
      }
      return undefined;
    } catch (e) {
      console.warn('Error accessing environment variables:', e);
      return undefined;
    }
  };

  // Try both environment variable names
  const apiKey = getEnv('VITE_SPORTSDB_API_KEY') || getEnv('THESPORTSDB_API_KEY');
  
  if (!apiKey) {
    throw new Error('THESPORTSDB_API_KEY or VITE_SPORTSDB_API_KEY is not set in environment variables.');
  }
  return apiKey;
};

const API_KEY = getApiKey();
export const MLB_LEAGUE_ID = '4424'; // TheSportsDB ID for Major League Baseball

// --- INTERFACES FOR TheSportsDB API RESPONSES AND DATABASE MODELS ---

// For Teams
interface SportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string | null;
  strAlternate: string | null; // Often used for full name if strTeam is an abbreviation
  intFormedYear: string | null;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strStadium: string | null;
  strKeywords: string | null;
  strStadiumThumb: string | null;
  strStadiumDescription: string | null;
  strStadiumLocation: string | null;
  intStadiumCapacity: string | null;
  strWebsite: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strInstagram: string | null;
  strDescriptionEN: string | null;
  strGender: string | null;
  strCountry: string | null;
  strTeamBadge: string | null; // Logo
  strTeamJersey: string | null;
  strTeamLogo: string | null;
  strTeamFanart1: string | null;
  strTeamFanart2: string | null;
  strTeamFanart3: string | null;
  strTeamFanart4: string | null;
  strTeamBanner: string | null;
  // ... any other fields you might need
}
interface SportsDbTeamsResponse {
  teams: SportsDbTeam[] | null;
}

// For Venues
interface SportsDbVenue {
  idVenue: string;
  strVenue: string;
  strVenueLocation: string; // e.g., "Los Angeles, USA"
  intVenueCapacity: string | null;
  strVenueAddress: string | null;
  strVenueMap: string | null; // URL to a map image or lat/long
  strVenueThumb: string | null;
  // ... any other fields
}
interface SportsDbVenuesResponse {
  venues: SportsDbVenue[] | null;
}

// For Players
interface SportsDbPlayer {
  idPlayer: string;
  idTeam: string;
  idTeam2: string | null; // For players with multiple teams or history
  idTeamNational: string | null;
  strNationality: string | null;
  strPlayer: string;
  strTeam: string; // Team name
  strTeam2: string | null;
  strSport: string;
  intSoccerXMLTeamID: string | null;
  dateBorn: string | null;
  strNumber: string | null; // Jersey number
  dateSigned: string | null;
  strSigning: string | null; // Transfer fee/details
  strWage: string | null;
  strOutfitter: string | null;
  strKit: string | null;
  strAgent: string | null;
  strBirthLocation: string | null;
  strDescriptionEN: string | null;
  strGender: string | null;
  strSide: string | null;
  strPosition: string | null;
  strCollege: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strInstagram: string | null;
  strYoutube: string | null;
  strHeight: string | null;
  strWeight: string | null;
  intLoved: string | null;
  strThumb: string | null; // Thumbnail photo
  strCutout: string | null; // Player cutout photo
  strRender: string | null; // Player render photo
  strBanner: string | null;
  strFanart1: string | null;
  strFanart2: string | null;
  strFanart3: string | null;
  strFanart4: string | null;
  strStatus: string | null; // e.g., "Active", "Retired"
  // ... any other fields
}
interface SportsDbPlayersResponse {
  player: SportsDbPlayer[] | null; // Note: API uses 'player' key, not 'players'
}

// For Events/Games/Schedules
export interface SportsDbEvent { // Exporting if used by other modules
  idEvent: string;
  strEvent: string; // Event name, usually 'TeamA vs TeamB'
  strEventAlternate: string | null;
  idLeague: string;
  strLeague: string;
  strSeason: string;
  strDescriptionEN: string | null;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  intSpectators: string | null;
  strOfficial: string | null; // Referee, Umpire, etc.
  strTimestamp: string | null; // Full ISO timestamp if available
  dateEvent: string; // Date in YYYY-MM-DD
  dateEventLocal: string | null;
  strTime: string; // Time, e.g., "20:00:00"
  strTimeLocal: string | null;
  strTVStation: string | null;
  idHomeTeam: string;
  idAwayTeam: string;
  idSoccerXML: string | null;
  strResult: string | null;
  idVenue: string | null;
  strVenue: string | null;
  strCountry: string | null;
  strCity: string | null;
  strPoster: string | null;
  strSquare: string | null;
  strFanart: string | null;
  strThumb: string | null;
  strBanner: string | null;
  strMap: string | null;
  strTweet1: string | null;
  strTweet2: string | null;
  strTweet3: string | null;
  strVideo: string | null; // Link to highlights, etc.
  strStatus: string | null; // e.g., "Match Finished", "Not Started", "Postponed"
  intRound: string | null;
  // ... any other fields
}
export interface SportsDbScheduleResponse { // Exporting if used by other modules
  events: SportsDbEvent[] | null;
}

// --- HELPER FUNCTIONS for data transformation ---
const parseInteger = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? null : num;
};

const parseDate = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  try {
    return new Date(String(value)).toISOString().split('T')[0]; // Format as YYYY-MM-DD
  } catch (e) {
    console.warn(`Could not parse date: ${value}`);
    return null;
  }
};

const combineDateTimeToISO = (dateStr: string | null | undefined, timeStr: string | null | undefined): string | null => {
  if (!dateStr || !timeStr) return null;
  try {
    // Try to construct a valid date string for parsing. Handle potential 'T' in dateStr or timeStr.
    let dateTimeString = `${String(dateStr).split('T')[0]}T${String(timeStr).split('T').pop()}`;
    if (!String(timeStr).includes('Z') && !String(timeStr).match(/[+-]\d{2}:\d{2}/)) {
      // If no timezone info, append 'Z' to assume UTC, common for TheSportsDB times like HH:MM:SS
      // This is a simplification; actual timezone of event might vary.
      dateTimeString += 'Z'; 
    }
    return new Date(dateTimeString).toISOString();
  } catch (e) {
    console.warn(`Could not parse date/time combination: Date='${dateStr}', Time='${timeStr}'`, e);
    return null;
  }
};

// --- SERVICE FUNCTIONS FOR FETCHING AND STORING DATA INTO SUPABASE ---

/**
 * Fetches MLB league information and stores it in Supabase.
 */
export const fetchAndStoreMlbLeagueInfo = async (): Promise<void> => {
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupleague.php?id=${MLB_LEAGUE_ID}`;
  console.log(`Fetching MLB league details from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    const data = await response.json() as { leagues: any[] | null }; // API specific response structure

    if (data.leagues && data.leagues.length > 0) {
      const league = data.leagues[0];
      const leagueData = {
        id: league.idLeague,
        name: league.strLeague,
        sport: league.strSport,
        alternate_name: league.strLeagueAlternate,
        api_source: 'thesportsdb',
        api_last_updated: new Date().toISOString(),
      };

      const { error } = await supabase.from('leagues').upsert(leagueData, { onConflict: 'id' });
      if (error) {
        console.error('Supabase error storing league info:', error);
        throw error;
      }
      console.log(`MLB league info (ID: ${league.idLeague}) stored/updated successfully.`);
    } else {
      console.log('No MLB league info found from API.');
    }
  } catch (error) {
    console.error('Error fetching or storing MLB league info:', error);
  }
};

/**
 * Fetches all MLB teams and stores them in Supabase.
 * @returns Array of fetched team IDs.
 */
export const fetchAndStoreMlbTeams = async (): Promise<string[]> => {
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookup_all_teams.php?id=${MLB_LEAGUE_ID}`;
  console.log(`Fetching MLB teams from: ${url}`);
  let teamIds: string[] = [];

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    const data: SportsDbTeamsResponse = await response.json();

    if (data.teams && data.teams.length > 0) {
      const teamsToStore = data.teams.map(team => ({
        id: team.idTeam,
        league_id: team.idLeague || MLB_LEAGUE_ID,
        name: team.strTeam,
        short_name: team.strTeamShort,
        stadium_name: team.strStadium,
        stadium_location: team.strStadiumLocation,
        stadium_capacity: parseInteger(team.intStadiumCapacity),
        stadium_thumbnail_url: team.strStadiumThumb,
        website: team.strWebsite,
        logo_url: team.strTeamBadge,
        jersey_url: team.strTeamJersey,
        api_source: 'thesportsdb',
        api_last_updated: new Date().toISOString(),
      }));

      const { error } = await supabase.from('teams').upsert(teamsToStore, { onConflict: 'id' });
      if (error) {
        console.error('Supabase error storing teams:', error);
        throw error;
      }
      console.log(`${teamsToStore.length} MLB teams stored/updated successfully.`);
      teamIds = teamsToStore.map(t => t.id);
    } else {
      console.log('No MLB teams found from API.');
    }
  } catch (error) {
    console.error('Error fetching or storing MLB teams:', error);
  }
  return teamIds;
};

/**
 * Fetches MLB venues and stores them in Supabase.
 */
export const fetchAndStoreMlbVenues = async (): Promise<void> => {
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/search_all_venues.php?l=Major%20League%20Baseball`;
  console.log(`Fetching MLB venues from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    const data: SportsDbVenuesResponse = await response.json();

    if (data.venues && data.venues.length > 0) {
      const venuesToStore = data.venues.map(venue => {
        let city = null;
        let country = null;
        if (venue.strVenueLocation) {
          const parts = venue.strVenueLocation.split(',').map(p => p.trim());
          city = parts[0] || null;
          country = parts[1] || null;
        }
        return {
          id: venue.idVenue,
          name: venue.strVenue,
          city: city,
          country: country,
          capacity: parseInteger(venue.intVenueCapacity),
          address: venue.strVenueAddress,
          map_url: venue.strVenueMap,
          thumbnail_url: venue.strVenueThumb,
          api_source: 'thesportsdb',
          api_last_updated: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('venues').upsert(venuesToStore, { onConflict: 'id' });
      if (error) {
        console.error('Supabase error storing venues:', error);
        throw error;
      }
      console.log(`${venuesToStore.length} MLB venues stored/updated successfully.`);
    } else {
      console.log('No MLB venues found from API.');
    }
  } catch (error) {
    console.error('Error fetching or storing MLB venues:', error);
  }
};

/**
 * Fetches players for a specific MLB team and stores them in Supabase.
 */
export const fetchAndStorePlayersForTeam = async (teamId: string): Promise<void> => {
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookup_all_players.php?id=${teamId}`;
  console.log(`Fetching players for team ID ${teamId} from: ${url}`);

  try {
    const response = await fetch(url);
    // The API might return a non-JSON error page for invalid team IDs or if the endpoint is hit too fast.
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed for team ${teamId}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0,500)}`);
        return; // Skip this team if there's an error
    }
    const data: SportsDbPlayersResponse = await response.json();

    if (data.player && data.player.length > 0) {
      const playersToStore = data.player.map(player => ({
        id: player.idPlayer,
        team_id: player.idTeam, // This should match the input teamId
        name: player.strPlayer,
        nationality: player.strNationality,
        date_of_birth: parseDate(player.dateBorn),
        position: player.strPosition,
        height: player.strHeight,
        weight: player.strWeight,
        thumbnail_url: player.strThumb,
        cutout_url: player.strCutout,
        status: player.strStatus,
        api_source: 'thesportsdb',
        api_last_updated: new Date().toISOString(),
      }));

      const { error } = await supabase.from('players').upsert(playersToStore, { onConflict: 'id' });
      if (error) {
        console.error(`Supabase error storing players for team ${teamId}:`, error);
        throw error;
      }
      console.log(`${playersToStore.length} players for team ID ${teamId} stored/updated successfully.`);
    } else {
      console.log(`No players found for team ID ${teamId} from API. Response:`, data);
    }
  } catch (error) {
    // Catch JSON parsing errors or other network issues
    console.error(`Error fetching or storing players for team ID ${teamId}:`, error);
  }
};

/**
 * Fetches all players for all MLB teams and stores them.
 */
export const fetchAndStoreAllMlbPlayers = async (): Promise<void> => {
  console.log('Starting to fetch all MLB players...');
  const teamIds = await fetchAndStoreMlbTeams(); 
  if (teamIds.length === 0) {
    console.log('No MLB teams found or fetched, cannot fetch players.');
    return;
  }

  console.log(`Fetching players for ${teamIds.length} MLB teams.`);
  for (const teamId of teamIds) {
    await fetchAndStorePlayersForTeam(teamId);
    // Add a delay to avoid hitting API rate limits if any
    await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay between team player fetches
  }
  console.log('Finished fetching all MLB players.');
};


/**
 * Fetches MLB schedule for a given season and stores it in Supabase.
 */
export const fetchAndStoreMlbSchedule = async (season: string): Promise<void> => {
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${MLB_LEAGUE_ID}&s=${season}`;
  console.log(`Fetching MLB schedule for season ${season} from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    const data: SportsDbScheduleResponse = await response.json();

    if (data.events && data.events.length > 0) {
      const gamesToStore = data.events.map(event => ({
        id: event.idEvent,
        league_id: event.idLeague,
        season: event.strSeason,
        round: event.intRound,
        home_team_id: event.idHomeTeam,
        away_team_id: event.idAwayTeam,
        home_score: parseInteger(event.intHomeScore),
        away_score: parseInteger(event.intAwayScore),
        event_timestamp: combineDateTimeToISO(event.dateEvent, event.strTime),
        venue_id: event.idVenue, // Ensure your 'games' table has 'venue_id' and it's compatible
        status: event.strStatus,
        tv_channels: event.strTVStation,
        thumbnail_url: event.strThumb,
        api_source: 'thesportsdb',
        api_last_updated: new Date().toISOString(),
      }));

      const { error } = await supabase.from('games').upsert(gamesToStore, { onConflict: 'id' });
      if (error) {
        console.error(`Supabase error storing games for season ${season}:`, error);
        throw error;
      }
      console.log(`${gamesToStore.length} MLB games for season ${season} stored/updated successfully.`);
    } else {
      console.log(`No MLB games found for season ${season} from API. Response:`, data);
    }
  } catch (error) {
    console.error(`Error fetching or storing MLB schedule for season ${season}:`, error);
  }
};

/**
 * Generic function to fetch schedule for any league and season from TheSportsDB.
 * This function primarily returns the data and does not store it directly.
 */
export const fetchLeagueScheduleFromSportsDB = async (
  leagueId: string, 
  season: string
): Promise<SportsDbScheduleResponse | null> => {
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${leagueId}&s=${season}`;
  console.log(`Fetching schedule from TheSportsDB v1: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching schedule from TheSportsDB: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody.substring(0, 500)); // Log only part of HTML error pages
      return null;
    }
    const data: SportsDbScheduleResponse = await response.json();
    if (!data.events) {
      console.log(`No events found for league ${leagueId}, season ${season}. API returned:`, data);
      return { events: [] }; 
    }
    return data;
  } catch (error) {
    console.error('Error fetching schedule from TheSportsDB:', error);
    return null;
  }
};


// --- Example of how you might call these functions (e.g., in a script or Supabase Edge Function) ---
/*
async function runDataPopulationTasks() {
  console.log('Starting data population tasks...');

  // 1. Ensure MLB league info is present (run once or infrequently)
  await fetchAndStoreMlbLeagueInfo();

  // 2. Venues (monthly task)
  console.log('\n--- Fetching Venues (Monthly Task) ---');
  await fetchAndStoreMlbVenues();

  // 3. Teams and Players (daily task)
  // fetchAndStoreMlbTeams() is called within fetchAndStoreAllMlbPlayers()
  console.log('\n--- Fetching Teams & Players (Daily Task) ---');
  await fetchAndStoreAllMlbPlayers();

  // 4. Schedules (weekly task)
  console.log('\n--- Fetching Schedules (Weekly Task) ---');
  const currentYear = new Date().getFullYear();
  await fetchAndStoreMlbSchedule(String(currentYear));
  // Optional: Fetch next year's schedule if available or needed
  // await fetchAndStoreMlbSchedule(String(currentYear + 1));

  console.log('\nData population tasks completed.');
}

// To run this manually for testing (ensure Supabase client is configured):
// runDataPopulationTasks().catch(console.error);
*/

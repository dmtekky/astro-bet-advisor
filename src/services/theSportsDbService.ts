// /Users/dmtekk/CascadeProjects/astro-bet-advisor/src/services/theSportsDbService.ts

// TODO: Move API_KEY to an environment variable for better security and configuration.
const API_KEY = '502451'; // TheSportsDB public test API key

// Interface for the expected event structure from TheSportsDB
export interface SportsDbEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strLeague: string;
  strSeason: string;
  // Add other relevant fields as needed
}

// Interface for the API response
export interface SportsDbScheduleResponse {
  events: SportsDbEvent[] | null; // API returns null if no events or an empty array
}

/**
 * Fetches the schedule for a specific league and season from TheSportsDB.
 * This function uses TheSportsDB's V2 endpoint: `/${API_KEY}/v2/json/schedule/league/${leagueId}/${season}`.
 * The `leagueId` parameter determines the specific sport and league (e.g., "4424" for MLB, "4328" for English Premier League soccer).
 * The `season` parameter specifies the season year (e.g., "2025" for MLB, "2024-2025" for EPL).
 * The API structure is consistent across different sports; only the `leagueId` and `season` need to be changed.
 * @param leagueId - The unique identifier for the league. This can be a numeric ID (e.g., "4328") or a string identifier (e.g., "4424-mlb").
 * @param season - The season year, which might be a single year (e.g., "2025") or a range (e.g., "2024-2025").
 * @returns A promise that resolves to the schedule data (events) or null if an error occurs or no data is found.
 */
export const fetchLeagueScheduleFromSportsDB = async (
  leagueId: string,
  season: string
): Promise<SportsDbScheduleResponse | null> => {
  const url = `https://www.thesportsdb.com/${API_KEY}/v2/json/schedule/league/${leagueId}/${season}`;

  console.log(`Fetching schedule from TheSportsDB: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error fetching schedule from TheSportsDB: ${response.status} ${response.statusText}`);
      try {
        const errorBody = await response.text();
        console.error(`Error body: ${errorBody}`);
      } catch (e) {
        console.error('Could not parse error body.');
      }
      return null;
    }

    const data: SportsDbScheduleResponse = await response.json();

    // TheSportsDB API might return {events: null} if no events are found for a valid league/season query.
    // Or it might return an empty array {events: []}.
    // If data.events is null or an empty array, it means no events were found, not necessarily an error.
    if (data.events === null) {
      console.log(`No events found for league ${leagueId}, season ${season}. API returned events: null.`);
    } else if (data.events.length === 0) {
      console.log(`No events found for league ${leagueId}, season ${season}. API returned an empty events array.`);
    }
    
    return data;

  } catch (error) {
    console.error('Failed to fetch or parse schedule from TheSportsDB:', error);
    return null;
  }
};

// Example usage (can be removed or kept for testing):
/*
(async () => {
  // Example: Fetch MLB schedule for 2025 season using the user-provided format
  const mlbSchedule = await fetchLeagueScheduleFromSportsDB('4424-mlb', '2025');
  if (mlbSchedule) {
    if (mlbSchedule.events && mlbSchedule.events.length > 0) {
      console.log('MLB 2025 Schedule (first 5):', mlbSchedule.events.slice(0, 5));
    } else {
      console.log('No MLB 2025 events found or events array is empty/null.');
    }
  } else {
    console.log('Could not fetch MLB 2025 schedule.');
  }

  // Example: Fetch English Premier League (leagueId 4328) for 2024-2025 season
  const eplSchedule = await fetchLeagueScheduleFromSportsDB('4328', '2024-2025');
  if (eplSchedule) {
    if (eplSchedule.events && eplSchedule.events.length > 0) {
      console.log('EPL 2024-2025 Schedule (first 5):', eplSchedule.events.slice(0, 5));
    } else {
      console.log('No EPL 2024-2025 events found or events array is empty/null.');
    }
  } else {
    console.log('Could not fetch EPL 2024-2025 schedule.');
  }
})();
*/

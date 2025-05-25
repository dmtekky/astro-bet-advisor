// /Users/dmtekk/Desktop/FMO1/astro-bet-advisor/src/api/thesportsdb.ts

// Using V1 API with test key as fallback (3 = test, limited to 100 calls/day)
const API_KEY = '3'; 
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json'
const MLB_LEAGUE_ID = '4424'; // MLB league ID

interface FetchOptions extends RequestInit {
  // Add any custom options if needed in the future
}

/**
 * Fetches data from TheSportsDB API.
 * @param endpoint The API endpoint path (e.g., 'all/leagues')
 * @param options Optional fetch options
 * @returns Promise<any> The JSON response from the API
 * @throws Error if the network response is not ok
 */
export async function fetchFromSportsDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  console.log(`[[[CASCADE DEBUG]]] ENTERING fetchFromSportsDB function - V2 path`);
  
  // TheSportsDB format is: https://www.thesportsdb.com/api/v2/json/{API_KEY}/{endpoint}
  const url = new URL(`${BASE_URL}/${API_KEY}/${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  console.log(`[[[CASCADE DEBUG]]] Fetching URL: ${url.toString()}`); // Log URL

  try {
    // No need for API key in header, it's in the URL path
    const response = await fetch(url.toString());
    console.log(`[[[CASCADE DEBUG]]] Raw response status: ${response.status}`); // Log status

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[[[CASCADE DEBUG]]] HTTP error! status: ${response.status}, response text: ${errorText}`); // Log error
      return null;
    }
    const data = await response.json();
    console.log(`[[[CASCADE DEBUG]]] Parsed data:`, data); // Log data
    return data as T;
  } catch (error) { // Corrected catch block
    console.error(`[[[CASCADE DEBUG]]] Failed to fetch from TheSportsDB API or parse JSON for endpoint "${endpoint}":`, error); // Enhanced log
    return null; // Return null on error
  }
}

// --- League Types (Example - adjust based on actual API response) ---
export interface League {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueAlternate?: string | null;
}

// Define types for events (adjust as per actual API response structure)
export interface Event {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  dateEvent: string;
  strTime: string;
  // Add other event properties you need
}

export interface EventsResponse {
  events: Event[] | null;
}

/**
 * Fetches the next N events for a specific league by its ID.
 * @param leagueId The ID of the league.
 * @param numberOfEvents The number of next events to fetch (default is '15' as per some API docs, but this endpoint might not support count).
 * @returns A promise that resolves to an array of Event objects or null if an error occurs.
 */
export async function getNextNLeagueEvents(): Promise<Event[] | null> {
  console.log('[[[CASCADE DEBUG]]] ENTERING getNextNLeagueEvents function');
  
  try {
    // Get the current port from the window location
    const port = typeof window !== 'undefined' ? window.location.port : '8081';
    const baseUrl = `${window.location.protocol}//${window.location.hostname}:${port}`;
    
    console.log(`[[[CASCADE DEBUG]]] Fetching MLB schedule from ${baseUrl}/api/mlb-schedule`);
    
    // Use our API route with the correct port
    const response = await fetch(`${baseUrl}/api/mlb-schedule`);
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
      }
      
      console.error(`Error fetching MLB schedule from proxy: ${response.status} ${errorMessage}`);
      return null;
    }
    
    const data = await response.json() as EventsResponse;
    return data?.events || [];
  } catch (error) {
    console.error('Error fetching MLB schedule from proxy:', error);
    
    // As a fallback, try using our direct implementation
    console.log('[[[CASCADE DEBUG]]] Falling back to direct API call via getMLBSchedule');
    
    try {
      const directData = await getMLBSchedule();
      return directData?.events || [];
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
}

/**
 * Get the MLB schedule for a specific date or all upcoming games
 * @param date Optional date string in YYYY-MM-DD format. If not provided, gets all upcoming games.
 * @returns Promise with MLB schedule data or null if error occurs
 */
export async function getMLBSchedule(date?: string): Promise<EventsResponse | null> {
  console.log(`[[[CASCADE DEBUG]]] Fetching MLB schedule${date ? ' for ' + date : ''}`);
  
  try {
    // Use different endpoint depending on whether date is provided
    if (date) {
      // Get events for specific date (v1 API endpoint)
      console.log(`[[[CASCADE DEBUG]]] Using eventsday.php endpoint with date ${date}`);
      return fetchFromSportsDB<EventsResponse>('eventsday.php', {
        'l': MLB_LEAGUE_ID,  // v1 API uses 'l' for league ID
        'd': date
      });
    } else {
      // Get next 15 events for MLB (v1 API endpoint)
      console.log(`[[[CASCADE DEBUG]]] Using eventsnext.php endpoint`);
      return fetchFromSportsDB<EventsResponse>('eventsnext.php', {
        'id': MLB_LEAGUE_ID,
        's': 'Baseball',  // Sport parameter required for v1 API
        'l': 'MLB'       // League name as string
      });
    }
  } catch (error) {
    console.error('[[[CASCADE DEBUG]]] Error in getMLBSchedule:', error);
    return null;
  }
}

/**
 * Get live scores for MLB games
 * @returns Promise with MLB live score data or null if error occurs
 */
export async function getMLBLiveScores(): Promise<EventsResponse | null> {
  console.log('Fetching MLB live scores');
  
  return fetchFromSportsDB<EventsResponse>(`${API_KEY}/livescore.php`, {
    'l': MLB_LEAGUE_ID
  });
}

// --- Example Usage (you can call this from a component or script to test) ---
/*
async function testGetNextNLeagueEvents() {
  console.log('Fetching next events for MLB...');
  const mlbLeagueId = '4424'; // MLB League ID
  const nextEvents = await getNextNLeagueEvents(mlbLeagueId);
  if (nextEvents) {
    console.log('Next events found:', nextEvents.length);
    nextEvents.forEach(event => console.log(`${event.strEvent} on ${event.dateEvent} at ${event.strTime}`));
async function testGetAllLeagues() {
  console.log('Fetching all leagues...');
  const leagues = await getAllLeagues();
  if (leagues) {
    console.log('Leagues found:', leagues.length);
    const mlbLeague = leagues.find(league => league.strLeague === 'MLB' || league.strLeagueAlternate?.includes('Major League Baseball'));
    if (mlbLeague) {
      console.log('MLB League Found:', mlbLeague);
    } else {
      console.log('MLB League not found in the list. Available sports/leagues:');
      leagues.slice(0, 20).forEach(l => console.log(`${l.strLeague} (${l.strSport}, ID: ${l.idLeague})`)); // Log first 20
    }
  } else {
    console.log('Could not fetch leagues.');
  }
}

// testGetAllLeagues(); // Uncomment to run when this file is executed directly (e.g., for testing with Node)
*/

// Add more functions here for fetching schedules, live scores, game details, etc.
// e.g., getMLBScheduleByDate, getLiveScoresForMLB, etc.

export default fetchFromSportsDB;

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database, type Json } from '@/integrations/supabase/types'; // Corrected Database import path

// Try Vite's import.meta.env first, then fall back to process.env for Node scripts
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL) || process.env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta.env?.VITE_SUPABASE_KEY) || process.env?.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set.');
  console.log('Attempted VITE_SUPABASE_URL (from import.meta.env):', import.meta.env?.VITE_SUPABASE_URL ? 'exists' : 'missing');
  console.log('Attempted VITE_SUPABASE_URL (from process.env):', process.env.VITE_SUPABASE_URL ? 'exists' : 'missing');
  console.log('Attempted VITE_SUPABASE_KEY (from import.meta.env):', import.meta.env?.VITE_SUPABASE_KEY ? 'exists' : 'missing');
  console.log('Attempted VITE_SUPABASE_KEY (from process.env):', process.env.VITE_SUPABASE_KEY ? 'exists' : 'missing');
  throw new Error('Missing required Supabase environment variables');
}

// Global variable to store the Supabase client instance
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Get or create a Supabase client instance
 * Uses singleton pattern to ensure only one instance exists
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // In the browser, we store the client in window.__supabase
  if (typeof window !== 'undefined') {
    // @ts-ignore - We're adding a property to window
    if (!window.__supabase) {
      // @ts-ignore
      window.__supabase = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      console.debug('Created new Supabase client instance');
    }
    // @ts-ignore
    return window.__supabase;
  }

  // On the server, we store the client in a module variable
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    console.debug('Created new server-side Supabase client instance');
  }

  return supabaseClient;
}

// Export the singleton instance
export const supabase = getSupabaseClient();

console.debug('Supabase initialized with URL:', supabaseUrl);

/**
 * Helper function to fetch data from Supabase with better error handling
 */
export const fetchFromSupabase = async <T>(
  resource: string, 
  query: any, 
  errorMessage: string = 'Failed to fetch data'
): Promise<T[]> => {
  try {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching ${resource}: Supabase error: ${error.message}`);
      console.error(`Custom error context for ${resource}: ${errorMessage}`);
      return [];
    }
    
    return data || [];
  } catch (err: any) {
    console.error(`Exception during fetch for ${resource}: ${err.message || err}`);
    console.error(`Custom error context for ${resource} (exception): ${errorMessage}`);
    return [];
  }
};

// NBA Types
import type { NbaTeam, NbaPlayer } from '@/types/nba.types';

// NBA fetchers

// Define the expected shape of the returned data for teams with chemistry
export interface TeamWithChemistry {
  id: string; // UUID from teams table
  city: string | null;
  name: string | null;
  abbreviation: string | null;
  team_chemistry: { // Normalized to be an object or null after fetching
    overall_score: number | null;
  } | null;
}

export async function fetchNbaTeamsWithChemistry(): Promise<TeamWithChemistry[]> {
  const nbaLeagueId = 'f51781ac-9e68-4e0c-a16c-d63e36b295c6'; // NBA League ID
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      city,
      name,
      abbreviation,
      team_chemistry (
        overall_score
      )
    `)
    .eq('league_id', nbaLeagueId);

  if (error) {
    console.error('Error fetching NBA teams with chemistry:', error);
    throw error;
  }
  // Supabase returns team_chemistry as an array. Since team_id is unique in team_chemistry,
  // this array will contain at most one item. Normalize it to a single object or null.
  return data ? data.map(team => ({
    ...team,
    team_chemistry: team.team_chemistry && team.team_chemistry.length > 0 ? team.team_chemistry[0] : null
  })) as TeamWithChemistry[] : [];
}

export async function fetchNbaTeams(): Promise<NbaTeam[]> {
  const { data, error } = await supabase.from('nba_teams').select('*');
  if (error) throw error;
  return data as NbaTeam[];
}

export async function fetchNbaPlayers(): Promise<NbaPlayer[]> {
  const { data, error } = await supabase.from('nba_players').select('*');
  if (error) throw error;
  return data as NbaPlayer[];
}

export async function fetchNbaPlayerById(id: string): Promise<NbaPlayer | null> {
  const { data, error } = await supabase
    .from('nba_players')
    .select('*')
    .eq('external_player_id', id)
    .single();
  if (error) throw error;
  return data as NbaPlayer | null;
}

// Export types for use in other files
export type { Database };

/**
 * Fetch upcoming games from the 'games' table, filtered by sport_key and commence_time in the future
 * @param sport_key_param - the sport_key to filter by (e.g., 'baseball_mlb', 'americanfootball_nfl')
 * @returns array of game rows matching the 'games' table schema
 */
export async function fetchUpcomingGamesBySport(sport_key_param: string): Promise<Database['public']['Tables']['games']['Row'][]> {
  const now = new Date().toISOString();
  // Use the exact Row type from the 'games' table for strong typing
  return fetchFromSupabase<Database['public']['Tables']['games']['Row']>(
    'games',
    supabase
      .from('games')
      .select('*') // Fetches all columns as defined in games.Row
      .eq('sport_key', sport_key_param)
      .gte('commence_time', now)
      .order('commence_time', { ascending: true }),
    'Failed to fetch upcoming games'
  );
}


// Astrological data interface (aligned with database.types.ts public.Tables.astrological_data.Row)
export interface AstrologicalData {
  created_at: string | null;
  date: string;
  id: string; // Corrected type from number to string
  moon_phase: string | null;
  moon_sign: string | null;
  planetary_signs: Json | null; // Contains individual signs like mercury_sign, venus_sign
  transits: Json | null;        // Contains transit info like sun_mars_transit
  updated_at: string | null;
  // Note: Consuming code will need to parse planetary_signs and transits Json objects
  // if it needs individual values previously defined directly on this interface.
}

// Fetch latest astrological data
export async function fetchLatestAstrologicalData(): Promise<AstrologicalData | null> {
  const { data, error } = await supabase
    .from('astrological_data')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single();
  if (error) {
    console.error('Error fetching astrological data:', error);
    return null;
  }
  return data as AstrologicalData;
}

// Define the type for a baseball player based on the database schema
type BaseballPlayer = {
  id: string;
  player_id: string;
  player_full_name: string | null;
  player_first_name: string | null;
  player_last_name: string | null;
  player_primary_position: string | null;
  player_official_image_src: string | null;
  player_birth_date: string | null;
  player_jersey_number: number | null;
  player_current_team_abbreviation: string | null;
  player_birth_city: string | null;
  player_birth_country: string | null;
  impact_score: number | null;
  astro_influence_score: number | null;
  [key: string]: any; // For any additional fields we might need
};

/**
 * Fetch a single player by their player_id from the baseball_players table.
 * @param playerId - The player_id to search for.
 * @returns BaseballPlayer object or null if not found or error.
 */
export async function getPlayerByApiId(playerId: string): Promise<BaseballPlayer | null> {
  const client = getSupabaseClient();

  // Use type assertion to tell TypeScript we know what we're doing with this table
  const { data: playerData, error: playerError } = await client
    .from('baseball_players' as any) // Type assertion to bypass type checking
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (playerError || !playerData) {
    console.error(`Error fetching player by player_id ${playerId}:`, playerError?.message);
    return null;
  }

  return playerData as BaseballPlayer;
}

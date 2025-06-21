import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database, type Json } from '@/integrations/supabase/types'; // Corrected Database import path

// Try Vite's import.meta.env first, then fall back to process.env for Node scripts
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL) || process.env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta.env?.VITE_SUPABASE_KEY) || process.env?.VITE_SUPABASE_KEY || '';
const supabaseServiceRoleKey = (import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) || process.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

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

/**
 * Get a Supabase client with service role privileges
 * This bypasses RLS policies and should be used carefully
 */
export function getServiceRoleClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase service role key. Cannot create service role client.');
    return null;
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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
    overall_score?: number | null; // Made optional
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
// Note: This is now generated by playerAstroService instead of being stored in the database
export interface AstrologicalData {
  date: string;
  moon_phase: string | null;
  moon_sign: string | null;
  planetary_signs: {
    mercury_sign?: string;
    venus_sign?: string;
    mars_sign?: string;
    jupiter_sign?: string;
    saturn_sign?: string;
    uranus_sign?: string;
    neptune_sign?: string;
    pluto_sign?: string;
  } | null;
  transits: {
    sun_moon_aspect?: string;
    sun_mars_aspect?: string;
    sun_jupiter_aspect?: string;
    sun_saturn_aspect?: string;
    moon_venus_aspect?: string;
    moon_mars_aspect?: string;
  } | null;
}

// Generate astrological data using playerAstroService
export async function fetchLatestAstrologicalData(): Promise<AstrologicalData | null> {
  try {
    // Use current date for the astrological data
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Generate the data using playerAstroService
    const astroData = await import('./playerAstroService').then(module => 
      module.generatePlayerAstroData(currentDate)
    );
    
    // Create a base result object with required fields
    const result: AstrologicalData = {
      date: currentDate,
      moon_phase: astroData.moonPhase?.name || null,
      moon_sign: astroData.moonSign || null,
      planetary_signs: {},
      transits: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Safely add planetary signs if they exist
    if (astroData.planets) {
      const planetarySigns: Record<string, string | undefined> = {};
      
      // Only add planets that exist in the astroData.planets object
      const planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
      planets.forEach(planet => {
        if (astroData.planets[planet]?.sign) {
          planetarySigns[`${planet}_sign`] = astroData.planets[planet]?.sign;
        }
      });
      
      result.planetary_signs = planetarySigns as any;
    }

    // Safely add aspects if they exist
    if (Array.isArray(astroData.aspects)) {
      const aspectMap: Record<string, string | undefined> = {};
      
      // Map aspect pairs to their expected keys
      const aspectPairs = [
        { pair: 'Sun-Moon', key: 'sun_moon_aspect' },
        { pair: 'Sun-Mars', key: 'sun_mars_aspect' },
        { pair: 'Sun-Jupiter', key: 'sun_jupiter_aspect' },
        { pair: 'Sun-Saturn', key: 'sun_saturn_aspect' },
        { pair: 'Moon-Venus', key: 'moon_venus_aspect' },
        { pair: 'Moon-Mars', key: 'moon_mars_aspect' },
      ];
      
      aspectPairs.forEach(({ pair, key }) => {
        const aspect = astroData.aspects.find((a: any) => a.pair === pair);
        if (aspect?.type) {
          aspectMap[key] = aspect.type;
        }
      });
      
      result.transits = aspectMap as any;
    }

    return result;
  } catch (error) {
    console.error('Error generating astrological data:', error);
    return null;
  }
}

// Define the type for a baseball player based on the database schema
export type BaseballPlayer = {
  id: number; // Assuming this is the primary key from the baseball_players table (typically number)
  player_id: string; // external player id from API
  player_full_name: string | null;
  player_first_name: string | null;
  player_last_name: string | null;
  player_primary_position: string | null;
  player_official_image_src: string | null;
  player_birth_date: string | null;
  player_jersey_number: string | null; // Changed to string | null
  player_current_team_abbreviation: string | null; // Already exists
  team_abbreviation?: string | null; // Added to match potential data structure from queries
  player_birth_city: string | null;
  player_birth_country: string | null;
  impact_score: number | null;
  astro_influence_score: number | null;
  league?: string; // Added to indicate player's league (e.g., 'NBA', 'MLB')
  // [key: string]: any; // Avoid overly broad types if possible, add specific fields as needed
};

/**
 * Fetch a single player by their ID from either baseball_players or nba_players table.
 * @param playerId - The player ID to search for.
 * @param sport - The sport ('mlb' or 'nba') to determine which tables to query.
 * @returns Player object or null if not found or error.
 */
export async function getPlayerByApiId(playerId: string, sport: 'mlb' | 'nba' = 'mlb'): Promise<BaseballPlayer | NbaPlayer | null> {
  const client = getSupabaseClient();
  console.log(`[getPlayerByApiId] Fetching ${sport} player with ID: ${playerId}`);
  
  if (sport === 'nba') {
    try {
      // First try to find by external_player_id in nba_players
      const { data: nbaPlayerData, error: nbaPlayerError } = await client
        .from('nba_players')
        .select('*')
        .eq('external_player_id', playerId)
        .maybeSingle();

      if (nbaPlayerError) {
        console.error(`Error fetching NBA player by external_player_id ${playerId}:`, nbaPlayerError.message);
      } else if (nbaPlayerData) {
        console.log(`[getPlayerByApiId] Found NBA player by external_player_id: ${nbaPlayerData.first_name} ${nbaPlayerData.last_name}`);
        
        // Fetch player stats from nba_player_season_stats_2025
        const msf_player_id = nbaPlayerData.external_player_id || nbaPlayerData.id.toString();
        const { data: statsData, error: statsError } = await client
          .from('nba_player_season_stats_2025')
          .select('*')
          .eq('msf_player_id', msf_player_id)
          .maybeSingle();
          
        if (statsError) {
          console.error(`Error fetching stats for player ${msf_player_id}:`, statsError.message);
        }
        
        // Calculate per-game stats if stats are available
        let impactScore = null;
        let astroInfluence = nbaPlayerData.astro_influence;
        
        if (statsData) {
          console.log('Found stats data for player:', statsData);
          impactScore = statsData.impact_score !== null && statsData.impact_score !== undefined
            ? (typeof statsData.impact_score === 'string' 
                ? parseFloat(statsData.impact_score) 
                : statsData.impact_score)
            : null;
            
          // Use astro_influence from stats if available, otherwise fall back to player data
          astroInfluence = statsData.astro_influence || nbaPlayerData.astro_influence;
        }
        
        // Map NBA player to BaseballPlayer format for compatibility
        return {
          id: nbaPlayerData.id,
          player_id: nbaPlayerData.external_player_id || nbaPlayerData.id.toString(),
          player_full_name: `${nbaPlayerData.first_name || ''} ${nbaPlayerData.last_name || ''}`.trim(),
          player_first_name: nbaPlayerData.first_name,
          player_last_name: nbaPlayerData.last_name,
          player_primary_position: nbaPlayerData.primary_position,
          player_official_image_src: nbaPlayerData.photo_url,
          player_birth_date: nbaPlayerData.birth_date,
          player_jersey_number: nbaPlayerData.jersey_number,
          player_current_team_abbreviation: nbaPlayerData.team_abbreviation,
          player_birth_city: nbaPlayerData.birth_city,
          player_birth_country: nbaPlayerData.birth_country,
          impact_score: impactScore,
          astro_influence_score: astroInfluence,
          astro_influence: astroInfluence // Add this for backward compatibility
        } as BaseballPlayer;
      }
      
      // If not found by external_player_id, try by id
      if (!nbaPlayerData) {
        const { data: nbaPlayerById, error: nbaIdError } = await client
          .from('nba_players')
          .select('*')
          .eq('id', playerId)
          .maybeSingle();
          
        if (nbaIdError) {
          console.error(`Error fetching NBA player by id ${playerId}:`, nbaIdError.message);
        } else if (nbaPlayerById) {
          console.log(`[getPlayerByApiId] Found NBA player by id: ${nbaPlayerById.first_name} ${nbaPlayerById.last_name}`);
          
          // Map NBA player to BaseballPlayer format for compatibility
          return {
            id: nbaPlayerById.id,
            player_id: nbaPlayerById.external_player_id || nbaPlayerById.id.toString(),
            player_full_name: `${nbaPlayerById.first_name || ''} ${nbaPlayerById.last_name || ''}`.trim(),
            player_first_name: nbaPlayerById.first_name,
            player_last_name: nbaPlayerById.last_name,
            player_primary_position: nbaPlayerById.primary_position,
            player_official_image_src: nbaPlayerById.photo_url,
            player_birth_date: nbaPlayerById.birth_date,
            player_jersey_number: nbaPlayerById.jersey_number,
            player_current_team_abbreviation: nbaPlayerById.team_abbreviation,
            player_birth_city: nbaPlayerById.birth_city,
            player_birth_country: nbaPlayerById.birth_country,
            impact_score: null,
            astro_influence_score: nbaPlayerById.astro_influence
          } as BaseballPlayer;
        }
      }
      
      // If still not found, try the nba_player_season_stats_2025 table
      // Convert playerId to a number if it's a string of digits
      const msf_player_id = /^\d+$/.test(playerId) ? parseInt(playerId) : playerId;
      console.log(`[getPlayerByApiId] Trying to find NBA player in stats table with msf_player_id: ${msf_player_id}`);
      
      const { data: statsData, error: statsError } = await client
        .from('nba_player_season_stats_2025')
        .select('*')
        .eq('msf_player_id', msf_player_id)
        .maybeSingle();
        
      if (statsError) {
        console.error(`Error fetching NBA player stats by msf_player_id ${msf_player_id}:`, statsError.message);
      } else if (statsData) {
        console.log(`[getPlayerByApiId] Found NBA player stats by msf_player_id: ${msf_player_id}, player_id: ${statsData.player_id}`);
        
        // Now fetch the player details using the player_id from stats
        const { data: playerData, error: playerError } = await client
          .from('nba_players')
          .select('*')
          .eq('id', statsData.player_id)
          .maybeSingle();
          
        if (playerError) {
          console.error(`Error fetching NBA player by id ${statsData.player_id}:`, playerError.message);
        } else if (playerData) {
          console.log(`[getPlayerByApiId] Found NBA player via stats: ${playerData.first_name} ${playerData.last_name}`);
          
          // Log the raw stats data for debugging
          console.log('Raw statsData:', statsData);
          console.log('Raw impact_score from stats:', statsData.impact_score, 'Type:', typeof statsData.impact_score);
          
          // Calculate per-game stats
          const gamesPlayed = statsData.games_played || 1; // Avoid division by zero
          const totalRebounds = (statsData.defensive_rebounds || 0) + (statsData.offensive_rebounds || 0);
          
          // Combine player data with stats data
          const combinedData = {
            ...playerData,
            stats_points_per_game: (statsData.points || 0) / gamesPlayed,
            stats_rebounds_per_game: totalRebounds / gamesPlayed,
            stats_assists_per_game: (statsData.assists || 0) / gamesPlayed,
            stats_steals_per_game: (statsData.steals || 0) / gamesPlayed,
            stats_blocks_per_game: (statsData.blocks || 0) / gamesPlayed,
            stats_field_goal_pct: statsData.field_goal_pct,
            stats_three_point_pct: statsData.three_point_pct,
            stats_free_throw_pct: statsData.free_throw_pct,
            stats_minutes_per_game: statsData.minutes_played / statsData.games_played,
            stats_games_played: statsData.games_played,
            stats_plus_minus: statsData.plus_minus,
            impact_score: statsData.impact_score ? 
              (typeof statsData.impact_score === 'string' ? 
                parseFloat(statsData.impact_score) : 
                statsData.impact_score) : 
              undefined,
            astro_influence: statsData.astro_influence || playerData.astro_influence
          };
          
          console.log('Combined data with impact_score:', combinedData.impact_score, 'Type:', typeof combinedData.impact_score);
          
          // Return the player data directly - PlayerDetailPage will handle the mapping
          return combinedData as NbaPlayer;
        }
      }
      
      console.warn(`[getPlayerByApiId] NBA player not found with ID: ${playerId}`);
      return null;
    } catch (err) {
      console.error(`[getPlayerByApiId] Unexpected error fetching NBA player ${playerId}:`, err);
      return null;
    }
  } else {
    // Original MLB player lookup logic
    try {
      // First check if this might actually be an NBA player despite the sport parameter
      if (/^\d+$/.test(playerId) && parseInt(playerId) > 10000) {
        console.log(`[getPlayerByApiId] Player ID ${playerId} looks like an NBA ID, trying NBA tables first...`);
        const nbaPlayer = await getPlayerByApiId(playerId, 'nba');
        if (nbaPlayer) {
          console.log(`[getPlayerByApiId] Successfully found player in NBA tables despite MLB sport parameter`);
          return nbaPlayer;
        }
      }
      
      // If not found in NBA tables or doesn't look like an NBA ID, try MLB tables
      const { data: playerData, error: playerError } = await client
        .from('baseball_players' as any)
        .select('*')
        .eq('player_id', playerId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

      if (playerError) {
        console.error(`Error fetching MLB player by player_id ${playerId}:`, playerError?.message);
        return null;
      }
      
      if (!playerData) {
        console.log(`[getPlayerByApiId] MLB player not found with ID: ${playerId}`);
        return null;
      }

      return playerData as BaseballPlayer;
    } catch (err) {
      console.error(`[getPlayerByApiId] Unexpected error fetching MLB player ${playerId}:`, err);
      return null;
    }
  }
}

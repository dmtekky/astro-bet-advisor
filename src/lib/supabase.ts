import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database, type Json } from '@/types/database.types.ts'; // Added Json import

// Try Vite's import.meta.env first, then fall back to process.env for Node scripts
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL) || (typeof Deno !== 'undefined' && Deno?.env?.get?.('VITE_SUPABASE_URL')) || process.env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta.env?.VITE_SUPABASE_KEY) || (typeof Deno !== 'undefined' && Deno?.env?.get?.('VITE_SUPABASE_KEY')) || process.env?.VITE_SUPABASE_KEY || '';

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


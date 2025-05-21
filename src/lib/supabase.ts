import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { toast } from '@/components/ui/use-toast';

// Import environment variables with Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'exists' : 'missing');
  console.log('VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY ? 'exists' : 'missing');
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
      console.error(`Error fetching ${resource}:`, error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error(`Exception fetching ${resource}:`, err);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    return [];
  }
};

// Export types for use in other files
export type { Database };

// Interface for a scheduled game
export interface ScheduledGame {
  id: number;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  start_time: string;
  venue?: string;
  [key: string]: any;
}

/**
 * Fetch upcoming games from the schedules table, filtered by sport and start_time in the future
 * @param sport - the sport to filter by (e.g., 'mlb', 'nba')
 * @returns array of ScheduledGame
 */
export async function fetchUpcomingGamesBySport(sport: string): Promise<ScheduledGame[]> {
  const now = new Date().toISOString();
  return fetchFromSupabase<ScheduledGame>(
    'schedules',
    supabase
      .from('schedules')
      .select('*')
      .eq('sport', sport)
      .gte('start_time', now)
      .order('start_time', { ascending: true }),
    'Failed to fetch upcoming games'
  );
}


// Astrological data interface
export interface AstrologicalData {
  id: number;
  date: string;
  moon_phase: string;
  moon_sign: string;
  mercury_sign: string;
  venus_sign: string;
  mars_sign: string;
  jupiter_sign: string;
  mercury_retrograde: boolean;
  sun_mars_transit: string;
  sun_saturn_transit: string;
  sun_jupiter_transit: string;
  next_event_time: string;
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


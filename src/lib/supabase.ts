
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

export { supabase };

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



import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Use the Supabase client from the integration
export const supabase = supabaseClient;

// Helper function to fetch data with error handling
export async function fetchFromSupabase<T>(
  tableName: string,
  query: any,
  errorMessage: string = 'Failed to fetch data'
): Promise<T[]> {
  try {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
    
    return data as T[];
  } catch (err) {
    console.error(`Exception while fetching from ${tableName}:`, err);
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
    return [];
  }
}

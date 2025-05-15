
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

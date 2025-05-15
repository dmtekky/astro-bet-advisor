
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

// Note: These are placeholders and should be replaced with your actual Supabase credentials
// after connecting to Supabase through the Lovable integration
const supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

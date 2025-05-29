// Basic types for Supabase client

export interface SupabaseClient {
  // Add the minimum required methods and properties
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
      insert: (data: any) => Promise<{ data: any; error: any }>;
      upsert: (data: any, options?: { onConflict?: string }) => Promise<{ data: any; error: any }>;
      delete: () => Promise<{ data: any; error: any }>;
      update: (data: any) => Promise<{ data: any; error: any }>;
    };
  };
  // Add other methods as needed
}

export type SupabaseClientOptions = {
  schema?: string;
  headers?: { [key: string]: string };
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
};

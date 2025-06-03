import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  // Extend the Supabase client to include the profiles table
  interface Window {
    __supabase: SupabaseClient & {
      from(table: 'profiles'): any;
    };
  }
}

// Extend the User type from @supabase/auth-js
declare module '@supabase/auth-js' {
  interface UserMetadata {
    name?: string;
    avatar_url?: string;
  }
  
  interface User {
    user_metadata: UserMetadata;
  }
}

// This ensures the file is treated as a module
export {};

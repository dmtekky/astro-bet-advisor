import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with your project URL and public anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY; // Using VITE_SUPABASE_KEY to match .env

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export the auth functions for convenience
export const { auth } = supabase;

// Export the client as default
export default supabase;

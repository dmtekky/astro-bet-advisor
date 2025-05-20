import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'exists' : 'missing');
  console.log('VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY ? 'exists' : 'missing');
  throw new Error('Missing required Supabase environment variables');
}

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
console.debug('Supabase client initialized successfully');
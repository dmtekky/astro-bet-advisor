// API endpoint to fetch team data from Supabase
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or Key is not defined in environment variables');
  // We'll still export the handler, but it will return an error
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Cache configuration
const CACHE_DURATION = 3600; // 1 hour in seconds
let cachedTeams = null;
let cacheTimestamp = 0;

// Main handler function for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache first
    const now = Math.floor(Date.now() / 1000);
    if (cachedTeams && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Serving teams from cache');
      return res.status(200).json(cachedTeams);
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('Fetching teams from Supabase...');
    
    // Fetch teams from the database
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      return res.status(500).json({ error: 'Failed to fetch teams', details: error.message });
    }

    // Update cache
    cachedTeams = teams;
    cacheTimestamp = now;

    console.log(`Fetched ${teams.length} teams from Supabase`);
    return res.status(200).json(teams);

  } catch (error) {
    console.error('Error in teams API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with actual credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
export const fetchPlayers = async (sport) => {
  console.log(`Fetching players for ${sport}`);
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('sport', sport);

    if (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return [];
  }
};

export const fetchAstroData = async (date) => {
  console.log(`Fetching astrological data for ${date}`);
  try {
    const { data, error } = await supabase
      .from('astrological_data')
      .select('*')
      .eq('date', date)
      .single();

    if (error) {
      console.error('Error fetching astrological data:', error);
      throw error;
    }
    
    return data || {};
  } catch (error) {
    console.error('Failed to fetch astrological data:', error);
    return {};
  }
};

export const fetchBettingOdds = async () => {
  console.log('Fetching betting odds');
  try {
    const { data, error } = await supabase
      .from('betting_odds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching betting odds:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch betting odds:', error);
    return [];
  }
};

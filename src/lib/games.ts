import { supabase } from './supabase';
import type { Sport } from '@/types/sports';

export const fetchGames = async (sport: Sport['key']) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('sport_key', sport);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

import { supabase } from '@/lib/supabase';

export interface Player {
  id: string;
  espn_id: string;
  name: string;
  birth_date: string | null;
  sport: string;
  team_id: string | null;
  position: string | null;
  jersey_number: number | null;
  height: string | null;
  weight: number | null;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchPlayersByTeam = async (team_id: string): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', team_id)
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const fetchPlayerById = async (id: string): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching player:', error);
    return null;
  }
};

export const searchPlayers = async (query: string): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching players:', error);
    return [];
  }
};

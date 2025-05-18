import { supabase } from '@/lib/supabase';
import type { Sport } from '@/types/sports';

export interface Team {
  id: string;
  espn_id: string;
  name: string;
  display_name: string | null;
  abbreviation: string | null;
  sport: string;
  league: string;
  logo_url: string | null;
  logo_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchTeamsBySport = async (sport: Sport['key']): Promise<Team[]> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('sport', sport)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const fetchTeamById = async (id: string): Promise<Team | null> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
};

export const searchTeams = async (query: string): Promise<Team[]> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
};

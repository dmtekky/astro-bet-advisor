import { supabase } from '@/lib/supabase';

export interface Schedule {
  id: number;
  espn_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  game_time: string;
  status: string | null;
  last_updated: string | null;
  created_at: string;
}

export const fetchSchedulesBySport = async (sport: string): Promise<Schedule[]> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('sport', sport)
      .order('game_time');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

export const fetchScheduleById = async (id: number): Promise<Schedule | null> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return null;
  }
};

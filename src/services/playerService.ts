import { supabase } from '@/lib/supabase';

export interface Player {
  id: string;
  espn_id: string;
  name: string;
  birth_date: string | null;
  sport: string;
  team_id: string | null;
  team?: string | null;  // Team name as a string (fallback)
  position: string | null;
  jersey_number: number | null;
  height: string | null;
  weight: number | null;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;  // Allow additional properties
}

export const fetchPlayersByTeam = async (team_id: string): Promise<Player[]> => {
  try {
    console.log(`[PLAYER FETCH] Fetching players for team ID: ${team_id}`);
    
    // First try to get the team's espn_id
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('espn_id, name, abbreviation')
      .eq('id', team_id)
      .single();

    if (teamError || !teamData) {
      console.error('[PLAYER FETCH] Error fetching team:', teamError?.message || 'Team not found');
      return [];
    }

    const espnId = teamData.espn_id;
    console.log(`[PLAYER FETCH] Found team: ${teamData.name} (${teamData.abbreviation}), espn_id: ${espnId}`);

    // Fetch players where espn_id matches the team's espn_id
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('espn_id', espnId);

    if (playersError) {
      console.error('[PLAYER FETCH] Error fetching players:', playersError.message);
      return [];
    }

    console.log(`[PLAYER FETCH] Found ${players?.length || 0} players for team espn_id: ${espnId}`);
    return players || [];
  } catch (error) {
    console.error('[PLAYER FETCH] Error in fetchPlayersByTeam:', error);
    return [];
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

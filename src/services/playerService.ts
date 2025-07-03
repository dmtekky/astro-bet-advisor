import { supabase } from '@/lib/supabase';

export interface Player {
  id: string;
  external_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  birth_city: string | null;
  birth_country: string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  primary_position: string | null;
  primary_number: number | null;
  headshot_url: string | null;
  current_team_id: string | null;
  idteam: string | null;
  strteam: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team?: {
    id: string;
    name: string;
    logo_url: string | null;
    abbreviation: string | null;
  };
  [key: string]: any;  // Allow additional properties
}

export const fetchPlayersByTeam = async (team_id: string): Promise<Player[]> => {
  try {
    console.log(`[PLAYER FETCH] Fetching players for team ID: ${team_id}`);
    
    // First get the team's external_id
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('external_id, name, abbreviation')
      .eq('id', team_id)
      .single();

    if (teamError || !teamData) {
      console.error('[PLAYER FETCH] Error fetching team:', teamError?.message || 'Team not found');
      return [];
    }

    const externalId = teamData.external_id;
    console.log(`[PLAYER FETCH] Found team: ${teamData.name} (${teamData.abbreviation}), external_id: ${externalId}`);

    // Try multiple approaches to find players for this team
    const players = [];
    const playersError = null;
    
    // 1. Try idteam as string
    const { data: playersByIdTeamString, error: idTeamStringError } = await supabase
      .from('players')
      .select('*')
      .eq('idteam', String(externalId));
      
    console.log(`[PLAYER FETCH] Found ${playersByIdTeamString?.length || 0} players with idteam as string`);
    
    if (playersByIdTeamString && playersByIdTeamString.length > 0) {
      return playersByIdTeamString;
    }
    
    // 2. Try idteam as number
    const { data: playersByIdTeamNumber, error: idTeamNumberError } = await supabase
      .from('players')
      .select('*')
      .eq('idteam', Number(externalId));
      
    console.log(`[PLAYER FETCH] Found ${playersByIdTeamNumber?.length || 0} players with idteam as number`);
    
    if (playersByIdTeamNumber && playersByIdTeamNumber.length > 0) {
      return playersByIdTeamNumber;
    }
    
    // 3. Try current_team_id
    const { data: playersByTeamId, error: teamIdError } = await supabase
      .from('players')
      .select('*')
      .eq('current_team_id', team_id);
      
    console.log(`[PLAYER FETCH] Found ${playersByTeamId?.length || 0} players with current_team_id`);
    
    if (playersByTeamId && playersByTeamId.length > 0) {
      return playersByTeamId;
    }
    
    // If we get here, we couldn't find any players
    console.error('[PLAYER FETCH] No players found for this team using any method');
    return [];
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

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
    
    // First try with team_id
    let { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', team_id)  // Changed to use team_id column
      .order('name');
      
    if (error) {
      console.error('[PLAYER FETCH] Error fetching players by team_id:', error);
      throw error;
    }
    
    // If no players found, try alternative approaches
    if (!data || data.length === 0) {
      console.log(`[PLAYER FETCH] No players found for team_id ${team_id}, trying alternative methods...`);
      
      // Try to get team espn_id first
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, abbreviation, espn_id')
        .eq('id', team_id)
        .single();
        
      if (!teamError && teamData) {
        console.log(`[PLAYER FETCH] Found team: ${teamData.name} (${teamData.abbreviation}), espn_id: ${teamData.espn_id}`);
        
        // Try with espn_id if available
        if (teamData.espn_id) {
          console.log(`[PLAYER FETCH] Trying to fetch players using espn_id: ${teamData.espn_id}`);
          const { data: playersByEspnId, error: espnError } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamData.espn_id)  // Changed to use espn_id
            .order('name');
            
          if (!espnError && playersByEspnId && playersByEspnId.length > 0) {
            console.log(`[PLAYER FETCH] Found ${playersByEspnId.length} players using espn_id`);
            return playersByEspnId;
          }
        }
        
        // Try with team name as fallback (in case team_id is actually the name)
        console.log(`[PLAYER FETCH] Trying to fetch players using team name: ${teamData.name}`);
        const { data: playersByName, error: nameError } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', teamData.name)  // Try matching team_id with team name
          .order('name');
          
        if (!nameError && playersByName && playersByName.length > 0) {
          console.log(`[PLAYER FETCH] Found ${playersByName.length} players by team name`);
          return playersByName;
        }
      }
      
      // If still no players, try a more general search
      console.log('[PLAYER FETCH] Trying general player search...');
      const { data: allPlayers, error: allError } = await supabase
        .from('players')
        .select('*')
        .limit(100);
        
      if (!allError && allPlayers) {
        console.log(`[PLAYER FETCH] Fetched ${allPlayers.length} players for inspection`);
        // Log sample of player data for debugging
        if (allPlayers.length > 0) {
          console.log('[PLAYER FETCH] Sample player data:', allPlayers.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            team_id: p.team_id,
            position: p.position
          })));
        }
      }
      
      // Return empty array if no players found
      return [];
    }
    
    console.log(`[PLAYER FETCH] Found ${data.length} players for team_id ${team_id}`);
    return data || [];
  } catch (error) {
    console.error('[PLAYER FETCH] Error in fetchPlayersByTeam:', error);
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

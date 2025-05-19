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
  // New fields for team stats
  wins?: number;
  losses?: number;
  win_pct?: number;
  // Additional fields that might be in the database
  logo?: string;
  external_id?: string;
}

// Helper function to map database team to Team interface
const mapTeamData = (team: any): Team => {
  return {
    id: team.id,
    espn_id: team.external_id || '',
    name: team.name || '',
    display_name: team.name || null,
    abbreviation: team.abbreviation || null,
    sport: team.sport || '',
    league: team.sport || '',
    logo_url: team.logo || null,
    logo_path: null,
    primary_color: null,
    secondary_color: null,
    created_at: team.created_at || new Date().toISOString(),
    updated_at: team.updated_at || new Date().toISOString(),
    wins: team.wins || 0,
    losses: team.losses || 0,
    win_pct: team.win_pct || 0,
    logo: team.logo || null,
    external_id: team.external_id || ''
  };
};

export const fetchTeamsBySport = async (sport: Sport['key']): Promise<Team[]> => {
  try {
    // Convert sport to uppercase for consistency with database
    const sportUpper = sport.toUpperCase();
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('sport', sportUpper)
      .order('name');

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
    
    // Map the data to ensure all required fields are present
    return (data || []).map(mapTeamData);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
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

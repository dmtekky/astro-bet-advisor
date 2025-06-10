export interface NbaTeam {
  id: number; // Reverted to number as per DB schema
  external_team_id: string;
  external_id?: number; // For backward compatibility
  abbreviation: string | null;
  city: string | null;
  name: string | null;
  conference: string | null;
  division: string | null;
  logo_url?: string | null;
  home_venue_id?: number | null;
  home_venue_name?: string | null;
  team_colours_hex?: string | null;
  twitter?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NbaPlayer {
  id: number; // Reverted to number as per DB schema
  external_player_id: string;
  first_name: string | null;
  last_name: string | null;
  team_id: string | null;
  primary_position: string | null;
  jersey_number: string | null;
  birth_date: string | null;
  birth_city: string | null;
  birth_country: string | null;
  height: string | null;
  weight: string | null;
  college: string | null;
  rookie: boolean | null;
  active: boolean | null;
  team_abbreviation?: string | null; // Added for consistency
  league?: string; // Added to indicate player's league (e.g., 'NBA')
}

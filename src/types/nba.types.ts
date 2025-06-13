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

import { Player as BasePlayer } from './app.types';

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

/**
 * Extends the base Player type with NBA-specific fields
 */
export interface Player extends BasePlayer {

  
  // NBA Stats
  stats_points_per_game?: number | null;
  stats_rebounds_per_game?: number | null;
  stats_assists_per_game?: number | null;
  stats_steals_per_game?: number | null;
  stats_blocks_per_game?: number | null;
  stats_field_goal_pct?: number | string | null;
  stats_three_point_pct?: number | string | null;
  stats_free_throw_pct?: number | string | null;
  stats_minutes_per_game?: number | string | null;
  stats_games_played?: number | null;
  stats_plus_minus?: number | string | null;
  
  // Additional NBA specific fields
  stats_offensive_rebounds_per_game?: number | null;
  stats_defensive_rebounds_per_game?: number | null;
  stats_turnovers_per_game?: number | null;
  stats_minutes_played?: number | null;
  stats_double_doubles?: number | null;
  stats_triple_doubles?: number | null;
  
  // For type safety
  [key: string]: any;
}

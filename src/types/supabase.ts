// Game type definition for Supabase schedules table
export interface Game {
  id: string;
  external_id?: string;
  sport: string;
  sport_key?: string;
  home_team: string;
  away_team: string;
  home_team_id?: string;
  away_team_id?: string;
  commence_time: string;
  start_time?: string;
  venue?: string;
  bookmakers?: any;
  odds?: any;
  status?: string;
  score_home?: number;
  score_away?: number;
  home_team_abbreviation?: string;
  away_team_abbreviation?: string;
  created_at?: string;
  updated_at?: string;
  game_date?: string;
}

// Team type definition for Supabase teams table
export interface Team {
  id: string;
  name: string;
  abbreviation?: string;
  logo?: string;
  wins?: number;
  losses?: number;
  external_id?: string;
  sport?: string;
  created_at?: string;
  updated_at?: string;
}

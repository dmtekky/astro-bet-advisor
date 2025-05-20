export type Sport = 
  // Frontend display names
  'nba' | 'mlb' | 'nfl' | 'nhl' | 'soccer' | 'tennis' | 'mma' | 'ncaa' | 'ncaab' | 'ncaaf' | 'golf' | 'esports' | 'cfl' | 'boxing' |
  // API sport keys
  'basketball_nba' | 'baseball_mlb' | 'americanfootball_nfl' | 'icehockey_nhl' | 'soccer_epl' | 'soccer_fifa_world_cup';

export interface Player {
  id: string;
  name: string;
  team?: string;
  position?: string;
  birthDate?: string; // For astrological calculations
  image?: string;
  sport: Sport;
  team_id?: string;
  win_shares?: number;
  stats?: Record<string, any>;
  birth_date?: string;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  logo_url?: string;
  city?: string;
  record?: string;
  wins?: number;
  losses?: number;
  primary_color?: string;
  secondary_color?: string;
  sport: Sport;
  external_id?: string;
}

export interface BettingOdds {
  id: string;
  player_id?: string;
  team_id?: string;
  game_id?: string;
  odds: number;
  type: string; // e.g., "moneyline", "spread", "over/under"
  bookmaker: string;
  line?: number;
  timestamp: number;
}

export interface AstrologicalData {
  id: string;
  player_id: string;
  favorability: number; // 0-100 score
  influences: string[];
  details?: string;
  timestamp: number;
}

export interface Game {
  id: string;
  sport: Sport;
  home_team_id: string;
  away_team_id: string;
  start_time: string;
  status: string;
  score_home?: number;
  score_away?: number;
  external_id?: string;
  league?: string;
  league_id?: string;
  odds?: number | string | null;
  oas?: number | string | null;
}

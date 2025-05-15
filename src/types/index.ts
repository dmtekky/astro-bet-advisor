
export type Sport = 'nba' | 'mlb' | 'nfl' | 'boxing' | 'soccer' | 'ncaa';

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
}

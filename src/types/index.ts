
export type Sport = 'nba' | 'mlb' | 'nfl' | 'boxing' | 'soccer' | 'ncaa';

export interface Player {
  id: string;
  name: string;
  team?: string;
  position?: string;
  birthDate?: string; // For astrological calculations
  image?: string;
  sport: Sport;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  sport: Sport;
}

export interface BettingOdds {
  id: string;
  playerId?: string;
  teamId?: string;
  odds: number;
  type: string; // e.g., "moneyline", "spread", "over/under"
  bookmaker: string;
  timestamp: number;
}

export interface AstrologicalData {
  playerId: string;
  favorability: number; // 0-100 score
  influences: string[];
  details?: string;
  timestamp: number;
}

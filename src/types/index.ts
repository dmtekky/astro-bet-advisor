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

export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  surface?: string;
  image_url?: string;
}

export interface League {
  id: string;
  name: string;
  abbreviation?: string;
  sport: Sport;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  market_key: string;
  market_name?: string;
  last_update?: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  bookmaker_key: string;
  bookmaker_name: string;
  last_update: string;
  markets: Market[];
  // Additional properties for compatibility with different API formats
  key?: string;
  title?: string;
}

export interface Game {
  id: string;
  sport: Sport;
  home_team_id: string;
  away_team_id: string;
  start_time: string;
  commence_time?: string;
  status: string;
  score_home?: number;
  score_away?: number;
  external_id?: string;
  league?: string;
  league_id?: string;
  venue_id?: string;
  odds?: number | string | null;
  oas?: number | string | null;
  completed?: boolean;
  astroPrediction?: string;
  confidence?: number;
  moonPhase?: string;
  sunSign?: string;
  dominantElement?: string;
  astroInfluence?: string;
  homeEdge?: number;
}

export interface PlayerSeasonStats {
  id: string; // Assuming the primary key in player_season_stats table is 'id'
  player_id: string;
  team_id?: string; // The team for which these stats were recorded
  season: number;
  games_played?: number | null;
  at_bats?: number | null;
  runs?: number | null;
  hits?: number | null;
  doubles?: number | null;
  triples?: number | null;
  home_runs?: number | null;
  runs_batted_in?: number | null;
  batting_average?: number | null;
  slugging_percentage?: number | null;
  on_base_percentage?: number | null;
  on_base_plus_slugging?: number | null;
  stolen_bases?: number | null;
  walks?: number | null;
  strikeouts?: number | null;
  // Pitching Stats
  wins?: number | null;
  losses?: number | null;
  earned_run_average?: number | null;
  saves?: number | null;
  innings_pitched?: number | null; // Consider if this is decimal or IP with .1, .2 for outs
  pitching_strikeouts?: number | null;
  walks_hits_per_inning_pitched?: number | null;
  // Metadata from SportsData.io, if stored
  external_player_id?: number | null;
  external_team_id?: number | null;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Explicitly re-export types from astrology.ts
export type {
  ZodiacSign,
  Element,
  Modality,
  AspectType,
  PlanetName,
  CelestialBody,
  Dignity,
  HouseSystem,
  Aspect,
  AspectPattern,
  ElementalBalance,
  ModalBalance,
  AstroData,
  AstroDataResponse,
  MoonPhaseInfo
} from './astrology';

export interface GameOutcomePrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  prediction: string;
  dominantElement: string;
  moonPhase: string;
  sunSign: string;
  tags: string[];
  confidence: number;
  reasoning?: string;
  predicted_winner?: string | null;
}

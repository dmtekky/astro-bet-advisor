import { Database, Json } from './database.types';

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

export type DbGame = Database['public']['Tables']['games']['Row'];

export interface Game {
  // Core fields from database (DbGame)
  id: string; // PK, uuid
  external_id: DbGame['external_id'];
  league_id: DbGame['league_id'];
  home_team_id: DbGame['home_team_id'];
  away_team_id: DbGame['away_team_id'];
  venue_id: DbGame['venue_id'];
  game_date: DbGame['game_date'];
  game_time_utc: DbGame['game_time_utc'];
  status: DbGame['status'];
  home_score: DbGame['home_score'];
  away_score: DbGame['away_score'];
  home_odds: DbGame['home_odds']; // number | null
  away_odds: DbGame['away_odds']; // number | null
  spread: DbGame['spread']; // number | null
  over_under: DbGame['over_under']; // number | null
  // the_sports_db_id field removed as it doesn't exist in the database schema
  // sport_type field removed as it doesn't exist in the database schema
  // We'll derive the sport from the league_id instead
  created_at: DbGame['created_at'];
  updated_at: DbGame['updated_at'];

  // Application-specific/derived fields
  sport: Sport; // Mapped from sport_type, e.g., "mlb"
  start_time: string; // Derived from game_date & game_time_utc for display
  league_name?: string; // Fetched from leagues table
  home_team_name?: string; // Fetched from teams table
  away_team_name?: string; // Fetched from teams table
  
  // Backward compatibility for components expecting odds as an array
  odds?: Array<{
    market?: string;
    outcome?: string;
    price?: number;
  }>;
  
  // Fields for astro predictions and UI, matching GameCard.tsx's expectations for the `game` prop
  prediction?: GameOutcomePrediction; // Used in GameCard
  astroPrediction?: string | GameOutcomePrediction; // Can be string or object
  confidence?: number;
  moonPhase?: string | { name: string; illumination: number };
  sunSign?: string;
  dominantElement?: string;
  astroInfluence?: string;
  homeEdge?: number; // Also known as astroEdge in some contexts
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

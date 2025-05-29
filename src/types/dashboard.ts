import { Database } from './database.types';

export type DbTeam = Database['public']['Tables']['teams']['Row'];

export type SportKey = 
  | 'basketball_nba' 
  | 'basketball_wnba' 
  | 'basketball_ncaab' 
  | 'basketball_ncaam' 
  | 'baseball_mlb' 
  | 'football_nfl' 
  | 'football_ncaaf' 
  | 'hockey_nhl';

export interface Team extends DbTeam {
  id: string;
  name: string;
  logo_url?: string;
  logo?: string;
  city?: string;
  abbreviation?: string;
  record?: string;
  wins?: number;
  losses?: number;
  primary_color?: string;
  secondary_color?: string;
  sport?: string;
}

export type DbGame = Database['public']['Tables']['games']['Row'];

export interface Game {
  // Core fields from DbGame, essential for fetching/displaying game card data
  id: DbGame['id'];
  home_team_id: DbGame['home_team_id']; // Needed to fetch the homeTeam object
  away_team_id: DbGame['away_team_id']; // Needed to fetch the awayTeam object
  league_id: DbGame['league_id']; // For context like league name
  venue_id: DbGame['venue_id']; // For venue name

  game_date: DbGame['game_date']; // Will be combined with game_time_utc for display
  game_time_utc: DbGame['game_time_utc']; // Will be combined with game_date for display
  status: DbGame['status'];
  home_score: DbGame['home_score'];
  away_score: DbGame['away_score'];
  home_odds: DbGame['home_odds']; // number | null
  away_odds: DbGame['away_odds']; // number | null
  spread: DbGame['spread']; // number | null
  over_under: DbGame['over_under']; // number | null
  // Note: Some components expect an 'odds' array with market, outcome, price properties
  // sport_type field removed as it doesn't exist in the database schema
  // We'll derive the sport from the league_id instead
  external_id: DbGame['external_id'];
  // the_sports_db_id field removed as it doesn't exist in the database schema
  created_at: DbGame['created_at'];
  updated_at: DbGame['updated_at'];

  // Fields expected by games/GameCard.tsx for its 'game' prop, if not directly on DbGame
  // These were on the GameCardProps in games/GameCard.tsx
  astroInfluence?: string;
  astroEdge?: number;
  venue?: string;
}

export interface GameWithTeams extends Game {
  home_team_data: Team;
  away_team_data: Team;
}

export type GamesByDate = Record<string, GameWithTeams[]>;

export const DEFAULT_LOGOS: Record<SportKey, string> = {
  basketball_nba: 'https://cdn.nba.com/logos/leagues/logo-nba.svg',
  basketball_wnba: 'https://cdn.wnba.com/static/img/svg/wnba-logo-primary.svg',
  basketball_ncaab: 'https://www.ncaa.com/favicon.ico',
  basketball_ncaam: 'https://www.ncaa.com/favicon.ico',
  baseball_mlb: 'https://www.mlbstatic.com/team-logos/league-on-dark/1.svg',
  football_nfl: 'https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NFL',
  football_ncaaf: 'https://www.ncaa.com/favicon.ico',
  hockey_nhl: 'https://www-league.nhlstatic.com/images/logos/league-dark/133-flat.svg',
};

export interface SportOption {
  value: SportKey;
  label: string;
  icon: string;
}

export const SPORT_OPTIONS: SportOption[] = [
  {
    value: 'basketball_nba',
    label: 'NBA',
    icon: '🏀',
  },
  {
    value: 'basketball_wnba',
    label: 'WNBA',
    icon: '🏀',
  },
  {
    value: 'basketball_ncaab',
    label: 'NCAAB',
    icon: '🏀',
  },
  {
    value: 'basketball_ncaam',
    label: 'NCAAM',
    icon: '🏀',
  },
  {
    value: 'baseball_mlb',
    label: 'MLB',
    icon: '⚾',
  },
  {
    value: 'football_nfl',
    label: 'NFL',
    icon: '🏈',
  },
  {
    value: 'football_ncaaf',
    label: 'NCAAF',
    icon: '🏈',
  },
  {
    value: 'hockey_nhl',
    label: 'NHL',
    icon: '🏒',
  },
];

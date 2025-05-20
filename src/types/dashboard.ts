import { Team as TeamType } from './database.types';

export type SportKey = 
  | 'basketball_nba' 
  | 'basketball_wnba' 
  | 'basketball_ncaab' 
  | 'basketball_ncaam' 
  | 'baseball_mlb' 
  | 'football_nfl' 
  | 'football_ncaaf' 
  | 'hockey_nhl';

export interface Team extends TeamType {
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

export interface Game {
  id: string | number;
  home_team_id: string;
  away_team_id: string;
  home_team: string;
  away_team: string;
  commence_time?: string;
  start_time?: string;
  game_time: string;
  status?: string;
  odds?: any[];
  sport?: string;
  league?: string;
  home_score?: number;
  away_score?: number;
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

export interface Sport {
  id: string;
  name: string;
  key: string;
  label: string;
  disabled?: boolean;
}

export const SPORTS: Sport[] = [
  { id: '1', name: 'NBA', key: 'basketball_nba', label: 'NBA' },
  { id: '2', name: 'NFL', key: 'americanfootball_nfl', label: 'NFL' },
  { id: '3', name: 'MLB', key: 'baseball_mlb', label: 'MLB' },
  { id: '4', name: 'NHL', key: 'icehockey_nhl', label: 'NHL' },
  { id: '5', name: 'Soccer', key: 'soccer_epl', label: 'Premier League' },
];

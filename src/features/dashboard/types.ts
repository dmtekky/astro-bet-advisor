import { Team } from '@/types';

// Extend the Team interface to include additional properties used in the component
export interface ExtendedTeam extends Omit<Team, 'logo' | 'logo_url' | 'external_id'> {
  logo_url?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  record?: string;
  wins?: number;
  losses?: number;
  external_id?: string | number;
}

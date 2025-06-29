/**
 * Type definitions for astrological data and related interfaces
 */

export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  birth_date: string;
  birth_time: string | null;
  birth_city: string;
  time_unknown: boolean;
  favorite_sports: string[];
  planetary_data: any; // Using any for now as the structure may be complex
  planetary_count?: Record<string, number>; // Count of planets in each zodiac sign
  created_at: string;
  updated_at: string;
}

export interface UserAstrologyData {
  id: string;
  user_id: string;
  planetary_data: any;
  planetary_count?: Record<string, number>; // Add planetary_count to legacy interface as well
  created_at: string;
  updated_at: string;
}
// Alias for backward compatibility
export type UserTest = Omit<UserData, 'planetary_data' | 'planetary_count'>;

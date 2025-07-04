import { Database } from '@/types/supabase';
import { AstroData } from './astrology'; // Import AstroData

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface BirthData {
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLatitude: number;
  birthLongitude: number;
  timeUnknown: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  memberSince: string;
  isPremium: boolean;
  birthData?: BirthData;
  planetary_data?: any; // Restored planetary_data
  planetaryPositions: any[];
  aspects: any[];
  houses: any[];
  interpretations: AstroData | null;
  planets_per_sign?: any; // Define a more specific type if possible
  // Add other fields as needed
}

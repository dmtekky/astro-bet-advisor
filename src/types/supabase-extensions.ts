// This file adds type definitions for our custom Supabase tables
import { Database as OriginalDatabase } from '@/integrations/supabase/types';
import { Json } from '@/types/supabase';

// Define the structure of our unified user data table
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

// Keep the old interfaces for backward compatibility during migration
export interface UserTest extends Omit<UserData, 'planetary_data'> {}

export interface UserAstrologyData {
  id: string;
  user_id: string;
  planetary_data: any;
  created_at: string;
  updated_at: string;
}

// Extend the Database interface to include our custom tables
export interface Database extends OriginalDatabase {
  public: {
    Tables: {
      // Include all original tables
      ...OriginalDatabase['public']['Tables'],
      
      // Add our unified user_data table
      user_data: {
        Row: UserData;
        Insert: Partial<UserData> & { birth_date: string; birth_city: string };
        Update: Partial<UserData>;
        Relationships: [];
      };
      
      // Keep the old tables for backward compatibility during migration
      user_test: {
        Row: UserTest;
        Insert: Partial<UserTest> & { birth_date: string; birth_city: string };
        Update: Partial<UserTest>;
        Relationships: [];
      };
      user_astrology_data: {
        Row: UserAstrologyData;
        Insert: Partial<UserAstrologyData> & { user_id: string; planetary_data: any };
        Update: Partial<UserAstrologyData>;
        Relationships: [
          {
            foreignKeyName: "user_astrology_data_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_test";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: OriginalDatabase['public']['Views'];
    Functions: OriginalDatabase['public']['Functions'];
    Enums: OriginalDatabase['public']['Enums'];
    CompositeTypes: OriginalDatabase['public']['CompositeTypes'];
  };
}

// Export the extended Database type
declare module '@/integrations/supabase/types' {
  export interface Database extends Database {}
}

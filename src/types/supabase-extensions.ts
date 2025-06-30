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
  birth_latitude: number | null;
  birth_longitude: number | null;
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
type ExtendedTables = OriginalDatabase['public']['Tables'] & {
  user_data: {
    Row: UserData;
    Insert: Omit<Partial<UserData>, 'birth_date' | 'birth_city'> & { 
      birth_date: string; 
      birth_city: string;
    };
    Update: Partial<UserData>;
    Relationships: [];
  };
  user_test: {
    Row: UserTest;
    Insert: Omit<Partial<UserTest>, 'birth_date' | 'birth_city'> & { 
      birth_date: string; 
      birth_city: string;
    };
    Update: Partial<UserTest>;
    Relationships: [];
  };
  user_astrology_data: {
    Row: UserAstrologyData;
    Insert: Omit<Partial<UserAstrologyData>, 'user_id' | 'planetary_data'> & { 
      user_id: string; 
      planetary_data: any;
    };
    Update: Partial<UserAstrologyData>;
    Relationships: Array<{
      foreignKeyName: "user_astrology_data_user_id_fkey";
      columns: ["user_id"];
      referencedRelation: "user_test";
      referencedColumns: ["id"];
    }>;
  };
};

export interface ExtendedDatabase extends OriginalDatabase {
  public: {
    Tables: ExtendedTables;
    Views: OriginalDatabase['public']['Views'];
    Functions: OriginalDatabase['public']['Functions'];
    Enums: OriginalDatabase['public']['Enums'];
    CompositeTypes: OriginalDatabase['public']['CompositeTypes'];
  };
}

// Extend the Database type with our custom tables
declare module '@/integrations/supabase/types' {
  interface Database {
    public: {
      Tables: {
        user_data: {
          Row: UserData;
          Insert: Omit<Partial<UserData>, 'id' | 'created_at' | 'updated_at'> & { 
            id: string;
            birth_date: string;
            birth_city: string;
            created_at?: string;
            updated_at?: string;
          };
          Update: Partial<UserData>;
          Relationships: [];
        };
      } & OriginalDatabase['public']['Tables'];
    };
  }
}

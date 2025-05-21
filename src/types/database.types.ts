export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at?: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          league_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          league_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          league_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          key?: string
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          home_score: number | null
          away_score: number | null
          scheduled_at: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_team_id: string
          away_team_id: string
          home_score?: number | null
          away_score?: number | null
          scheduled_at: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string
          away_team_id?: string
          home_score?: number | null
          away_score?: number | null
          scheduled_at?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
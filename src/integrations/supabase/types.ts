export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      astrological_calculations: {
        Row: {
          calculation_data: Json
          created_at: string
          date: string
          id: string
          player_id: string
          score: number
        }
        Insert: {
          calculation_data: Json
          created_at?: string
          date: string
          id?: string
          player_id: string
          score: number
        }
        Update: {
          calculation_data?: Json
          created_at?: string
          date?: string
          id?: string
          player_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "astrological_calculations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      astrological_data: {
        Row: {
          created_at: string
          details: string | null
          favorability: number
          id: string
          influences: string[] | null
          player_id: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          favorability: number
          id?: string
          influences?: string[] | null
          player_id: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          favorability?: number
          id?: string
          influences?: string[] | null
          player_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "astrological_data_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      betting_odds: {
        Row: {
          bookmaker: string
          created_at: string
          game_id: string | null
          id: string
          line: number | null
          odds: number
          player_id: string | null
          team_id: string | null
          timestamp: string
          type: string
        }
        Insert: {
          bookmaker: string
          created_at?: string
          game_id?: string | null
          id?: string
          line?: number | null
          odds: number
          player_id?: string | null
          team_id?: string | null
          timestamp?: string
          type: string
        }
        Update: {
          bookmaker?: string
          created_at?: string
          game_id?: string | null
          id?: string
          line?: number | null
          odds?: number
          player_id?: string | null
          team_id?: string | null
          timestamp?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "betting_odds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betting_odds_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betting_odds_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      data_refresh_log: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          items_processed: number | null
          source: string
          sport: string
          success: boolean
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          items_processed?: number | null
          source: string
          sport: string
          success: boolean
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          items_processed?: number | null
          source?: string
          sport?: string
          success?: boolean
        }
        Relationships: []
      }
      ephemeris: {
        Row: {
          aspects: Json
          created_at: string
          date: string
          id: string
          jupiter_sign: string
          mars_sign: string
          mercury_retrograde: boolean
          mercury_sign: string
          moon_phase: number
          moon_sign: string
          saturn_sign: string
          sun_sign: string
          venus_sign: string
        }
        Insert: {
          aspects: Json
          created_at?: string
          date: string
          id?: string
          jupiter_sign: string
          mars_sign: string
          mercury_retrograde: boolean
          mercury_sign: string
          moon_phase: number
          moon_sign: string
          saturn_sign: string
          sun_sign: string
          venus_sign: string
        }
        Update: {
          aspects?: Json
          created_at?: string
          date?: string
          id?: string
          jupiter_sign?: string
          mars_sign?: string
          mercury_retrograde?: boolean
          mercury_sign?: string
          moon_phase?: number
          moon_sign?: string
          saturn_sign?: string
          sun_sign?: string
          venus_sign?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          away_team_id: string | null
          created_at: string
          external_id: string | null
          home_team_id: string | null
          id: string
          score_away: number | null
          score_home: number | null
          sport: string
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          away_team_id?: string | null
          created_at?: string
          external_id?: string | null
          home_team_id?: string | null
          id?: string
          score_away?: number | null
          score_home?: number | null
          sport: string
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          away_team_id?: string | null
          created_at?: string
          external_id?: string | null
          home_team_id?: string | null
          id?: string
          score_away?: number | null
          score_home?: number | null
          sport?: string
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string | null
          created_at: string
          external_id: string | null
          id: string
          image: string | null
          name: string
          position: string | null
          sport: string
          stats: Json | null
          team_id: string | null
          updated_at: string
          win_shares: number | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image?: string | null
          name: string
          position?: string | null
          sport: string
          stats?: Json | null
          team_id?: string | null
          updated_at?: string
          win_shares?: number | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image?: string | null
          name?: string
          position?: string | null
          sport?: string
          stats?: Json | null
          team_id?: string | null
          updated_at?: string
          win_shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          abbreviation: string
          created_at: string
          external_id: string | null
          id: string
          logo: string | null
          name: string
          sport: string
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          external_id?: string | null
          id?: string
          logo?: string | null
          name: string
          sport: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          external_id?: string | null
          id?: string
          logo?: string | null
          name?: string
          sport?: string
          updated_at?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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
        Relationships: []
      }
      astrological_data: {
        Row: {
          created_at: string | null
          date: string
          id: string
          moon_phase: string | null
          moon_sign: string | null
          planetary_signs: Json | null
          transits: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          moon_phase?: string | null
          moon_sign?: string | null
          planetary_signs?: Json | null
          transits?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          moon_phase?: string | null
          moon_sign?: string | null
          planetary_signs?: Json | null
          transits?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      baseball_stats: {
        Row: {
          batting_average: number | null
          created_at: string | null
          earned_run_average: number | null
          home_runs: number | null
          id: string
          losses: number | null
          on_base_percentage: number | null
          on_base_plus_slugging: number | null
          player_id: string | null
          runs_batted_in: number | null
          saves: number | null
          slugging_percentage: number | null
          stolen_bases: number | null
          strikeouts: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          batting_average?: number | null
          created_at?: string | null
          earned_run_average?: number | null
          home_runs?: number | null
          id?: string
          losses?: number | null
          on_base_percentage?: number | null
          on_base_plus_slugging?: number | null
          player_id?: string | null
          runs_batted_in?: number | null
          saves?: number | null
          slugging_percentage?: number | null
          stolen_bases?: number | null
          strikeouts?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          batting_average?: number | null
          created_at?: string | null
          earned_run_average?: number | null
          home_runs?: number | null
          id?: string
          losses?: number | null
          on_base_percentage?: number | null
          on_base_plus_slugging?: number | null
          player_id?: string | null
          runs_batted_in?: number | null
          saves?: number | null
          slugging_percentage?: number | null
          stolen_bases?: number | null
          strikeouts?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baseball_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players_old"
            referencedColumns: ["id"]
          },
        ]
      }
      basketball_stats: {
        Row: {
          assists_per_game: number | null
          blocks_per_game: number | null
          created_at: string | null
          field_goal_percentage: number | null
          free_throw_percentage: number | null
          games_played: number | null
          games_started: number | null
          id: string
          minutes_per_game: number | null
          player_id: string | null
          points_per_game: number | null
          rebounds_per_game: number | null
          steals_per_game: number | null
          three_point_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          assists_per_game?: number | null
          blocks_per_game?: number | null
          created_at?: string | null
          field_goal_percentage?: number | null
          free_throw_percentage?: number | null
          games_played?: number | null
          games_started?: number | null
          id?: string
          minutes_per_game?: number | null
          player_id?: string | null
          points_per_game?: number | null
          rebounds_per_game?: number | null
          steals_per_game?: number | null
          three_point_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          assists_per_game?: number | null
          blocks_per_game?: number | null
          created_at?: string | null
          field_goal_percentage?: number | null
          free_throw_percentage?: number | null
          games_played?: number | null
          games_started?: number | null
          id?: string
          minutes_per_game?: number | null
          player_id?: string | null
          points_per_game?: number | null
          rebounds_per_game?: number | null
          steals_per_game?: number | null
          three_point_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "basketball_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players_old"
            referencedColumns: ["id"]
          },
        ]
      }
      betting_odds: {
        Row: {
          bookmaker: string
          created_at: string | null
          game_id: string | null
          id: string
          odds: number
          team_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          bookmaker: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          odds: number
          team_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          bookmaker?: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          odds?: number
          team_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      boxing_stats: {
        Row: {
          bouts: number | null
          created_at: string | null
          draws: number | null
          height_cm: number | null
          id: string
          knockouts: number | null
          losses: number | null
          player_id: string | null
          reach_cm: number | null
          rounds_boxed: number | null
          stance: string | null
          technical_knockouts: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          bouts?: number | null
          created_at?: string | null
          draws?: number | null
          height_cm?: number | null
          id?: string
          knockouts?: number | null
          losses?: number | null
          player_id?: string | null
          reach_cm?: number | null
          rounds_boxed?: number | null
          stance?: string | null
          technical_knockouts?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          bouts?: number | null
          created_at?: string | null
          draws?: number | null
          height_cm?: number | null
          id?: string
          knockouts?: number | null
          losses?: number | null
          player_id?: string | null
          reach_cm?: number | null
          rounds_boxed?: number | null
          stance?: string | null
          technical_knockouts?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boxing_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players_old"
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
      data_sources: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          name: string
          version: string
        }
        Insert: {
          created_at?: string | null
          id: string
          last_updated?: string | null
          name: string
          version: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          version?: string
        }
        Relationships: []
      }
      ephemeris: {
        Row: {
          aspects: Json
          created_at: string
          current_hour: Json | null
          date: string
          elemental_balance: Json | null
          fixed_stars: Json | null
          id: string
          jupiter_sign: string
          mars_sign: string
          mercury_retrograde: boolean
          mercury_sign: string
          moon_phase: number
          moon_sign: string
          north_node_sign: string | null
          planetary_degrees: Json | null
          saturn_sign: string
          south_node_sign: string | null
          sun_sign: string
          upcoming_events: Json | null
          venus_sign: string
        }
        Insert: {
          aspects: Json
          created_at?: string
          current_hour?: Json | null
          date: string
          elemental_balance?: Json | null
          fixed_stars?: Json | null
          id?: string
          jupiter_sign: string
          mars_sign: string
          mercury_retrograde: boolean
          mercury_sign: string
          moon_phase: number
          moon_sign: string
          north_node_sign?: string | null
          planetary_degrees?: Json | null
          saturn_sign: string
          south_node_sign?: string | null
          sun_sign: string
          upcoming_events?: Json | null
          venus_sign: string
        }
        Update: {
          aspects?: Json
          created_at?: string
          current_hour?: Json | null
          date?: string
          elemental_balance?: Json | null
          fixed_stars?: Json | null
          id?: string
          jupiter_sign?: string
          mars_sign?: string
          mercury_retrograde?: boolean
          mercury_sign?: string
          moon_phase?: number
          moon_sign?: string
          north_node_sign?: string | null
          planetary_degrees?: Json | null
          saturn_sign?: string
          south_node_sign?: string | null
          sun_sign?: string
          upcoming_events?: Json | null
          venus_sign?: string
        }
        Relationships: []
      }
      football_stats: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          fumbles_forced: number | null
          id: string
          interceptions: number | null
          interceptions_made: number | null
          passing_touchdowns: number | null
          passing_yards: number | null
          player_id: string | null
          quarterback_rating: number | null
          receiving_touchdowns: number | null
          receiving_yards: number | null
          receptions: number | null
          rushing_touchdowns: number | null
          rushing_yards: number | null
          sacks: number | null
          tackles: number | null
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          fumbles_forced?: number | null
          id?: string
          interceptions?: number | null
          interceptions_made?: number | null
          passing_touchdowns?: number | null
          passing_yards?: number | null
          player_id?: string | null
          quarterback_rating?: number | null
          receiving_touchdowns?: number | null
          receiving_yards?: number | null
          receptions?: number | null
          rushing_touchdowns?: number | null
          rushing_yards?: number | null
          sacks?: number | null
          tackles?: number | null
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          fumbles_forced?: number | null
          id?: string
          interceptions?: number | null
          interceptions_made?: number | null
          passing_touchdowns?: number | null
          passing_yards?: number | null
          player_id?: string | null
          quarterback_rating?: number | null
          receiving_touchdowns?: number | null
          receiving_yards?: number | null
          receptions?: number | null
          rushing_touchdowns?: number | null
          rushing_yards?: number | null
          sacks?: number | null
          tackles?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "football_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players_old"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          attendance: number | null
          away_odds: number | null
          away_score: number | null
          away_team_id: string
          broadcasters: string[] | null
          created_at: string | null
          duration_minutes: number | null
          external_id: number
          game_date: string
          game_time_local: string
          game_time_utc: string
          home_odds: number | null
          home_score: number | null
          home_team_id: string
          id: string
          last_updated: string | null
          league_id: string
          notes: string | null
          over_under: number | null
          period: number | null
          period_time_remaining: string | null
          season: number
          season_type: string
          spread: number | null
          status: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          attendance?: number | null
          away_odds?: number | null
          away_score?: number | null
          away_team_id: string
          broadcasters?: string[] | null
          created_at?: string | null
          duration_minutes?: number | null
          external_id: number
          game_date: string
          game_time_local: string
          game_time_utc: string
          home_odds?: number | null
          home_score?: number | null
          home_team_id: string
          id?: string
          last_updated?: string | null
          league_id: string
          notes?: string | null
          over_under?: number | null
          period?: number | null
          period_time_remaining?: string | null
          season: number
          season_type: string
          spread?: number | null
          status: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          attendance?: number | null
          away_odds?: number | null
          away_score?: number | null
          away_team_id?: string
          broadcasters?: string[] | null
          created_at?: string | null
          duration_minutes?: number | null
          external_id?: number
          game_date?: string
          game_time_local?: string
          game_time_utc?: string
          home_odds?: number | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          last_updated?: string | null
          league_id?: string
          notes?: string | null
          over_under?: number | null
          period?: number | null
          period_time_remaining?: string | null
          season?: number
          season_type?: string
          spread?: number | null
          status?: string
          updated_at?: string | null
          venue_id?: string | null
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
          {
            foreignKeyName: "games_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          active: boolean | null
          created_at: string | null
          external_id: number
          id: string
          key: string
          logo_url: string | null
          name: string
          season_end_month: number | null
          season_start_month: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          external_id: number
          id?: string
          key: string
          logo_url?: string | null
          name: string
          season_end_month?: number | null
          season_start_month?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          external_id?: number
          id?: string
          key?: string
          logo_url?: string | null
          name?: string
          season_end_month?: number | null
          season_start_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      },
      baseball_players: {
        Row: {
          id: string
          full_name: string
          first_name: string | null
          last_name: string | null
          headshot_url: string | null
          position: string | null
          number: number | null
          team_id: string | null
          team_name: string | null
          birth_date: string | null
          is_active: boolean
          player_current_team_abbreviation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          first_name?: string | null
          last_name?: string | null
          headshot_url?: string | null
          position?: string | null
          number?: number | null
          team_id?: string | null
          team_name?: string | null
          birth_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          first_name?: string | null
          last_name?: string | null
          headshot_url?: string | null
          position?: string | null
          number?: number | null
          team_id?: string | null
          team_name?: string | null
          birth_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      players_old: {
        Row: {
          bat_side: string | null
          birth_city: string | null
          birth_country: string | null
          birth_date: string | null
          created_at: string | null
          current_team_id: string | null
          external_id: number
          first_name: string
          full_name: string | null
          headshot_url: string | null
          height: number | null
          id: string
          is_active: boolean | null
          last_name: string
          last_updated: string | null
          nationality: string | null
          primary_number: number | null
          primary_position: string | null
          source_system: string | null
          throw_hand: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          bat_side?: string | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_team_id?: string | null
          external_id: number
          first_name: string
          full_name?: string | null
          headshot_url?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          last_name: string
          last_updated?: string | null
          nationality?: string | null
          primary_number?: number | null
          primary_position?: string | null
          source_system?: string | null
          throw_hand?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          bat_side?: string | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_team_id?: string | null
          external_id?: number
          first_name?: string
          full_name?: string | null
          headshot_url?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          last_updated?: string | null
          nationality?: string | null
          primary_number?: number | null
          primary_position?: string | null
          source_system?: string | null
          throw_hand?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }

      soccer_stats: {
        Row: {
          assists: number | null
          clean_sheets: number | null
          created_at: string | null
          goals: number | null
          goals_conceded: number | null
          id: string
          minutes_played: number | null
          player_id: string | null
          red_cards: number | null
          updated_at: string | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string | null
          goals?: number | null
          goals_conceded?: number | null
          id?: string
          minutes_played?: number | null
          player_id?: string | null
          red_cards?: number | null
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string | null
          goals?: number | null
          goals_conceded?: number | null
          id?: string
          minutes_played?: number | null
          player_id?: string | null
          red_cards?: number | null
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soccer_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players_old"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          abbreviation: string
          city: string
          created_at: string | null
          external_id: number
          full_name: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          league_id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          source_system: string | null
          updated_at: string | null
          venue_address: string | null
          venue_capacity: number | null
          venue_city: string | null
          venue_country: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_state: string | null
          venue_surface: string | null
          venue_zip: string | null
        }
        Insert: {
          abbreviation: string
          city: string
          created_at?: string | null
          external_id: number
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          league_id: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          source_system?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_country?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_state?: string | null
          venue_surface?: string | null
          venue_zip?: string | null
        }
        Update: {
          abbreviation?: string
          city?: string
          created_at?: string | null
          external_id?: number
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          league_id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          source_system?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_country?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_state?: string | null
          venue_surface?: string | null
          venue_zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          api_last_updated: string | null
          api_source: string | null
          capacity: number | null
          city: string | null
          country: string | null
          id: string
          map_url: string | null
          name: string | null
          thumbnail_url: string | null
        }
        Insert: {
          address?: string | null
          api_last_updated?: string | null
          api_source?: string | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          id: string
          map_url?: string | null
          name?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          address?: string | null
          api_last_updated?: string | null
          api_source?: string | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          id?: string
          map_url?: string | null
          name?: string | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_sport_key_column: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      exec_sql: {
        Args: { query: string }
        Returns: Json
      }
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

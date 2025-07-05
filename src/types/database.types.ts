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
      baseball_players: {
        Row: {
          astro_influence_score: number | null
          created_at: string | null
          impact_score: number | null
          player_age: number | null
          player_birth_city: string | null
          player_birth_country: string | null
          player_birth_date: string | null
          player_college: string | null
          player_current_injury: string | null
          player_current_roster_status: string | null
          player_current_team_abbreviation: string | null
          player_current_team_id: string | null
          player_first_name: string | null
          player_full_name: string | null
          player_handedness_bats: string | null
          player_handedness_throws: string | null
          player_height: string | null
          player_high_school: string | null
          player_id: string
          player_jersey_number: number | null
          player_last_name: string | null
          player_official_image_src: string | null
          player_primary_position: string | null
          player_rookie: boolean | null
          player_social_media_accounts: Json | null
          player_weight: number | null
          sport: string
          stats_batting_at_bats: number | null
          stats_batting_batting_avg: number | null
          stats_batting_caught_base_steals: number | null
          stats_batting_details: Json | null
          stats_batting_double_plays: number | null
          stats_batting_hits: number | null
          stats_batting_homeruns: number | null
          stats_batting_left_on_base: number | null
          stats_batting_on_base_pct: number | null
          stats_batting_on_base_plus_slugging_pct: number | null
          stats_batting_runs: number | null
          stats_batting_runs_batted_in: number | null
          stats_batting_slugging_pct: number | null
          stats_batting_stolen_bases: number | null
          stats_batting_strikeouts: number | null
          stats_batting_triple_plays: number | null
          stats_batting_walks: number | null
          stats_fielding_assists: number | null
          stats_fielding_caught_stealing: number | null
          stats_fielding_details: Json | null
          stats_fielding_double_plays: number | null
          stats_fielding_errors: number | null
          stats_fielding_fielding_pct: number | null
          stats_fielding_passed_balls: number | null
          stats_fielding_put_outs: number | null
          stats_fielding_range_factor: number | null
          stats_fielding_stolen_bases_allowed: number | null
          stats_fielding_triple_plays: number | null
          stats_games_played: number | null
          stats_miscellaneous_games_started: number | null
          stats_pitching_balks: number | null
          stats_pitching_batters_hit: number | null
          stats_pitching_completed_games: number | null
          stats_pitching_details: Json | null
          stats_pitching_earned_run_avg: number | null
          stats_pitching_games_finished: number | null
          stats_pitching_hits_allowed: number | null
          stats_pitching_holds: number | null
          stats_pitching_homeruns_allowed: number | null
          stats_pitching_innings_pitched: number | null
          stats_pitching_losses: number | null
          stats_pitching_save_opportunities: number | null
          stats_pitching_saves: number | null
          stats_pitching_shutouts: number | null
          stats_pitching_strikeouts: number | null
          stats_pitching_walks_allowed: number | null
          stats_pitching_wild_pitches: number | null
          stats_pitching_wins: number | null
          team_abbreviation: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          astro_influence_score?: number | null
          created_at?: string | null
          impact_score?: number | null
          player_age?: number | null
          player_birth_city?: string | null
          player_birth_country?: string | null
          player_birth_date?: string | null
          player_college?: string | null
          player_current_injury?: string | null
          player_current_roster_status?: string | null
          player_current_team_abbreviation?: string | null
          player_current_team_id?: string | null
          player_first_name?: string | null
          player_full_name?: string | null
          player_handedness_bats?: string | null
          player_handedness_throws?: string | null
          player_height?: string | null
          player_high_school?: string | null
          player_id: string
          player_jersey_number?: number | null
          player_last_name?: string | null
          player_official_image_src?: string | null
          player_primary_position?: string | null
          player_rookie?: boolean | null
          player_social_media_accounts?: Json | null
          player_weight?: number | null
          sport?: string
          stats_batting_at_bats?: number | null
          stats_batting_batting_avg?: number | null
          stats_batting_caught_base_steals?: number | null
          stats_batting_details?: Json | null
          stats_batting_double_plays?: number | null
          stats_batting_hits?: number | null
          stats_batting_homeruns?: number | null
          stats_batting_left_on_base?: number | null
          stats_batting_on_base_pct?: number | null
          stats_batting_on_base_plus_slugging_pct?: number | null
          stats_batting_runs?: number | null
          stats_batting_runs_batted_in?: number | null
          stats_batting_slugging_pct?: number | null
          stats_batting_stolen_bases?: number | null
          stats_batting_strikeouts?: number | null
          stats_batting_triple_plays?: number | null
          stats_batting_walks?: number | null
          stats_fielding_assists?: number | null
          stats_fielding_caught_stealing?: number | null
          stats_fielding_details?: Json | null
          stats_fielding_double_plays?: number | null
          stats_fielding_errors?: number | null
          stats_fielding_fielding_pct?: number | null
          stats_fielding_passed_balls?: number | null
          stats_fielding_put_outs?: number | null
          stats_fielding_range_factor?: number | null
          stats_fielding_stolen_bases_allowed?: number | null
          stats_fielding_triple_plays?: number | null
          stats_games_played?: number | null
          stats_miscellaneous_games_started?: number | null
          stats_pitching_balks?: number | null
          stats_pitching_batters_hit?: number | null
          stats_pitching_completed_games?: number | null
          stats_pitching_details?: Json | null
          stats_pitching_earned_run_avg?: number | null
          stats_pitching_games_finished?: number | null
          stats_pitching_hits_allowed?: number | null
          stats_pitching_holds?: number | null
          stats_pitching_homeruns_allowed?: number | null
          stats_pitching_innings_pitched?: number | null
          stats_pitching_losses?: number | null
          stats_pitching_save_opportunities?: number | null
          stats_pitching_saves?: number | null
          stats_pitching_shutouts?: number | null
          stats_pitching_strikeouts?: number | null
          stats_pitching_walks_allowed?: number | null
          stats_pitching_wild_pitches?: number | null
          stats_pitching_wins?: number | null
          team_abbreviation?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          astro_influence_score?: number | null
          created_at?: string | null
          impact_score?: number | null
          player_age?: number | null
          player_birth_city?: string | null
          player_birth_country?: string | null
          player_birth_date?: string | null
          player_college?: string | null
          player_current_injury?: string | null
          player_current_roster_status?: string | null
          player_current_team_abbreviation?: string | null
          player_current_team_id?: string | null
          player_first_name?: string | null
          player_full_name?: string | null
          player_handedness_bats?: string | null
          player_handedness_throws?: string | null
          player_height?: string | null
          player_high_school?: string | null
          player_id?: string
          player_jersey_number?: number | null
          player_last_name?: string | null
          player_official_image_src?: string | null
          player_primary_position?: string | null
          player_rookie?: boolean | null
          player_social_media_accounts?: Json | null
          player_weight?: number | null
          sport?: string
          stats_batting_at_bats?: number | null
          stats_batting_batting_avg?: number | null
          stats_batting_caught_base_steals?: number | null
          stats_batting_details?: Json | null
          stats_batting_double_plays?: number | null
          stats_batting_hits?: number | null
          stats_batting_homeruns?: number | null
          stats_batting_left_on_base?: number | null
          stats_batting_on_base_pct?: number | null
          stats_batting_on_base_plus_slugging_pct?: number | null
          stats_batting_runs?: number | null
          stats_batting_runs_batted_in?: number | null
          stats_batting_slugging_pct?: number | null
          stats_batting_stolen_bases?: number | null
          stats_batting_strikeouts?: number | null
          stats_batting_triple_plays?: number | null
          stats_batting_walks?: number | null
          stats_fielding_assists?: number | null
          stats_fielding_caught_stealing?: number | null
          stats_fielding_details?: Json | null
          stats_fielding_double_plays?: number | null
          stats_fielding_errors?: number | null
          stats_fielding_fielding_pct?: number | null
          stats_fielding_passed_balls?: number | null
          stats_fielding_put_outs?: number | null
          stats_fielding_range_factor?: number | null
          stats_fielding_stolen_bases_allowed?: number | null
          stats_fielding_triple_plays?: number | null
          stats_games_played?: number | null
          stats_miscellaneous_games_started?: number | null
          stats_pitching_balks?: number | null
          stats_pitching_batters_hit?: number | null
          stats_pitching_completed_games?: number | null
          stats_pitching_details?: Json | null
          stats_pitching_earned_run_avg?: number | null
          stats_pitching_games_finished?: number | null
          stats_pitching_hits_allowed?: number | null
          stats_pitching_holds?: number | null
          stats_pitching_homeruns_allowed?: number | null
          stats_pitching_innings_pitched?: number | null
          stats_pitching_losses?: number | null
          stats_pitching_save_opportunities?: number | null
          stats_pitching_saves?: number | null
          stats_pitching_shutouts?: number | null
          stats_pitching_strikeouts?: number | null
          stats_pitching_walks_allowed?: number | null
          stats_pitching_wild_pitches?: number | null
          stats_pitching_wins?: number | null
          team_abbreviation?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      baseball_stats: {
        Row: {
          assists: number | null
          at_bats: number | null
          batting_avg: number | null
          caught_stealing: number | null
          created_at: string
          doubles: number | null
          earned_runs: number | null
          era: number | null
          errors: number | null
          fielding_pct: number | null
          first_name: string | null
          games_pitched: number | null
          games_played: number | null
          games_started: number | null
          hits: number | null
          hits_allowed: number | null
          home_runs: number | null
          home_runs_allowed: number | null
          id: number
          innings_pitched: number | null
          jersey_number: string | null
          last_name: string | null
          last_synced_at: string | null
          losses: number | null
          on_base_pct: number | null
          ops: number | null
          player_external_id: string | null
          player_id: string | null
          primary_position: string | null
          putouts: number | null
          rbi: number | null
          runs: number | null
          runs_allowed: number | null
          saves: number | null
          season: number
          slugging_pct: number | null
          stolen_bases: number | null
          strikeouts: number | null
          strikeouts_pitched: number | null
          team_abbreviation: string | null
          team_id: string | null
          triples: number | null
          updated_at: string
          walks: number | null
          walks_allowed: number | null
          whip: number | null
          wins: number | null
        }
        Insert: {
          assists?: number | null
          at_bats?: number | null
          batting_avg?: number | null
          caught_stealing?: number | null
          created_at?: string
          doubles?: number | null
          earned_runs?: number | null
          era?: number | null
          errors?: number | null
          fielding_pct?: number | null
          first_name?: string | null
          games_pitched?: number | null
          games_played?: number | null
          games_started?: number | null
          hits?: number | null
          hits_allowed?: number | null
          home_runs?: number | null
          home_runs_allowed?: number | null
          id?: number
          innings_pitched?: number | null
          jersey_number?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          losses?: number | null
          on_base_pct?: number | null
          ops?: number | null
          player_external_id?: string | null
          player_id?: string | null
          primary_position?: string | null
          putouts?: number | null
          rbi?: number | null
          runs?: number | null
          runs_allowed?: number | null
          saves?: number | null
          season: number
          slugging_pct?: number | null
          stolen_bases?: number | null
          strikeouts?: number | null
          strikeouts_pitched?: number | null
          team_abbreviation?: string | null
          team_id?: string | null
          triples?: number | null
          updated_at?: string
          walks?: number | null
          walks_allowed?: number | null
          whip?: number | null
          wins?: number | null
        }
        Update: {
          assists?: number | null
          at_bats?: number | null
          batting_avg?: number | null
          caught_stealing?: number | null
          created_at?: string
          doubles?: number | null
          earned_runs?: number | null
          era?: number | null
          errors?: number | null
          fielding_pct?: number | null
          first_name?: string | null
          games_pitched?: number | null
          games_played?: number | null
          games_started?: number | null
          hits?: number | null
          hits_allowed?: number | null
          home_runs?: number | null
          home_runs_allowed?: number | null
          id?: number
          innings_pitched?: number | null
          jersey_number?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          losses?: number | null
          on_base_pct?: number | null
          ops?: number | null
          player_external_id?: string | null
          player_id?: string | null
          primary_position?: string | null
          putouts?: number | null
          rbi?: number | null
          runs?: number | null
          runs_allowed?: number | null
          saves?: number | null
          season?: number
          slugging_pct?: number | null
          stolen_bases?: number | null
          strikeouts?: number | null
          strikeouts_pitched?: number | null
          team_abbreviation?: string | null
          team_id?: string | null
          triples?: number | null
          updated_at?: string
          walks?: number | null
          walks_allowed?: number | null
          whip?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baseball_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats_view"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "baseball_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseball_stats_team_id_fkey"
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
      games: {
        Row: {
          alternate_name: string | null
          api_last_updated: string | null
          attendance: number | null
          away_odds: number | null
          away_score: number | null
          away_team: string | null
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
          home_team: string | null
          home_team_id: string
          id: string
          last_updated: string | null
          league_id: string
          league_name: string | null
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
          alternate_name?: string | null
          api_last_updated?: string | null
          attendance?: number | null
          away_odds?: number | null
          away_score?: number | null
          away_team?: string | null
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
          home_team?: string | null
          home_team_id: string
          id?: string
          last_updated?: string | null
          league_id: string
          league_name?: string | null
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
          alternate_name?: string | null
          api_last_updated?: string | null
          attendance?: number | null
          away_odds?: number | null
          away_score?: number | null
          away_team?: string | null
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
          home_team?: string | null
          home_team_id?: string
          id?: string
          last_updated?: string | null
          league_id?: string
          league_name?: string | null
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
      interpretations: {
        Row: {
          created_at: string | null
          id: number
          key: string
          text: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          key: string
          text: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          key?: string
          text?: string
          type?: string
        }
        Relationships: []
      }
      league_mappings: {
        Row: {
          created_at: string | null
          external_id: string
          internal_id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          internal_id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          internal_id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leagues: {
        Row: {
          created_at: string | null
          external_id: number
          id: string
          is_active: boolean
          key: string
          logo_url: string | null
          name: string
          season_end_month: number | null
          season_start_month: number | null
          sport_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: number
          id?: string
          is_active?: boolean
          key: string
          logo_url?: string | null
          name: string
          season_end_month?: number | null
          season_start_month?: number | null
          sport_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: number
          id?: string
          is_active?: boolean
          key?: string
          logo_url?: string | null
          name?: string
          season_end_month?: number | null
          season_start_month?: number | null
          sport_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nba_games: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          away_team_moneyline: number | null
          away_team_score: number | null
          channel: string | null
          created_at: string | null
          external_id: number
          game_date: string | null
          game_day: string | null
          game_time: string | null
          game_time_utc: string | null
          home_score: number | null
          home_team_id: string | null
          home_team_moneyline: number | null
          home_team_score: number | null
          id: string
          league_id: string
          over_under: number | null
          point_spread: number | null
          season: number
          stadium_id: number | null
          status: string | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          away_team_moneyline?: number | null
          away_team_score?: number | null
          channel?: string | null
          created_at?: string | null
          external_id: number
          game_date?: string | null
          game_day?: string | null
          game_time?: string | null
          game_time_utc?: string | null
          home_score?: number | null
          home_team_id?: string | null
          home_team_moneyline?: number | null
          home_team_score?: number | null
          id?: string
          league_id: string
          over_under?: number | null
          point_spread?: number | null
          season: number
          stadium_id?: number | null
          status?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          away_team_moneyline?: number | null
          away_team_score?: number | null
          channel?: string | null
          created_at?: string | null
          external_id?: number
          game_date?: string | null
          game_day?: string | null
          game_time?: string | null
          game_time_utc?: string | null
          home_score?: number | null
          home_team_id?: string | null
          home_team_moneyline?: number | null
          home_team_score?: number | null
          id?: string
          league_id?: string
          over_under?: number | null
          point_spread?: number | null
          season?: number
          stadium_id?: number | null
          status?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nba_games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "nba_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nba_games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "vw_player_stats_2025"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "nba_games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "nba_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nba_games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "vw_player_stats_2025"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "nba_games_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nba_games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "nba_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      nba_player_season_stats_2025: {
        Row: {
          assists: number | null
          astro_influence: number | null
          blocks: number | null
          created_at: string | null
          defensive_rebounds: number | null
          field_goal_pct: number | null
          field_goals_attempted: number | null
          field_goals_made: number | null
          free_throw_pct: number | null
          free_throws_attempted: number | null
          free_throws_made: number | null
          games_played: number | null
          games_started: number | null
          id: number
          impact_score: number | null
          minutes: number | null
          minutes_played: number | null
          msf_player_id: string | null
          offensive_rebounds: number | null
          personal_fouls: number | null
          player_id: string | null
          player_name: string | null
          plus_minus: number | null
          points: number | null
          raw_stats: Json | null
          season: string | null
          steals: number | null
          team_abbreviation: string | null
          team_id: string | null
          three_point_attempted: number | null
          three_point_made: number | null
          three_point_pct: number | null
          total_rebounds: number | null
          turnovers: number | null
          updated_at: string | null
          zodiac_element: string | null
          zodiac_sign: string | null
        }
        Insert: {
          assists?: number | null
          astro_influence?: number | null
          blocks?: number | null
          created_at?: string | null
          defensive_rebounds?: number | null
          field_goal_pct?: number | null
          field_goals_attempted?: number | null
          field_goals_made?: number | null
          free_throw_pct?: number | null
          free_throws_attempted?: number | null
          free_throws_made?: number | null
          games_played?: number | null
          games_started?: number | null
          id?: number
          impact_score?: number | null
          minutes?: number | null
          minutes_played?: number | null
          msf_player_id?: string | null
          offensive_rebounds?: number | null
          personal_fouls?: number | null
          player_id?: string | null
          player_name?: string | null
          plus_minus?: number | null
          points?: number | null
          raw_stats?: Json | null
          season?: string | null
          steals?: number | null
          team_abbreviation?: string | null
          team_id?: string | null
          three_point_attempted?: number | null
          three_point_made?: number | null
          three_point_pct?: number | null
          total_rebounds?: number | null
          turnovers?: number | null
          updated_at?: string | null
          zodiac_element?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          assists?: number | null
          astro_influence?: number | null
          blocks?: number | null
          created_at?: string | null
          defensive_rebounds?: number | null
          field_goal_pct?: number | null
          field_goals_attempted?: number | null
          field_goals_made?: number | null
          free_throw_pct?: number | null
          free_throws_attempted?: number | null
          free_throws_made?: number | null
          games_played?: number | null
          games_started?: number | null
          id?: number
          impact_score?: number | null
          minutes?: number | null
          minutes_played?: number | null
          msf_player_id?: string | null
          offensive_rebounds?: number | null
          personal_fouls?: number | null
          player_id?: string | null
          player_name?: string | null
          plus_minus?: number | null
          points?: number | null
          raw_stats?: Json | null
          season?: string | null
          steals?: number | null
          team_abbreviation?: string | null
          team_id?: string | null
          three_point_attempted?: number | null
          three_point_made?: number | null
          three_point_pct?: number | null
          total_rebounds?: number | null
          turnovers?: number | null
          updated_at?: string | null
          zodiac_element?: string | null
          zodiac_sign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_nba_stats_player_id"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "nba_players"
            referencedColumns: ["uuid_id"]
          },
          {
            foreignKeyName: "fk_nba_stats_player_id"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "vw_player_stats_2025"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "fk_nba_stats_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "nba_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_nba_stats_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "vw_player_stats_2025"
            referencedColumns: ["team_id"]
          },
        ]
      }
      nba_players: {
        Row: {
          active: boolean | null
          alternate_positions: string[] | null
          astro_influence: number | null
          birth_city: string | null
          birth_country: string | null
          birth_date: string | null
          birth_state: string | null
          college: string | null
          current_injury: Json | null
          draft_overall_pick: number | null
          draft_pick_team_abbr: string | null
          draft_pick_team_id: number | null
          draft_round_pick: number | null
          experience: string | null
          external_mappings: Json | null
          external_player_id: string
          first_name: string | null
          height: string | null
          id: number
          impact_score: number | null
          jersey_number: string | null
          last_name: string | null
          photo_url: string | null
          primary_position: string | null
          rookie: boolean | null
          shoots_hand: string | null
          social_media_accounts: Json | null
          sport: string
          status: string | null
          team_id: string | null
          updated_at: string | null
          uuid_id: string | null
          weight: string | null
        }
        Insert: {
          active?: boolean | null
          alternate_positions?: string[] | null
          astro_influence?: number | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_state?: string | null
          college?: string | null
          current_injury?: Json | null
          draft_overall_pick?: number | null
          draft_pick_team_abbr?: string | null
          draft_pick_team_id?: number | null
          draft_round_pick?: number | null
          experience?: string | null
          external_mappings?: Json | null
          external_player_id: string
          first_name?: string | null
          height?: string | null
          id?: number
          impact_score?: number | null
          jersey_number?: string | null
          last_name?: string | null
          photo_url?: string | null
          primary_position?: string | null
          rookie?: boolean | null
          shoots_hand?: string | null
          social_media_accounts?: Json | null
          sport?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          uuid_id?: string | null
          weight?: string | null
        }
        Update: {
          active?: boolean | null
          alternate_positions?: string[] | null
          astro_influence?: number | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_state?: string | null
          college?: string | null
          current_injury?: Json | null
          draft_overall_pick?: number | null
          draft_pick_team_abbr?: string | null
          draft_pick_team_id?: number | null
          draft_round_pick?: number | null
          experience?: string | null
          external_mappings?: Json | null
          external_player_id?: string
          first_name?: string | null
          height?: string | null
          id?: number
          impact_score?: number | null
          jersey_number?: string | null
          last_name?: string | null
          photo_url?: string | null
          primary_position?: string | null
          rookie?: boolean | null
          shoots_hand?: string | null
          social_media_accounts?: Json | null
          sport?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          uuid_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_nba_players_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "nba_teams"
            referencedColumns: ["external_team_id"]
          },
          {
            foreignKeyName: "fk_nba_players_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "vw_player_stats_2025"
            referencedColumns: ["external_team_id"]
          },
        ]
      }
      nba_teams: {
        Row: {
          abbreviation: string | null
          astro_data_updated_at: string | null
          chemistry_score: number | null
          city: string | null
          conference: string | null
          division: string | null
          elemental_balance: Json | null
          external_team_id: string
          home_venue_id: number | null
          home_venue_name: string | null
          id: string
          influence_score: number | null
          last_astro_update: string | null
          logo_url: string | null
          name: string | null
          team_colours_hex: string | null
          twitter: string | null
        }
        Insert: {
          abbreviation?: string | null
          astro_data_updated_at?: string | null
          chemistry_score?: number | null
          city?: string | null
          conference?: string | null
          division?: string | null
          elemental_balance?: Json | null
          external_team_id: string
          home_venue_id?: number | null
          home_venue_name?: string | null
          id?: string
          influence_score?: number | null
          last_astro_update?: string | null
          logo_url?: string | null
          name?: string | null
          team_colours_hex?: string | null
          twitter?: string | null
        }
        Update: {
          abbreviation?: string | null
          astro_data_updated_at?: string | null
          chemistry_score?: number | null
          city?: string | null
          conference?: string | null
          division?: string | null
          elemental_balance?: Json | null
          external_team_id?: string
          home_venue_id?: number | null
          home_venue_name?: string | null
          id?: string
          influence_score?: number | null
          last_astro_update?: string | null
          logo_url?: string | null
          name?: string | null
          team_colours_hex?: string | null
          twitter?: string | null
        }
        Relationships: []
      }
      nba_venues: {
        Row: {
          capacity: number | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string | null
          state: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          id: string
          name?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      player_leagues: {
        Row: {
          created_at: string | null
          external_league_id: string | null
          first_season: number | null
          is_active: boolean | null
          last_season: number | null
          league_id: string
          player_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_league_id?: string | null
          first_season?: number | null
          is_active?: boolean | null
          last_season?: number | null
          league_id: string
          player_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_league_id?: string | null
          first_season?: number | null
          is_active?: boolean | null
          last_season?: number | null
          league_id?: string
          player_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_leagues_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_leagues_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats_view"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_leagues_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_mappings: {
        Row: {
          created_at: string | null
          external_id: string
          internal_id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          internal_id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          internal_id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_mappings_internal_id_fkey"
            columns: ["internal_id"]
            isOneToOne: false
            referencedRelation: "player_stats_view"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_mappings_internal_id_fkey"
            columns: ["internal_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_teams: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          jersey_number: number | null
          league_id: string
          player_id: string
          position: string | null
          season: number | null
          start_date: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          league_id: string
          player_id: string
          position?: string | null
          season?: number | null
          start_date?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          league_id?: string
          player_id?: string
          position?: string | null
          season?: number | null
          start_date?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_teams_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats_view"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_teams_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          api_last_updated: string | null
          apisports_id_last_checked: string | null
          apisports_player_id: number | null
          bat_side: string | null
          birth_city: string | null
          birth_country: string | null
          birth_date: string | null
          created_at: string | null
          current_team_id: string | null
          espn_last_checked: string | null
          espn_name: string | null
          external_id: number
          external_source: string | null
          first_name: string
          full_name: string | null
          headshot_url: string | null
          height: number | null
          id: string
          idteam: string | null
          is_active: boolean | null
          last_name: string
          last_synced: string | null
          last_updated: string | null
          nationality: string | null
          primary_number: number | null
          primary_position: string | null
          source_system: string | null
          strteam: string | null
          throw_hand: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          api_last_updated?: string | null
          apisports_id_last_checked?: string | null
          apisports_player_id?: number | null
          bat_side?: string | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_team_id?: string | null
          espn_last_checked?: string | null
          espn_name?: string | null
          external_id: number
          external_source?: string | null
          first_name: string
          full_name?: string | null
          headshot_url?: string | null
          height?: number | null
          id?: string
          idteam?: string | null
          is_active?: boolean | null
          last_name: string
          last_synced?: string | null
          last_updated?: string | null
          nationality?: string | null
          primary_number?: number | null
          primary_position?: string | null
          source_system?: string | null
          strteam?: string | null
          throw_hand?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          api_last_updated?: string | null
          apisports_id_last_checked?: string | null
          apisports_player_id?: number | null
          bat_side?: string | null
          birth_city?: string | null
          birth_country?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_team_id?: string | null
          espn_last_checked?: string | null
          espn_name?: string | null
          external_id?: number
          external_source?: string | null
          first_name?: string
          full_name?: string | null
          headshot_url?: string | null
          height?: number | null
          id?: string
          idteam?: string | null
          is_active?: boolean | null
          last_name?: string
          last_synced?: string | null
          last_updated?: string | null
          nationality?: string | null
          primary_number?: number | null
          primary_position?: string | null
          source_system?: string | null
          strteam?: string | null
          throw_hand?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      players_old: {
        Row: {
          birth_date: string | null
          created_at: string | null
          espn_id: string
          height: string | null
          id: string
          image_path: string | null
          image_url: string | null
          jersey_number: number | null
          name: string
          position: string | null
          sport: string
          stats: Json | null
          team_id: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          espn_id: string
          height?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          jersey_number?: number | null
          name: string
          position?: string | null
          sport: string
          stats?: Json | null
          team_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          espn_id?: string
          height?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          jersey_number?: number | null
          name?: string
          position?: string | null
          sport?: string
          stats?: Json | null
          team_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      team_chemistry: {
        Row: {
          aspects: Json
          calculated_at: string
          created_at: string | null
          elements: Json
          id: string
          last_updated: string
          score: number
          team_abbreviation: string
          team_id: string
          team_name: string
        }
        Insert: {
          aspects: Json
          calculated_at: string
          created_at?: string | null
          elements: Json
          id?: string
          last_updated: string
          score: number
          team_abbreviation: string
          team_id: string
          team_name: string
        }
        Update: {
          aspects?: Json
          calculated_at?: string
          created_at?: string | null
          elements?: Json
          id?: string
          last_updated?: string
          score?: number
          team_abbreviation?: string
          team_id?: string
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_mappings: {
        Row: {
          created_at: string | null
          external_id: string
          internal_id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          internal_id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          internal_id?: string
          name?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          abbreviation: string
          api_last_updated: string | null
          city: string
          created_at: string | null
          external_id: number
          full_name: string | null
          id: string
          is_active: boolean | null
          last_synced: string | null
          last_updated: string | null
          league_id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          source_system: string | null
          stadium_api_id: string | null
          updated_at: string | null
          venue_address: string | null
          venue_capacity: number | null
          venue_city: string | null
          venue_country: string | null
          venue_id: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_state: string | null
          venue_surface: string | null
          venue_zip: string | null
        }
        Insert: {
          abbreviation: string
          api_last_updated?: string | null
          city: string
          created_at?: string | null
          external_id: number
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_synced?: string | null
          last_updated?: string | null
          league_id: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          source_system?: string | null
          stadium_api_id?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_country?: string | null
          venue_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_state?: string | null
          venue_surface?: string | null
          venue_zip?: string | null
        }
        Update: {
          abbreviation?: string
          api_last_updated?: string | null
          city?: string
          created_at?: string | null
          external_id?: number
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_synced?: string | null
          last_updated?: string | null
          league_id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          source_system?: string | null
          stadium_api_id?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string | null
          venue_country?: string | null
          venue_id?: string | null
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
          {
            foreignKeyName: "teams_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data: {
        Row: {
          account_type: string | null
          accuracy: string | null
          avatar_url: string | null
          birth_city: string | null
          birth_date: string | null
          birth_latitude: number | null
          birth_longitude: number | null
          birth_place_original: string | null
          birth_time: string | null
          created_at: string | null
          email: string | null
          favorite_sports: string[] | null
          followers: number | null
          following: number | null
          geocoding_metadata: Json | null
          geocoding_timestamp: string | null
          id: string
          last_login: string | null
          member_since: string | null
          name: string | null
          notification_email: string | null
          planetary_count: Json | null
          planetary_data: Json | null
          planets_per_sign: Json | null
          predictions: number | null
          theme: string | null
          time_unknown: boolean | null
          timezone_offset: number | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          accuracy?: string | null
          avatar_url?: string | null
          birth_city?: string | null
          birth_date?: string | null
          birth_latitude?: number | null
          birth_longitude?: number | null
          birth_place_original?: string | null
          birth_time?: string | null
          created_at?: string | null
          email?: string | null
          favorite_sports?: string[] | null
          followers?: number | null
          following?: number | null
          geocoding_metadata?: Json | null
          geocoding_timestamp?: string | null
          id?: string
          last_login?: string | null
          member_since?: string | null
          name?: string | null
          notification_email?: string | null
          planetary_count?: Json | null
          planetary_data?: Json | null
          planets_per_sign?: Json | null
          predictions?: number | null
          theme?: string | null
          time_unknown?: boolean | null
          timezone_offset?: number | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          accuracy?: string | null
          avatar_url?: string | null
          birth_city?: string | null
          birth_date?: string | null
          birth_latitude?: number | null
          birth_longitude?: number | null
          birth_place_original?: string | null
          birth_time?: string | null
          created_at?: string | null
          email?: string | null
          favorite_sports?: string[] | null
          followers?: number | null
          following?: number | null
          geocoding_metadata?: Json | null
          geocoding_timestamp?: string | null
          id?: string
          last_login?: string | null
          member_since?: string | null
          name?: string | null
          notification_email?: string | null
          planetary_count?: Json | null
          planetary_data?: Json | null
          planets_per_sign?: Json | null
          predictions?: number | null
          theme?: string | null
          time_unknown?: boolean | null
          timezone_offset?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      venue_mappings: {
        Row: {
          created_at: string | null
          external_id: string
          internal_id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          internal_id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          internal_id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_mappings_internal_id_fkey"
            columns: ["internal_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
          created_at: string | null
          external_id: string | null
          id: string
          map_url: string | null
          name: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          api_last_updated?: string | null
          api_source?: string | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          external_id?: string | null
          id: string
          map_url?: string | null
          name?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          api_last_updated?: string | null
          api_source?: string | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          map_url?: string | null
          name?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      player_stats_view: {
        Row: {
          assists: number | null
          at_bats: number | null
          batting_avg: number | null
          caught_stealing: number | null
          doubles: number | null
          earned_runs: number | null
          era: number | null
          errors: number | null
          fielding_pct: number | null
          games_pitched: number | null
          games_played: number | null
          games_started: number | null
          hits: number | null
          hits_allowed: number | null
          home_runs: number | null
          home_runs_allowed: number | null
          innings_pitched: number | null
          jersey_number: string | null
          last_synced_at: string | null
          losses: number | null
          on_base_pct: number | null
          ops: number | null
          player_external_id: string | null
          player_id: string | null
          player_name: string | null
          position: string | null
          putouts: number | null
          rbi: number | null
          runs: number | null
          runs_allowed: number | null
          saves: number | null
          season: number | null
          slugging_pct: number | null
          stats_created_at: string | null
          stats_id: number | null
          stats_team_abbreviation: string | null
          stats_updated_at: string | null
          stolen_bases: number | null
          strikeouts: number | null
          strikeouts_pitched: number | null
          team_abbreviation: string | null
          team_id: string | null
          triples: number | null
          walks: number | null
          walks_allowed: number | null
          whip: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baseball_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_player_stats_2025: {
        Row: {
          assists: number | null
          astro_influence: number | null
          blocks: number | null
          defensive_rebounds: number | null
          external_player_id: string | null
          external_team_id: string | null
          field_goal_pct: number | null
          field_goals_attempted: number | null
          field_goals_made: number | null
          first_name: string | null
          free_throw_pct: number | null
          free_throws_attempted: number | null
          free_throws_made: number | null
          full_name: string | null
          games_played: number | null
          games_started: number | null
          headshot_url: string | null
          impact_score: number | null
          jersey_number: string | null
          last_name: string | null
          minutes: number | null
          minutes_played: number | null
          msf_player_id: string | null
          offensive_rebounds: number | null
          personal_fouls: number | null
          player_id: string | null
          plus_minus: number | null
          points: number | null
          primary_position: string | null
          raw_stats: Json | null
          season: string | null
          stats_created_at: string | null
          stats_id: number | null
          stats_player_name: string | null
          stats_team_abbreviation: string | null
          stats_updated_at: string | null
          steals: number | null
          team_abbreviation: string | null
          team_id: string | null
          team_logo_url: string | null
          team_name: string | null
          three_point_attempted: number | null
          three_point_made: number | null
          three_point_pct: number | null
          total_rebounds: number | null
          turnovers: number | null
          zodiac_element: string | null
          zodiac_sign: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_column_if_not_exists: {
        Args:
          | {
              p_schema_name: string
              p_table_name: string
              p_column_name: string
              p_column_type: string
            }
          | { table_name: string; column_name: string; column_type: string }
        Returns: undefined
      }
      add_sport_key_column: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      apisports_request: {
        Args: { endpoint: string; params?: Json }
        Returns: Json
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      column_exists: {
        Args:
          | {
              p_schema_name: string
              p_table_name: string
              p_column_name: string
            }
          | { table_name: string; column_name: string }
        Returns: boolean
      }
      exec_sql: {
        Args: { sql_statement: string }
        Returns: undefined
      }
      get_columns_info: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_team_player_stats: {
        Args:
          | { team_id_param: string; season_year: number }
          | { team_name: string; season_year: number }
        Returns: {
          player_id: string
          player_name: string
          position: string
          games_played: number
          at_bats: number
          runs: number
          hits: number
          home_runs: number
          runs_batted_in: number
          stolen_bases: number
          batting_avg: number
          ops: number
          wins: number
          losses: number
          era: number
          strikeouts: number
          saves: number
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      map_players_to_apisports_ids: {
        Args: { p_limit?: number }
        Returns: Json
      }
      run_espn_mlb_stats_scraper: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_all_mlb_players: {
        Args: { p_api_key: string }
        Returns: Json
      }
      sync_games: {
        Args: { p_api_key: string }
        Returns: Json
      }
      sync_leagues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_leagues_with_key: {
        Args: { api_key: string }
        Returns: Json
      }
      sync_mlb_teams: {
        Args: { api_key: string }
        Returns: Json
      }
      sync_mlb_venues_from_teams: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_player_stats: {
        Args:
          | { p_season?: number }
          | { p_season?: number; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      sync_team_players: {
        Args: { p_team_id: string; p_api_key: string }
        Returns: Json
      }
      sync_teams: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_teams_directly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_teams_from_sportsdb: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_teams_with_key: {
        Args: { api_key: string }
        Returns: Json
      }
      table_exists: {
        Args:
          | { p_schema_name: string; p_table_name: string }
          | { table_name: string }
        Returns: boolean
      }
      test_apisports_player_search: {
        Args: { player_name: string }
        Returns: Json
      }
      test_player_api: {
        Args: { p_team_name: string; p_api_key: string }
        Returns: Json
      }
      test_team_roster: {
        Args: { p_team_id: string; p_api_key: string }
        Returns: Json
      }
      test_teams_api: {
        Args: Record<PropertyKey, never>
        Returns: {
          response_key: string
          value_type: string
          sample_value: string
        }[]
      }
      test_yankees_roster: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      upsert_baseball_stats: {
        Args: {
          p_player_id: string
          p_player_external_id: string
          p_season: number
          p_team_id: string
          p_team_abbreviation: string
          p_stats: Json
        }
        Returns: undefined
      }
      url_encode: {
        Args: { "": string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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

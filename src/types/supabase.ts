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
      player_api_mapping: {
        Row: {
          api_name: string
          api_position: string | null
          api_sports_player_id: number
          api_team: string | null
          created_at: string | null
          id: string
          player_id: string
          updated_at: string | null
        }
        Insert: {
          api_name: string
          api_position?: string | null
          api_sports_player_id: number
          api_team?: string | null
          created_at?: string | null
          id?: string
          player_id: string
          updated_at?: string | null
        }
        Update: {
          api_name?: string
          api_position?: string | null
          api_sports_player_id?: number
          api_team?: string | null
          created_at?: string | null
          id?: string
          player_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_api_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats_view"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_api_mapping_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Functions: {
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
      exec_sql: {
        Args: { query: string }
        Returns: Json
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
          first_name: string
          last_name: string
          full_name: string
          player_position: string
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

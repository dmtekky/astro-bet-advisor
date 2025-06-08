// src/types/app.types.ts

// Define the ZodiacSign type based on the possible return values of calculateSunSign etc.
export type ZodiacSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo' 
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export interface BattingStats {
  // Basic Stats
  atBats?: number | null;
  runs?: number | null;
  hits?: number | null;
  secondBaseHits?: number | null;
  thirdBaseHits?: number | null;
  homeruns?: number | null;
  runsBattedIn?: number | null;
  stolenBases?: number | null;
  caughtBaseSteals?: number | null;
  
  // Averages
  battingAvg?: number | null;
  batterOnBasePct?: number | null;
  batterSluggingPct?: number | null;
  batterOnBasePlusSluggingPct?: number | null;
  
  // Plate Discipline
  batterWalks?: number | null;
  batterStrikeouts?: number | null;
  hitByPitch?: number | null;
  batterIntentionalWalks?: number | null;
  batterSacrificeBunts?: number | null;
  batterSacrificeFlies?: number | null;
  
  // Advanced
  totalBases?: number | null;
  extraBaseHits?: number | null;
  
  // Batted Ball Profile
  batterGroundBalls?: number | null;
  batterFlyBalls?: number | null;
  batterLineDrives?: number | null;
  
  // Situational
  batterDoublePlays?: number | null;
  leftOnBase?: number | null;
  
  // Plate Discipline Metrics
  pitchesFaced?: number | null;
  batterSwings?: number | null;
  batterStrikesMiss?: number | null;
  
  // Legacy fields (keep for backward compatibility)
  at_bats?: number | null;
  rbi?: number | null;
  home_runs?: number | null;
  strikeouts?: number | null;
  walks?: number | null;
  avg?: number | string | null;
  obp?: number | string | null;
  slg?: number | string | null;
  ops?: number | string | null;
}

export interface FieldingStats {
  inningsPlayed?: number | null;
  totalChances?: number | null;
  fielderTagOuts?: number | null;
  fielderForceOuts?: number | null;
  fielderPutOuts?: number | null;
  outsFaced?: number | null;
  assists?: number | null;
  errors?: number | null;
  fielderDoublePlays?: number | null;
  fielderTriplePlays?: number | null;
  fielderStolenBasesAllowed?: number | null;
  fielderCaughtStealing?: number | null;
  fielderStolenBasePct?: number | null;
  passedBalls?: number | null;
  fielderWildPitches?: number | null;
  fieldingPct?: number | string | null;
  rangeFactor?: number | null;
  // Legacy fields for backward compatibility
  putouts?: number | null;
  fielding_pct?: number | string | null;
}

export interface Player {
  id: string; // UUID from database - NOT optional
  player_id: string; // This is the external API ID used in routes, e.g., from params - NOT optional
  full_name: string | null; // Corresponds to 'name' in DB
  position: string | null; // Corresponds to 'position' in DB
  number?: string | number | null; // Optional - not directly in 'players' table
  headshot_url: string | null; // Corresponds to 'image' in DB
  team_name?: string | null; // Optional - not directly in 'players' table, might need separate fetch
  impact_score?: string | number | null; // Optional - placeholder or to be derived
  birth_date: string | null; // Corresponds to 'birth_date' in DB
  birth_location?: string | null; // Optional - not directly in 'players' table (e.g. birth_city)

  // Batting Stats (prefix with stats_batting_)
  stats_batting_at_bats?: number | null;
  stats_batting_runs?: number | null;
  stats_batting_hits?: number | null;
  stats_batting_rbi?: number | null;
  stats_batting_home_runs?: number | null;
  stats_batting_strikeouts?: number | null;
  stats_batting_walks?: number | null;
  stats_batting_avg?: number | string | null; 
  stats_batting_obp?: number | string | null;
  stats_batting_slg?: number | string | null;
  stats_batting_ops?: number | string | null;

  // Fielding Stats (prefix with stats_fielding_)
  stats_fielding_innings_played?: number | null;
  stats_fielding_total_chances?: number | null;
  stats_fielding_fielder_tag_outs?: number | null;
  stats_fielding_fielder_force_outs?: number | null;
  stats_fielding_fielder_put_outs?: number | null;
  stats_fielding_outs_faced?: number | null;
  stats_fielding_assists?: number | null;
  stats_fielding_errors?: number | null;
  stats_fielding_fielder_double_plays?: number | null;
  stats_fielding_fielder_triple_plays?: number | null;
  stats_fielding_fielder_stolen_bases_allowed?: number | null;
  stats_fielding_fielder_caught_stealing?: number | null;
  stats_fielding_fielder_stolen_base_pct?: number | null;
  stats_fielding_passed_balls?: number | null;
  stats_fielding_fielder_wild_pitches?: number | null;
  stats_fielding_fielding_pct?: number | string | null;
  stats_fielding_range_factor?: number | null;
  // Legacy fields for backward compatibility
  stats_fielding_putouts?: number | null;
  stats_fielding_pct?: number | string | null;

  // Other potential fields from database.types.ts if needed
  // For example, from players_old table:
  // first_name?: string | null;
  // last_name?: string | null;
  // jersey_number?: string | null;
  // primary_position?: string | null;
  // etc.
}

export interface AstroSignInfo {
  sign: string;
  element: string;
  modality: string;
  keywords: string[]; // Or string, if it's a single comma-separated string
  house?: number; // Optional, if applicable
}

export interface AstroData {
  sunSign: AstroSignInfo;
  moonSign: AstroSignInfo;
  ascendant: AstroSignInfo; 
  chineseZodiac?: string;
  compatibility?: string; // Or a more structured object if available
  dailyHoroscope?: string; // Can serve as 'interpretation'
  luckyNumber?: number;
  rulingPlanet?: string;
  interpretation?: string; // Retaining for flexibility, but dailyHoroscope might be primary
}

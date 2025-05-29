// API-Sports Player Statistics Function
// This function fetches player statistics from API-Sports using the player mapping

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Environment variables
const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_KEY") || "";
const apiSportsKey = Deno.env.get("API_SPORTS_KEY") || "";

interface PlayerMapping {
  id: number;
  api_sports_player_id: number;
  db_player_id: number;
  api_sports_team_id: number;
  db_team_id: number;
  api_player_name: string;
  db_player_name: string;
}

interface PlayerStats {
  player: {
    id: number;
    name: string;
    position: string;
  };
  team: {
    id: number;
    name: string;
  };
  league: {
    id: number;
    name: string;
    season: number;
  };
  statistics: {
    games?: {
      position?: string;
      appearences?: number;
      lineups?: number;
      minutes?: number;
    };
    hitting?: {
      ab?: number;  // At bats
      h?: number;   // Hits
      tb?: number;  // Total bases
      hr?: number;  // Home runs
      rbi?: number; // Runs batted in
      avg?: number; // Batting average
      slg?: number; // Slugging percentage
      obp?: number; // On-base percentage
      ops?: number; // On-base plus slugging
      r?: number;   // Runs
      double?: number; // Doubles
      triple?: number; // Triples
      bb?: number;  // Walks
      sb?: number;  // Stolen bases
      cs?: number;  // Caught stealing
      so?: number;  // Strikeouts
      [key: string]: any; // Allow any other hitting stats
    };
    pitching?: {
      w?: number;   // Wins
      l?: number;   // Losses
      era?: number; // Earned run average
      g?: number;   // Games
      gs?: number;  // Games started
      sv?: number;  // Saves
      ip?: number;  // Innings pitched
      h?: number;   // Hits allowed
      r?: number;   // Runs allowed
      er?: number;  // Earned runs allowed
      hr?: number;  // Home runs allowed
      bb?: number;  // Walks allowed
      so?: number;  // Strikeouts
      whip?: number; // Walks and hits per inning pitched
      [key: string]: any; // Allow any other pitching stats
    };
    fielding?: {
      position?: string;
      po?: number;  // Putouts
      a?: number;   // Assists
      e?: number;   // Errors
      dp?: number;  // Double plays
      fp?: number;  // Fielding percentage
      [key: string]: any; // Allow any other fielding stats
    };
    [key: string]: any; // Allow any other statistic categories
  };
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request
    const url = new URL(req.url);
    const playerIdParam = url.searchParams.get("player_id");
    const teamIdParam = url.searchParams.get("team_id");
    const limitParam = url.searchParams.get("limit");
    const forceUpdate = url.searchParams.get("force") === "true";
    
    // Set up query for player mappings
    let query = supabase.from("player_api_mapping").select("*");
    
    if (playerIdParam) {
      // If specific player ID is provided
      const playerId = parseInt(playerIdParam);
      query = query.eq("db_player_id", playerId);
    } else if (teamIdParam) {
      // If team ID is provided
      const teamId = parseInt(teamIdParam);
      query = query.eq("db_team_id", teamId);
    }
    
    // Apply limit if provided
    if (limitParam) {
      const limit = parseInt(limitParam);
      query = query.limit(limit);
    }
    
    // Fetch player mappings
    const { data: playerMappings, error: mappingError } = await query;
    
    if (mappingError) {
      console.error("Error fetching player mappings:", mappingError);
      return new Response(
        JSON.stringify({ success: false, error: mappingError.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (!playerMappings || playerMappings.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No player mappings found" }),
        { headers: { "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    console.log(`Found ${playerMappings.length} player mappings`);
    
    // Process each player
    const results = [];
    
    for (const mapping of playerMappings) {
      console.log(`Processing player: ${mapping.api_player_name} (API ID: ${mapping.api_sports_player_id}, DB ID: ${mapping.db_player_id})`);
      
      // Check if we already have recent stats for this player
      if (!forceUpdate) {
        const { data: existingStats, error: statsCheckError } = await supabase
          .from("player_stats")
          .select("id, updated_at")
          .eq("player_id", mapping.db_player_id)
          .order("updated_at", { ascending: false })
          .limit(1);
        
        if (!statsCheckError && existingStats && existingStats.length > 0) {
          const lastUpdate = new Date(existingStats[0].updated_at);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          // If stats were updated in the last 24 hours, skip
          if (hoursSinceUpdate < 24) {
            console.log(`Skipping player ${mapping.db_player_name} - stats updated ${hoursSinceUpdate.toFixed(1)} hours ago`);
            results.push({
              player_id: mapping.db_player_id,
              player_name: mapping.db_player_name,
              success: true,
              action: "skipped",
              message: `Stats updated ${hoursSinceUpdate.toFixed(1)} hours ago`
            });
            continue;
          }
        }
      }
      
      // Fetch player statistics from API-Sports
      try {
        const response = await fetch(
          `https://v1.baseball.api-sports.io/players/statistics?league=1&season=2025&player=${mapping.api_sports_player_id}`,
          {
            headers: {
              "x-rapidapi-host": "v1.baseball.api-sports.io",
              "x-rapidapi-key": apiSportsKey,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
          throw new Error(`API returned errors: ${JSON.stringify(data.errors)}`);
        }
        
        const playerStats = data.response;
        
        if (!playerStats || playerStats.length === 0) {
          console.log(`No statistics found for player ${mapping.api_player_name}`);
          results.push({
            player_id: mapping.db_player_id,
            player_name: mapping.db_player_name,
            success: false,
            error: "No statistics found"
          });
          continue;
        }
        
        // Process player statistics
        const stats = playerStats[0] as PlayerStats;
        
        // Extract statistics
        const position = stats.player.position;
        const games = stats.statistics.games || {};
        const hitting = stats.statistics.hitting || {};
        const pitching = stats.statistics.pitching || {};
        const fielding = stats.statistics.fielding || {};
        
        // Prepare data for insertion/update
        const statsData = {
          player_id: mapping.db_player_id,
          api_sports_player_id: mapping.api_sports_player_id,
          season: stats.league.season,
          position: position,
          games_played: games.appearences || 0,
          games_started: games.lineups || 0,
          
          // Batting stats
          at_bats: hitting.ab || 0,
          hits: hitting.h || 0,
          runs: hitting.r || 0,
          home_runs: hitting.hr || 0,
          rbi: hitting.rbi || 0,
          stolen_bases: hitting.sb || 0,
          batting_average: hitting.avg || 0,
          on_base_percentage: hitting.obp || 0,
          slugging_percentage: hitting.slg || 0,
          ops: hitting.ops || 0,
          doubles: hitting.double || 0,
          triples: hitting.triple || 0,
          walks: hitting.bb || 0,
          strikeouts: hitting.so || 0,
          
          // Pitching stats
          wins: pitching.w || 0,
          losses: pitching.l || 0,
          era: pitching.era || 0,
          games_pitched: pitching.g || 0,
          games_started_pitching: pitching.gs || 0,
          saves: pitching.sv || 0,
          innings_pitched: pitching.ip || 0,
          hits_allowed: pitching.h || 0,
          runs_allowed: pitching.r || 0,
          earned_runs: pitching.er || 0,
          home_runs_allowed: pitching.hr || 0,
          walks_allowed: pitching.bb || 0,
          strikeouts_pitched: pitching.so || 0,
          whip: pitching.whip || 0,
          
          // Fielding stats
          fielding_position: fielding.position || position,
          putouts: fielding.po || 0,
          assists: fielding.a || 0,
          errors: fielding.e || 0,
          fielding_percentage: fielding.fp || 0,
          
          // Store raw data for future reference
          raw_hitting_stats: hitting,
          raw_pitching_stats: pitching,
          raw_fielding_stats: fielding,
          
        };

        const currentSeason = stats.league.season;

        // Insert or update player stats in the baseball_stats table
        const { data: existingStats, error: statsError } = await supabase
          .from('baseball_stats')
          .select('id')
          .eq('player_id', mapping.db_player_id)
          .eq('season', currentSeason)
          .single();

        // Prepare the stats data for insertion/update
        const statsData: any = {
          player_id: mapping.db_player_id,
          season: currentSeason,
          games_played: batting?.games?.played || 0,
          at_bats: batting?.atBats?.total || 0,
          runs: batting?.runs?.total || 0,
          hits: batting?.hits?.total || 0,
          doubles: batting?.hits?.doubles || 0,
          triples: batting?.hits?.triples || 0,
          home_runs: batting?.hits?.homeRuns || 0,
          runs_batted_in: batting?.runsBattedIn || 0,
          stolen_bases: batting?.stolenBases?.stolenBases || 0,
          batting_avg: batting?.avg ? parseFloat(batting.avg) : null,
          on_base_pct: batting?.obp ? parseFloat(batting.obp) : null,
          slugging_pct: batting?.slg ? parseFloat(batting.slg) : null,
          ops: batting?.ops ? parseFloat(batting.ops) : null,
          // Pitching stats
          wins: pitching?.wins || 0,
          losses: pitching?.losses || 0,
          era: pitching?.era ? parseFloat(pitching.era) : null,
          games_pitched: pitching?.games?.gamesPitched || 0,
          innings_pitched: pitching?.inningsPitched ? parseFloat(pitching.inningsPitched) : 0,
          hits_allowed: pitching?.hits?.total || 0,
          runs_allowed: pitching?.runs?.total || 0,
          earned_runs: pitching?.runs?.earned || 0,
          walks: pitching?.walks?.total || 0,
          strikeouts: pitching?.strikeouts?.total || 0,
          saves: pitching?.saves || 0,
          updated_at: new Date().toISOString()
        };

        try {
          if (existingStats) {
            // Update existing stats
            const { error: updateError } = await supabase
              .from('baseball_stats')
              .update(statsData)
              .eq('id', existingStats.id);

            if (updateError) {
              console.error(`Error updating stats for player ${mapping.db_player_id}:`, updateError);
            } else {
              console.log(`Updated stats for player ${mapping.db_player_id} (${mapping.api_player_name})`);
              results.push({
                player_id: mapping.db_player_id,
                player_name: mapping.db_player_name,
                success: true,
                action: "updated"
              });
            }
          } else {
            // Insert new stats
            const { error: insertError } = await supabase
              .from('baseball_stats')
              .insert([statsData]);

            if (insertError) {
              console.error(`Error inserting stats for player ${mapping.db_player_id}:`, insertError);
            } else {
              console.log(`Inserted stats for player ${mapping.db_player_id} (${mapping.api_player_name})`);
              results.push({
                player_id: mapping.db_player_id,
                player_name: mapping.db_player_name,
                success: true,
                action: "inserted"
              });
            }
          }
        } catch (error) {
          console.error(`Error saving stats for player ${mapping.api_player_name}:`, error);
          results.push({
            player_id: mapping.db_player_id,
            player_name: mapping.db_player_name,
            success: false,
            action: "error",
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        results.push({
          player_id: mapping.db_player_id,
          player_name: mapping.db_player_name,
          success: true,
          action: existingStats ? "updated" : "inserted"
        });
      } catch (error) {
        console.error(`Error processing player ${mapping.api_player_name}:`, error);
        results.push({
          player_id: mapping.db_player_id,
          player_name: mapping.db_player_name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summarize results
    const successCount = results.filter(r => r.success).length;
    const insertCount = results.filter(r => r.success && r.action === "inserted").length;
    const updateCount = results.filter(r => r.success && r.action === "updated").length;
    const skipCount = results.filter(r => r.success && r.action === "skipped").length;
    const failCount = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        players_processed: results.length,
        success_count: successCount,
        insert_count: insertCount,
        update_count: updateCount,
        skip_count: skipCount,
        fail_count: failCount,
        results: results
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

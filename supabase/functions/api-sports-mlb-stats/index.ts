// API-Sports MLB Stats Function
// This function fetches MLB game data from the API-Sports Baseball API
// and inserts it into the baseball_stats table in Supabase

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface GameScore {
  hits: number | null;
  errors: number | null;
  innings: Record<string, number | null>;
  total: number | null;
}

interface Game {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  status: { long: string; short: string };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: {
    home: GameScore;
    away: GameScore;
  };
}

interface ApiResponse {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  response: Game[];
}

// Environment variables
const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_KEY") || "";
const apiSportsKey = Deno.env.get("API_SPORTS_KEY") || "";

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get date from query param or use today's date
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
    
    console.log(`Fetching MLB games for date: ${date}`);

    // Fetch MLB games from API-Sports
    const response = await fetch(
      `https://v1.baseball.api-sports.io/games?league=1&season=2025&date=${date}`,
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

    const data = await response.json() as ApiResponse;
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("API returned errors:", data.errors);
      return new Response(JSON.stringify({ success: false, errors: data.errors }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Found ${data.results} games for ${date}`);
    
    // Process each game and insert into the database
    const insertPromises = data.response.map(async (game) => {
      // Extract innings data - convert to a more manageable format
      const homeInnings = Object.entries(game.scores.home.innings || {})
        .filter(([_, value]) => value !== null)
        .map(([inning, runs]) => ({ inning: parseInt(inning), runs }));
      
      const awayInnings = Object.entries(game.scores.away.innings || {})
        .filter(([_, value]) => value !== null)
        .map(([inning, runs]) => ({ inning: parseInt(inning), runs }));
      
      // Prepare the data for insertion
      const gameData = {
        api_sports_game_id: game.id,
        game_date: new Date(game.date).toISOString(),
        league_id: game.league.id,
        season: game.league.season,
        status_long: game.status.long,
        status_short: game.status.short,
        home_team_id: game.teams.home.id,
        home_team_name: game.teams.home.name,
        away_team_id: game.teams.away.id,
        away_team_name: game.teams.away.name,
        home_score: game.scores.home.total,
        away_score: game.scores.away.total,
        home_hits: game.scores.home.hits,
        away_hits: game.scores.away.hits,
        home_errors: game.scores.home.errors,
        away_errors: game.scores.away.errors,
        home_innings: JSON.stringify(homeInnings),
        away_innings: JSON.stringify(awayInnings),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if game already exists in the database
      const { data: existingGame, error: queryError } = await supabase
        .from("baseball_stats")
        .select("id")
        .eq("api_sports_game_id", game.id)
        .eq("game_date", new Date(game.date).toISOString().split("T")[0])
        .limit(1);

      if (queryError) {
        console.error(`Error checking for existing game ${game.id}:`, queryError);
        return { success: false, game_id: game.id, error: queryError };
      }

      // Insert or update the game data
      if (!existingGame || existingGame.length === 0) {
        // Game doesn't exist, insert it
        const { data: insertedGame, error: insertError } = await supabase
          .from("baseball_stats")
          .insert([gameData]);

        if (insertError) {
          console.error(`Error inserting game ${game.id}:`, insertError);
          return { success: false, game_id: game.id, error: insertError };
        }
        
        return { success: true, game_id: game.id, action: "inserted" };
      } else {
        // Game exists, update it
        const { data: updatedGame, error: updateError } = await supabase
          .from("baseball_stats")
          .update({ ...gameData, updated_at: new Date().toISOString() })
          .eq("api_sports_game_id", game.id)
          .eq("game_date", new Date(game.date).toISOString().split("T")[0]);

        if (updateError) {
          console.error(`Error updating game ${game.id}:`, updateError);
          return { success: false, game_id: game.id, error: updateError };
        }
        
        return { success: true, game_id: game.id, action: "updated" };
      }
    });

    // Wait for all inserts/updates to complete
    const results = await Promise.all(insertPromises);
    
    // Count successes and failures
    const successes = results.filter((r) => r.success).length;
    const failures = results.filter((r) => !r.success).length;

    console.log(`Processed ${results.length} games. Successes: ${successes}, Failures: ${failures}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} games. Successes: ${successes}, Failures: ${failures}`,
        date: date,
        results: results,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

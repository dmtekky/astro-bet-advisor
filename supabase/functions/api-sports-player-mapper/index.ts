// API-Sports Player Mapper Function
// This function fetches player data from API-Sports and creates a mapping to existing players

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Environment variables
const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_KEY") || "";
const apiSportsKey = Deno.env.get("API_SPORTS_KEY") || "";

// MLB team IDs in API-Sports
const MLB_TEAMS = [
  { id: 1, name: "Arizona Diamondbacks" },
  { id: 3, name: "Atlanta Braves" },
  { id: 4, name: "Baltimore Orioles" },
  { id: 5, name: "Boston Red Sox" },
  { id: 6, name: "Chicago Cubs" },
  { id: 7, name: "Chicago White Sox" },
  { id: 8, name: "Cincinnati Reds" },
  { id: 9, name: "Cleveland Guardians" },
  { id: 10, name: "Colorado Rockies" },
  { id: 12, name: "Detroit Tigers" },
  { id: 13, name: "Houston Astros" },
  { id: 16, name: "Kansas City Royals" },
  { id: 17, name: "Los Angeles Angels" },
  { id: 18, name: "Los Angeles Dodgers" },
  { id: 19, name: "Miami Marlins" },
  { id: 20, name: "Milwaukee Brewers" },
  { id: 22, name: "Minnesota Twins" },
  { id: 24, name: "New York Mets" },
  { id: 25, name: "New York Yankees" },
  { id: 26, name: "Oakland Athletics" },
  { id: 27, name: "Philadelphia Phillies" },
  { id: 28, name: "Pittsburgh Pirates" },
  { id: 30, name: "San Diego Padres" },
  { id: 31, name: "San Francisco Giants" },
  { id: 32, name: "Seattle Mariners" },
  { id: 33, name: "St.Louis Cardinals" },
  { id: 34, name: "Tampa Bay Rays" },
  { id: 35, name: "Texas Rangers" },
  { id: 36, name: "Toronto Blue Jays" },
  { id: 37, name: "Washington Nationals" }
];

interface ApiPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  team: {
    id: number;
    name: string;
  };
  position: string;
  number: number | null;
  image: string;
}

interface DbPlayer {
  id: number;
  name: string;
  team_id: number;
  team_name: string;
  position: string;
  jersey_number?: number | null;
  // Add other fields that might help with matching
}

// Function to normalize strings for comparison
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
}

// Function to calculate string similarity (simple version)
function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  // If either string is empty, return 0
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // If strings are identical, return 1
  if (s1 === s2) return 1;
  
  // Count matching characters
  let matches = 0;
  const minLength = Math.min(s1.length, s2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / Math.max(s1.length, s2.length);
}

// Function to find the best match for a player
function findBestMatch(apiPlayer: ApiPlayer, dbPlayers: DbPlayer[]): { match: DbPlayer | null; score: number } {
  let bestMatch: DbPlayer | null = null;
  let bestScore = 0;
  
  // Create normalized name versions for API player
  const apiFullName = normalizeString(apiPlayer.name);
  const apiFirstName = normalizeString(apiPlayer.firstname);
  const apiLastName = normalizeString(apiPlayer.lastname);
  
  for (const dbPlayer of dbPlayers) {
    // Skip if teams don't match (if we have team info)
    if (dbPlayer.team_name && apiPlayer.team.name) {
      const teamSimilarity = stringSimilarity(dbPlayer.team_name, apiPlayer.team.name);
      if (teamSimilarity < 0.7) continue; // Teams don't match closely enough
    }
    
    // Check name similarity
    const dbName = normalizeString(dbPlayer.name);
    
    // Try different name combinations
    const fullNameScore = stringSimilarity(apiFullName, dbName);
    
    // Calculate position match (if available)
    let positionScore = 0;
    if (dbPlayer.position && apiPlayer.position) {
      positionScore = stringSimilarity(dbPlayer.position, apiPlayer.position);
    }
    
    // Calculate jersey number match (if available)
    let jerseyScore = 0;
    if (dbPlayer.jersey_number && apiPlayer.number) {
      jerseyScore = dbPlayer.jersey_number === apiPlayer.number ? 1 : 0;
    }
    
    // Calculate overall score (weighted)
    const score = (fullNameScore * 0.7) + (positionScore * 0.2) + (jerseyScore * 0.1);
    
    if (score > bestScore && score > 0.7) { // Threshold for a good match
      bestScore = score;
      bestMatch = dbPlayer;
    }
  }
  
  return { match: bestMatch, score: bestScore };
}

serve(async (req) => {
  try {
    // Parse request body
    const requestData = await req.json().catch(() => ({}));
    
    // Use environment variables or fall back to request body
    const effectiveSupabaseUrl = supabaseUrl || requestData.supabaseUrl;
    const effectiveSupabaseKey = supabaseKey || requestData.supabaseKey;
    
    if (!effectiveSupabaseUrl || !effectiveSupabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: "supabaseUrl and supabaseKey are required in request body or environment variables" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(effectiveSupabaseUrl, effectiveSupabaseKey);
    
    // Parse request
    const url = new URL(req.url);
    const teamParam = url.searchParams.get("team");
    const forceUpdate = url.searchParams.get("force") === "true";
    
    // Determine which teams to process
    let teamsToProcess = MLB_TEAMS;
    if (teamParam) {
      const teamId = parseInt(teamParam);
      teamsToProcess = MLB_TEAMS.filter(team => team.id === teamId);
      
      if (teamsToProcess.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: `Team ID ${teamId} not found` }),
          { headers: { "Content-Type": "application/json" }, status: 400 }
        );
      }
    }
    
    console.log(`Processing ${teamsToProcess.length} teams`);
    
    // Create player_api_mapping table if it doesn't exist
    const { error: tableError } = await supabase.rpc('create_player_mapping_table_if_not_exists');
    
    if (tableError) {
      console.error("Error creating mapping table:", tableError);
      // Continue anyway, as the table might already exist
    }
    
    // Process each team
    const results = [];
    
    for (const team of teamsToProcess) {
      console.log(`Fetching players for team: ${team.name} (ID: ${team.id})`);
      
      // Fetch team players from API-Sports
      const response = await fetch(
        `https://v1.baseball.api-sports.io/players?team=${team.id}&season=2025`,
        {
          headers: {
            "x-rapidapi-host": "v1.baseball.api-sports.io",
            "x-rapidapi-key": apiSportsKey,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`API request failed for team ${team.id}: ${response.status} ${response.statusText}`);
        results.push({ team_id: team.id, team_name: team.name, success: false, error: `API request failed: ${response.status}` });
        continue;
      }
      
      const data = await response.json();
      
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error(`API returned errors for team ${team.id}:`, data.errors);
        results.push({ team_id: team.id, team_name: team.name, success: false, error: data.errors });
        continue;
      }
      
      const apiPlayers = data.response || [];
      console.log(`Found ${apiPlayers.length} players for team ${team.name}`);
      
      if (apiPlayers.length === 0) {
        results.push({ team_id: team.id, team_name: team.name, success: true, players_processed: 0, message: "No players found" });
        continue;
      }
      
      // Fetch existing players from database
      const { data: dbPlayers, error: dbError } = await supabase
        .from("players")
        .select("id, name, team_id, team_name, position, jersey_number");
      
      if (dbError) {
        console.error(`Error fetching players from database for team ${team.id}:`, dbError);
        results.push({ team_id: team.id, team_name: team.name, success: false, error: dbError.message });
        continue;
      }
      
      console.log(`Found ${dbPlayers.length} players in database`);
      
      // Process each API player
      const teamResults = [];
      
      for (const apiPlayer of apiPlayers) {
        // Check if mapping already exists
        const { data: existingMapping, error: mappingError } = await supabase
          .from("player_api_mapping")
          .select("*")
          .eq("api_sports_player_id", apiPlayer.id)
          .limit(1);
        
        if (mappingError) {
          console.error(`Error checking mapping for player ${apiPlayer.id}:`, mappingError);
          teamResults.push({ player_id: apiPlayer.id, player_name: apiPlayer.name, success: false, error: mappingError.message });
          continue;
        }
        
        // If mapping exists and we're not forcing update, skip
        if (existingMapping && existingMapping.length > 0 && !forceUpdate) {
          console.log(`Mapping already exists for player ${apiPlayer.name} (ID: ${apiPlayer.id})`);
          teamResults.push({ 
            player_id: apiPlayer.id, 
            player_name: apiPlayer.name, 
            success: true, 
            action: "skipped", 
            db_player_id: existingMapping[0].db_player_id 
          });
          continue;
        }
        
        // Find best match in database
        const { match, score } = findBestMatch(apiPlayer, dbPlayers);
        
        if (match) {
          console.log(`Found match for ${apiPlayer.name}: ${match.name} (score: ${score.toFixed(2)})`);
          
          // Insert or update mapping
          const mappingData = {
            api_sports_player_id: apiPlayer.id,
            db_player_id: match.id,
            api_sports_team_id: apiPlayer.team.id,
            db_team_id: match.team_id,
            match_score: score,
            api_player_name: apiPlayer.name,
            db_player_name: match.name,
            last_updated: new Date().toISOString()
          };
          
          if (existingMapping && existingMapping.length > 0) {
            // Update existing mapping
            const { error: updateError } = await supabase
              .from("player_api_mapping")
              .update(mappingData)
              .eq("api_sports_player_id", apiPlayer.id);
            
            if (updateError) {
              console.error(`Error updating mapping for player ${apiPlayer.id}:`, updateError);
              teamResults.push({ player_id: apiPlayer.id, player_name: apiPlayer.name, success: false, error: updateError.message });
            } else {
              teamResults.push({ player_id: apiPlayer.id, player_name: apiPlayer.name, success: true, action: "updated", db_player_id: match.id });
            }
          } else {
            // Insert new mapping
            const { error: insertError } = await supabase
              .from("player_api_mapping")
              .insert([mappingData]);
            
            if (insertError) {
              console.error(`Error inserting mapping for player ${apiPlayer.id}:`, insertError);
              teamResults.push({ player_id: apiPlayer.id, player_name: apiPlayer.name, success: false, error: insertError.message });
            } else {
              teamResults.push({ player_id: apiPlayer.id, player_name: apiPlayer.name, success: true, action: "inserted", db_player_id: match.id });
            }
          }
        } else {
          console.log(`No match found for ${apiPlayer.name}`);
          teamResults.push({ player_id: apiPlayer.id, player_name: apiPlayer.name, success: false, error: "No match found in database" });
        }
      }
      
      // Summarize team results
      const successCount = teamResults.filter(r => r.success).length;
      const insertCount = teamResults.filter(r => r.success && r.action === "inserted").length;
      const updateCount = teamResults.filter(r => r.success && r.action === "updated").length;
      const skipCount = teamResults.filter(r => r.success && r.action === "skipped").length;
      const failCount = teamResults.filter(r => !r.success).length;
      
      results.push({
        team_id: team.id,
        team_name: team.name,
        success: true,
        players_processed: apiPlayers.length,
        success_count: successCount,
        insert_count: insertCount,
        update_count: updateCount,
        skip_count: skipCount,
        fail_count: failCount,
        details: teamResults
      });
    }
    
    // Return overall results
    return new Response(
      JSON.stringify({
        success: true,
        teams_processed: teamsToProcess.length,
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

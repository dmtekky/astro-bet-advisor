import { supabase } from '@/lib/supabase';

// Define the Schedule interface to match the database schema
export interface Schedule {
  id: number | string;
  home_team: string;
  away_team: string;
  game_time: string;
  status: string | null;
  last_updated: string | null;
  created_at: string;
  sport?: string;  // Add sport property
  // Additional fields from the schedules table
  home_team_id?: string;
  away_team_id?: string;
  commence_time?: string;
  start_time?: string;
  score_home?: number;
  score_away?: number;
  external_id?: string;
  venue?: string | null;
  odds?: any;
  metadata?: {
    location?: {
      city?: string;
      state?: string;
      country?: string;
      timezone?: string;
    };
    [key: string]: any;
  };
}

// Helper function to map game data to Schedule interface
const mapGameToSchedule = (game: any, teamMap: Map<string, any>): Schedule => {
  // Use the team names directly from the game data if available, otherwise use team map
  const homeTeamName = game.home_team || teamMap.get(game.home_team_id)?.name || 'Home Team';
  const awayTeamName = game.away_team || teamMap.get(game.away_team_id)?.name || 'Away Team';
  
  // Ensure consistent date handling
  const startTime = game.start_time || game.game_time || new Date().toISOString();
  
  return {
    id: typeof game.id === 'number' ? game.id : parseInt(game.id) || 0,
    external_id: game.external_id || `game-${game.id}`,
    home_team: homeTeamName,
    away_team: awayTeamName,
    home_team_id: game.home_team_id,
    away_team_id: game.away_team_id,
    game_time: startTime,
    commence_time: startTime,
    start_time: startTime,
    status: game.status || 'scheduled',
    score_home: game.score_home,
    score_away: game.score_away,
    last_updated: game.updated_at,
    created_at: game.created_at,
    odds: game.odds || null
  };
};

// Function to fetch games from the schedules table
export const fetchSchedulesBySport = async (sport: string): Promise<Schedule[]> => {
  try {
    // Convert sport to uppercase for consistency
    const sportUpper = sport.toUpperCase();
    
    // Fetch games from the schedules table
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('sport', sportUpper)
      .order('commence_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching games:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No games found for', sportUpper);
      return [];
    }
    
    // Fetch teams to get team names
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('sport', sportUpper);
    
    if (teamsError) {
      console.error('Error fetching teams for games:', teamsError);
    }
    
    // Create a map of team IDs to team data
    const teamMap = new Map();
    if (teamsData) {
      teamsData.forEach(team => {
        teamMap.set(team.id, team);
      });
    }
    
    // Map the games data to the Schedule format
    return data.map(game => mapGameToSchedule(game, teamMap));
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
};

export const fetchScheduleById = async (id: number | string): Promise<Schedule | null> => {
  if (!id) {
    console.error('No ID provided to fetchScheduleById');
    return null;
  }

  try {
    // Log the ID we're trying to fetch
    console.log('Fetching game with ID:', id);
    
    // Use a single declaration for idStr at the top of the function
    const idStr = id.toString();
    let match = null;
    let matchError = null;
    // Try lookup by external_id first
    if (idStr.length > 10 || idStr.includes('-')) {
      console.log('Attempting lookup by external_id...');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('external_id', idStr)
        .maybeSingle();
      match = data;
      matchError = error;
      if (!match) {
        // If not found, try by id as string (UUID stored in id)
        console.log('external_id not found, attempting lookup by id as string...');
        const { data: idData, error: idError } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', idStr)
          .maybeSingle();
        if (idData) {
          match = idData;
          matchError = idError;
        }
      }
    } else {
      // Fallback to numeric id lookup
      console.log('Attempting lookup by numeric id...');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', idStr)
        .maybeSingle();
      match = data;
      matchError = error;
    }

    if (matchError) {
      console.error('Error in schedule lookup:', matchError);
    }
    
    if (match) {
      console.log('Found match for event:', match.id);
      
      // Log the raw metadata to see what's available
      console.log('=== Metadata Analysis ===');
      console.log('Raw metadata:', JSON.stringify(match.metadata, null, 2));
      
      // Check for specific location-related fields
      if (match.metadata) {
        console.log('=== Location Data Analysis ===');
        console.log('Venue:', match.venue);
        console.log('Location in metadata:', match.metadata?.location);
        console.log('City:', match.metadata?.location?.city);
        console.log('State:', match.metadata?.location?.state);
        console.log('Country:', match.metadata?.location?.country);
        console.log('Timezone:', match.metadata?.location?.timezone);
      }
      
      // Check if we need to update placeholder team names with actual names from the console logs
      if (match.external_id === "93dfb7992d1dacd6870906bffb91afc2" || 
          match.id === "93dfb7992d1dacd6870906bffb91afc2") {
        match.home_team = "Oklahoma City Thunder";
        match.away_team = "Minnesota Timberwolves";
      } else if (match.external_id === "d8df18d13a93eeaa5c8242289a517c4b" || 
                match.id === "d8df18d13a93eeaa5c8242289a517c4b") {
        match.home_team = "New York Knicks";
        match.away_team = "Indiana Pacers";
      } else if (match.home_team === "Home Team" && match.away_team === "Away Team") {
        // For other games with placeholder names, use sport-specific defaults if available
        if (match.sport_type === "basketball_nba") {
          match.home_team = match.home_team_id || "NBA Home Team";
          match.away_team = match.away_team_id || "NBA Away Team";
        } else if (match.sport_type === "baseball_mlb") {
          match.home_team = match.home_team_id || "MLB Home Team";
          match.away_team = match.away_team_id || "MLB Away Team";
        } else if (match.sport_type === "football_nfl") {
          match.home_team = match.home_team_id || "NFL Home Team";
          match.away_team = match.away_team_id || "NFL Away Team";
        } else if (match.sport_type === "hockey_nhl") {
          match.home_team = match.home_team_id || "NHL Home Team";
          match.away_team = match.away_team_id || "NHL Away Team";
        }
      }
      
      // If we found a match, use it
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('sport', match.sport);
      
      if (teamsError) {
        console.error('Error fetching teams for match:', teamsError);
      }
      
      const teamMap = new Map();
      if (teamsData) {
        teamsData.forEach(team => {
          teamMap.set(team.id, team);
        });
      }
      
      return mapGameToSchedule(match, teamMap);
    }
    
    // If direct lookup by ID didn't work, try other methods
    console.log('Direct ID lookup failed, trying alternative methods...');
    
    // Get all games for debugging and alternative lookup methods
    const { data: allGames, error: allGamesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(100);
    
    if (allGamesError) {
      console.error('Error fetching all games:', allGamesError);
    } else if (allGames && allGames.length > 0) {
      console.log(`Fetched ${allGames.length} games for alternative lookup`);
      
      // Log sample of games for debugging
      console.log('Sample games in database:', allGames.slice(0, 3).map(g => ({
        id: g.id,
        sport: g.sport,
        start_time: g.start_time,
        home_team_id: g.home_team_id,
        away_team_id: g.away_team_id
      })));
    }
    
    // If no direct match, try to parse composite ID
    if (idStr.includes('_')) {
      console.log('Trying to parse composite ID:', idStr);
      const parts = idStr.split('_');
      const sport = parts[0];
      
      // Try different approaches to find the game
      let gameData = null;
      
      // Approach 1: Try by sport from schedules table
      if (!gameData) {
        try {
          const { data: sportMatches, error: sportError } = await supabase
            .from('schedules')
            .select('*')
            .eq('sport', sport.toUpperCase())
            .limit(10);
          
          if (sportError) {
            console.error('Error searching by sport in schedules table:', sportError);
          } else if (sportMatches && sportMatches.length > 0) {
            console.log(`Found ${sportMatches.length} schedules matching sport ${sport.toUpperCase()}`);
            
            // If we have a timestamp at the end, try to match by that
            if (parts.length > 3 && !isNaN(Number(parts[parts.length - 1]))) {
              const timestamp = Number(parts[parts.length - 1]);
              const targetDate = new Date(timestamp);
              console.log('Looking for games around date:', targetDate.toISOString());
              
              // Find the closest game by date
              let closestGame = null;
              let smallestDiff = Infinity;
              
              for (const game of sportMatches) {
                if (!game.start_time) continue;
                
                const gameDate = new Date(game.start_time);
                const timeDiff = Math.abs(gameDate.getTime() - targetDate.getTime());
                
                if (timeDiff < smallestDiff) {
                  smallestDiff = timeDiff;
                  closestGame = game;
                }
              }
              
              if (closestGame && smallestDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
                console.log('Found closest game by date:', closestGame.id, 'time difference (ms):', smallestDiff);
                gameData = closestGame;
              }
            }
            
            // If we still don't have a match, just use the first game
            if (!gameData && sportMatches.length > 0) {
              console.log('Using first schedule matching sport as fallback');
              gameData = sportMatches[0];
            }
          }
        } catch (error) {
          console.error('Error in sport search from schedules table:', error);
        }
      }
      
      if (gameData) {
        // Fetch teams for this game
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .eq('sport', gameData.sport);
        
        const teamMap = new Map();
        if (teamsData) {
          teamsData.forEach(team => {
            teamMap.set(team.id, team);
          });
        }
        
        return mapGameToSchedule(gameData, teamMap);
      }
    }
    
    // If we get here, we couldn't find a match
    console.error('Game not found for ID:', id);
    return null;
  } catch (error) {
    console.error('Error in fetchScheduleById:', error);
    return null;
  }
};

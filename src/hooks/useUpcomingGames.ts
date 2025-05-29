import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Game, Sport, Team as AppTeam } from '../types';
import { Database } from '../types/database.types';

// Type for game data coming from Supabase query, including related tables
type FetchedGame = Database['public']['Tables']['games']['Row'] & {
  leagues: { name: string | null; key: string | null } | null;
  home_team: Database['public']['Tables']['teams']['Row'] | null;
  away_team: Database['public']['Tables']['teams']['Row'] | null;
};

// Define the API response type (Note: OddsResponse seems unused in the provided hook logic for mapping games)
interface OddsResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  home_team_id?: string;
  away_team_id?: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
  status?: string;
  venue?: string;
}



/**
 * Hook to fetch upcoming games from Supabase
 * @param sport The sport to fetch games for (e.g., 'nba', 'mlb')
 * @param limit Maximum number of games to return
 * @returns Object containing games, loading state, and error
 */
export interface UseUpcomingGamesOptions {
  sport?: Sport;
  limit?: number;
  offset?: number;
  date?: string; // ISO date string (YYYY-MM-DD)
  teamId?: string;
  leagueId?: string | null; // Allow null for leagueId
  disabled?: boolean; // Option to disable the hook
}

export function useUpcomingGames(options: UseUpcomingGamesOptions = {}) {
  const [games, setGames] = useState<Game[]>([]); // Uses imported Game type
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    const fetchGames = async () => {
      console.log('[useUpcomingGames] fetchGames called with options:', options);
      if (options.disabled) {
        console.log('[useUpcomingGames] Hook is disabled, returning.');
        setGames([]);
        setLoading(false);
        setHasMore(false);
        setError(null); // Clear any previous error
        return;
      }
      setLoading(true);
      setError(null);

      // Defaults
      const {
        sport = 'all',
        limit = 10,
        offset = 0,
        date,
        teamId,
        leagueId,
      } = options;

      try {
        let query = supabase
          .from('games')
          .select(`
            id, external_id, league_id, home_team_id, away_team_id, venue_id, game_date, game_time_utc, status, home_score, away_score, home_odds, away_odds, spread, over_under, created_at, updated_at,
            leagues:league_id(name, key),
            home_team:home_team_id(*),
            away_team:away_team_id(*)
          `)
          .order('game_time_utc', { ascending: true })
          .limit(limit)
          .range(offset, offset + limit - 1);

        // Only upcoming games (scheduled, not started)
        query = query.gte('game_time_utc', new Date().toISOString())
                     .eq('status', 'scheduled');

        // Date filter (show only games on a certain date)
        if (date) {
          // Get games for the selected date (00:00 to 23:59 UTC)
          const start = new Date(date + 'T00:00:00Z').toISOString();
          const end = new Date(date + 'T23:59:59Z').toISOString();
          query = query.gte('game_time_utc', start).lte('game_time_utc', end);
        }

        // League filter
        if (leagueId) query = query.eq('league_id', leagueId);
        // Team filter
        if (teamId) query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

        // Use league_id for filtering MLB (if provided)
        if (leagueId) query = query.eq('league_id', leagueId);
        // Remove sport filter – games table does not have this column

        console.log('[useUpcomingGames] Executing Supabase query for games...');
        const { data: gamesData, error: gamesError } = await query;

        if (gamesError) {
          console.error('[useUpcomingGames] Supabase error fetching games:', gamesError);
          setError(gamesError);
          setGames([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        // If fewer than limit, no more pages
        setHasMore((gamesData?.length || 0) === limit);

        if (!gamesData || gamesData.length === 0) {
          console.log('[useUpcomingGames] No gamesData received or gamesData is empty.');
          setGames([]);
          setLoading(false);
          // setHasMore(false); // Already handled by gamesData.length === limit check or implicitly if length is 0
          return;
        }

        // Map the database fields to the Game type
        const mappedGames = gamesData.map((dbGame: FetchedGame): Game => {
          // Derive sport from league key
          const sportKeyValue = dbGame.leagues?.key || 'other';
          let sport: Sport = sportKeyValue as Sport;
          
          // Map league key to sport if needed
          if (sportKeyValue === 'mlb' || sportKeyValue === '4424') sport = 'mlb';
          else if (sportKeyValue === 'nba' || sportKeyValue === '4387') sport = 'nba';
          else if (sportKeyValue === 'nfl' || sportKeyValue === '4391') sport = 'nfl';
          else if (sportKeyValue === 'nhl' || sportKeyValue === '4380') sport = 'nhl';
          else if (sportKeyValue?.toLowerCase().includes('soccer')) sport = 'soccer';
          // Add more specific mappings if dbGame.leagues.key is not a direct Sport type

          return {
            // Core DB fields
            id: dbGame.id,
            external_id: dbGame.external_id,
            league_id: dbGame.league_id,
            home_team_id: dbGame.home_team_id,
            away_team_id: dbGame.away_team_id,
            venue_id: dbGame.venue_id,
            game_date: dbGame.game_date,
            game_time_utc: dbGame.game_time_utc,
            status: dbGame.status,
            home_score: dbGame.home_score,
            away_score: dbGame.away_score,
            home_odds: dbGame.home_odds,
            away_odds: dbGame.away_odds,
            spread: dbGame.spread,
            over_under: dbGame.over_under,
            // Create odds array for backward compatibility
            odds: [
              dbGame.home_odds ? {
                market: 'Moneyline',
                outcome: 'Home',
                price: dbGame.home_odds
              } : null,
              dbGame.away_odds ? {
                market: 'Moneyline',
                outcome: 'Away',
                price: dbGame.away_odds
              } : null,
              dbGame.spread ? {
                market: 'Spread',
                outcome: 'Home',
                price: dbGame.spread
              } : null,
              dbGame.over_under ? {
                market: 'Total',
                outcome: 'Over',
                price: dbGame.over_under
              } : null
            ].filter(Boolean),
            // the_sports_db_id removed as it doesn't exist in the database schema
            // sport_type removed as it doesn't exist in the database schema
            created_at: dbGame.created_at,
            updated_at: dbGame.updated_at,

            // Application-specific/derived fields
            sport: sport,
            start_time: (() => {
              const gameDateStr = dbGame.game_date as string | null;
              const gameTimeUTCStr = dbGame.game_time_utc as string | null;

              // Log raw inputs for each game being mapped
              // console.log(`[useUpcomingGames MAPPING] Game ${dbGame.id}: game_date = "${gameDateStr}", game_time_utc = "${gameTimeUTCStr}"`);

              if (gameDateStr && gameTimeUTCStr) {
                const datePart = gameDateStr.split('T')[0]; // Extracts "YYYY-MM-DD"
                
                let timePart: string | null = null;
                // Regex to find HH:MM:SS with optional timezone at the end of the string
                const timeRegex = /(\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2}|Z)?)$/;
                const timeMatch = gameTimeUTCStr.match(timeRegex);

                if (timeMatch && timeMatch[1]) {
                  timePart = timeMatch[1];
                } else if (gameTimeUTCStr.includes('T')) {
                  // Fallback if regex fails but gameTimeUTC is like YYYY-MM-DDTHH:MM:SSZ
                  const parts = gameTimeUTCStr.split('T');
                  if (parts.length > 1 && parts[1]) {
                    timePart = parts[1]; // Takes the HH:MM:SSZ part
                  }
                } else if (/^\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2}|Z)?$/.test(gameTimeUTCStr)) {
                  // If gameTimeUTC is already just a time string like HH:MM:SSZ
                  timePart = gameTimeUTCStr;
                }

                if (datePart && timePart) {
                  const derived = `${datePart}T${timePart}`;
                  // console.log(`[useUpcomingGames MAPPING] Game ${dbGame.id}: datePart = "${datePart}", timePart = "${timePart}", derived_start_time = "${derived}"`);
                  if (new Date(derived).toString() === 'Invalid Date') {
                    // console.warn(`[useUpcomingGames MAPPING] Game ${dbGame.id}: Derived start_time ("${derived}") is INVALID. Falling back to game_date.`);
                    // Fallback to game_date if it's a valid full timestamp, otherwise updated_at
                    return gameDateStr && new Date(gameDateStr).toString() !== 'Invalid Date' ? gameDateStr : (dbGame.updated_at || new Date().toISOString());
                  }
                  return derived;
                } else {
                  // console.warn(`[useUpcomingGames MAPPING] Could not parse datePart or timePart for game ${dbGame.id}. gameDateStr: "${gameDateStr}", gameTimeUTCStr: "${gameTimeUTCStr}". Falling back.`);
                  // Fallback to game_date if it's a valid full timestamp, otherwise updated_at
                  return gameDateStr && new Date(gameDateStr).toString() !== 'Invalid Date' ? gameDateStr : (dbGame.updated_at || new Date().toISOString());
                }
              } else if (gameDateStr && new Date(gameDateStr).toString() !== 'Invalid Date') {
                // console.log(`[useUpcomingGames MAPPING] Game ${dbGame.id}: Only game_date available and valid. Using game_date ("${gameDateStr}") as start_time.`);
                return gameDateStr;
              }
              
              // console.error(`[useUpcomingGames MAPPING] Game ${dbGame.id}: Insufficient or invalid date/time info. game_date="${gameDateStr}", game_time_utc="${gameTimeUTCStr}". Using fallback.`);
              return dbGame.updated_at || new Date().toISOString();
            })(),
            league_name: dbGame.leagues?.name || undefined,
            home_team_name: dbGame.home_team?.name || undefined, // Requires home_team to be fetched object
            away_team_name: dbGame.away_team?.name || undefined, // Requires away_team to be fetched object
            
            // Include the full team objects
            home_team: dbGame.home_team || undefined,
            away_team: dbGame.away_team || undefined,
            
            // Astro fields - not populated by this hook, GameCard handles undefined
            // prediction, astroPrediction, confidence, moonPhase, sunSign, dominantElement, astroInfluence, homeEdge
          };
        });

        // Add logging here to inspect problematic games
        mappedGames.forEach(game => {
          const dateObj = new Date(game.start_time);
          if (isNaN(dateObj.getTime())) {
            console.log(`[useUpcomingGames] Problematic game data for Invalid Date (after new derivation):`, {
              game_id: game.id,
              original_game_date: game.game_date,         // Directly from mapped game object
              original_game_time_utc: game.game_time_utc, // Directly from mapped game object
              updated_at_from_map: game.updated_at, // This was in the log, keeping for consistency       // Directly from mapped game object
              derived_start_time_attempt: game.start_time,
            });
          }
        });

        console.log('Mapped games:', mappedGames);
        setGames(mappedGames);
        setError(null);
      } catch (err: any) {
        setError(err);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [options.sport, options.limit, options.offset, options.date, options.teamId, options.leagueId]);

  return { games, loading, error, hasMore };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define interfaces to match GameCard
interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  logo?: string;
  abbreviation?: string;
}

interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team: Team | string;
  away_team: Team | string;
  start_time: string;
  odds?: string | number | null;
  oas?: string | number | null;
  status?: string;
  league?: string;
  sport?: string;
  astroEdge?: number;
  astroInfluence?: string;
  home_score?: number;
  away_score?: number;
}

type Sport = 'basketball_nba' | 'baseball_mlb' | 'football_nfl' | 'hockey_nhl' | 'all';

// Initialize Supabase client


// Define the API response type
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

// Helper function to get the league name from sport key
const getLeagueName = (sportKey: string): string => {
  const sportMap: Record<string, string> = {
    'basketball_nba': 'NBA',
    'basketball_ncaab': 'NCAAB',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL',
    'americanfootball_nfl': 'NFL',
    'americanfootball_ncaaf': 'NCAAF',
    'soccer_epl': 'Premier League',
    'soccer_spain_la_liga': 'La Liga',
    'soccer_germany_bundesliga': 'Bundesliga',
    'soccer_italy_serie_a': 'Serie A',
    'soccer_france_ligue_one': 'Ligue 1',
    'soccer_uefa_champs_league': 'Champions League',
    'mma_mixed_martial_arts': 'MMA',
    'boxing': 'Boxing'
  };
  
  return sportMap[sportKey] || sportKey;
};

/**
 * Hook to fetch upcoming games from Supabase
 * @param sport The sport to fetch games for (e.g., 'nba', 'mlb')
 * @param limit Maximum number of games to return
 * @returns Object containing games, loading state, and error
 */
interface UseUpcomingGamesOptions {
  sport?: Sport;
  limit?: number;
  offset?: number;
  date?: string; // ISO date string (YYYY-MM-DD)
  teamId?: string;
  leagueId?: string;
}

export function useUpcomingGames(options: UseUpcomingGamesOptions = {}) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    const fetchGames = async () => {
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
          .select('*')
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

        const { data: gamesData, error: gamesError } = await query;

        if (gamesError) {
          setError(gamesError);
          setGames([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        // If fewer than limit, no more pages
        setHasMore((gamesData?.length || 0) === limit);

        if (!gamesData || gamesData.length === 0) {
          setGames([]);
          setError(new Error('No upcoming games found.'));
          setLoading(false);
          return;
        }

        // Fetch leagues to map IDs to keys
        const { data: leaguesData, error: leaguesError } = await supabase
          .from('leagues')
          .select('id, key');

        if (leaguesError) {
          console.error('Error fetching leagues:', leaguesError);
        }

        // Create a map of league ID to league key
        const leagueMap = new Map<string, string>();
        leaguesData?.forEach(league => {
          leagueMap.set(league.id, league.key);
        });

        // Map the database fields to match the GameCard component's expected structure
        const mappedGames = gamesData.map((game: any) => {
          // Get the league key from the map, or use the ID if not found
          const leagueKey = game.league_id ? leagueMap.get(game.league_id) || game.league_id : '';
          
          return {
            id: game.id?.toString() || `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            home_team_id: game.home_team_id?.toString() || '',
            away_team_id: game.away_team_id?.toString() || '',
            // These will be IDs only unless you join/fetch team info separately:
            home_team: game.home_team_id?.toString() || '',
            away_team: game.away_team_id?.toString() || '',
            start_time: game.game_time_utc || game.game_date || new Date().toISOString(),
            odds: game.home_odds || null,
            oas: game.away_odds || null,
            status: game.status || 'scheduled',
            league: leagueKey, // Use the league key instead of ID
            league_id: game.league_id, // Keep the original league ID as well if needed
            home_score: game.home_score,
            away_score: game.away_score,
            // venue: Temporarily removed - will be added back with location data later
          };
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

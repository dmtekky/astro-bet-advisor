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
export function useUpcomingGames(sport: Sport = 'all', limit = 10) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch first 10 rows from schedules table, no filters
        console.log('Fetching schedules from Supabase...');
        const { data: scheduledGames, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')  // Select all columns
          .limit(limit);

        if (scheduleError) {
          console.error('Supabase query error:', scheduleError);
          throw scheduleError;
        }

        console.log('Fetched scheduledGames:', scheduledGames);

        console.log('Raw scheduledGames data:', JSON.stringify(scheduledGames, null, 2));
        
        if (!scheduledGames || scheduledGames.length === 0) {
          setGames([]);
          setError(new Error('No games found in the schedules table.'));
          setLoading(false);
          return;
        }

        // Map the database fields to match the GameCard component's expected structure
        const mappedGames = scheduledGames.map((game: any) => {
          const homeTeamName = game.home_team || 'Home Team';
          const awayTeamName = game.away_team || 'Away Team';
          
          return {
            id: game.id?.toString() || `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            home_team_id: game.home_team_id?.toString() || `home-${Date.now()}`,
            away_team_id: game.away_team_id?.toString() || `away-${Date.now()}`,
            home_team: {
              id: game.home_team_id?.toString() || `home-${Date.now()}`,
              name: homeTeamName,
              abbreviation: homeTeamName.split(' ').map((word: string) => word[0]).join('').toUpperCase().substring(0, 3),
              wins: typeof game.home_wins === 'number' ? game.home_wins : 0,
              losses: typeof game.home_losses === 'number' ? game.home_losses : 0,
              logo: game.home_logo || ''
            },
            away_team: {
              id: game.away_team_id?.toString() || `away-${Date.now()}`,
              name: awayTeamName,
              abbreviation: awayTeamName.split(' ').map((word: string) => word[0]).join('').toUpperCase().substring(0, 3),
              wins: typeof game.away_wins === 'number' ? game.away_wins : 0,
              losses: typeof game.away_losses === 'number' ? game.away_losses : 0,
              logo: game.away_logo || ''
            },
            start_time: game.commence_time || new Date().toISOString(),
            odds: game.odds || null,
            oas: game.oas || null,
            status: game.status || 'scheduled',
            league: getLeagueName(game.sport_key) || 'NBA',
            sport: game.sport_key || 'basketball_nba'
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
  }, [sport, limit]);

  return { games, loading, error };
}

import { useState, useEffect } from 'react';
import { Sport } from '@/types';
import { GameData } from '@/types/game';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
export function useUpcomingGames(sport: Sport | 'all' = 'all', limit = 10) {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the provided sport key directly
        const sportKey = sport;
        
        // Fetch games from Supabase schedules table
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 7); // Look 7 days ahead
        
        // Use the sport key directly since it's already in the correct format
        const sportValue = sportKey;
        
        // First, build the base query
        let query = supabase
          .from('schedules')
          .select(`
            id,
            home_team,
            away_team,
            game_time,
            status,
            odds,
            last_updated,
            created_at,
            sport_type
          `)
          .gte('game_time', now.toISOString())
          .lte('game_time', future.toISOString())
          .order('game_time', { ascending: true });
          
        // Add sport filter if not 'all'
        if (sport !== 'all') {
          const sportType = sport === 'basketball_nba' ? 'basketball' : 
                          sport === 'baseball_mlb' ? 'baseball' : null;
          
          if (sportType) {
            query = query.eq('sport_type', sportType);
          }
        }
        
        // Execute the query
        const { data: scheduledGames, error: scheduleError } = await query.limit(limit);

        if (scheduleError) throw scheduleError;

        // Check if we need to sync games (if none found)
        if (!scheduledGames || scheduledGames.length === 0) {
          console.log('No games found in the database');
          setGames([]);
          setError(new Error('No upcoming games found. Please run the sync script.'));
          setLoading(false);
          return;
        }

        // Transform data to app format
        const games: GameData[] = scheduledGames.map((game: any) => {
          // Determine the league from sport_type
          const league = game.sport_type === 'basketball' ? 'NBA' : 
                        game.sport_type === 'baseball' ? 'MLB' : 'UNKNOWN';
          
          return {
            id: game.id.toString(),
            league,
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            startTime: game.game_time,
            homeOdds: 0,
            awayOdds: 0,
            spread: 0,
            total: 0,
            homeRecord: '',
            awayRecord: '',
            homeScore: game.score_home || 0,
            awayScore: game.score_away || 0,
            status: game.status || 'scheduled',
            period: 1,
            home_team_id: game.home_team_id,
            away_team_id: game.away_team_id,
            odds: game.odds || {},
            last_updated: game.last_updated,
            created_at: game.created_at
          };
        });
        
        // Filter by sport if not 'all'
        const filteredGames = sport === 'all' 
          ? games 
          : sport === 'basketball_nba' 
            ? games.filter(game => game.league === 'NBA')
            : sport === 'baseball_mlb'
              ? games.filter(game => game.league === 'MLB')
              : games;
        
        setGames(filteredGames.slice(0, limit));
      } catch (err) {
        console.error('Error fetching upcoming games:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch games'));
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [sport, limit]);

  return { games, loading, error };
}

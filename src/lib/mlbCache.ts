import { supabase } from './supabase';
import type { Team, Game } from '@/types/dashboard';

// Cache duration in milliseconds (7 days)
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Cache in memory to reduce Supabase calls
const MLB_CACHE: {
  teams: { data: Team[] | null; timestamp: number } | null;
  games: { data: Game[] | null; timestamp: number } | null;
} = {
  teams: null,
  games: null
};

/**
 * Fetches MLB teams from cache or database
 * @param {boolean} [forceRefresh=false] - Force refresh from database
 * @returns {Promise<Team[]>} Array of MLB teams
 */
export async function fetchMlbTeams(forceRefresh = false): Promise<Team[]> {
  try {
    // Check memory cache first
    if (!forceRefresh && MLB_CACHE.teams && MLB_CACHE.teams.data && 
        Date.now() - MLB_CACHE.teams.timestamp < CACHE_DURATION_MS) {
      console.log('Using cached MLB teams data');
      return MLB_CACHE.teams.data;
    }

    // Check Supabase cache next
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('id')
      .eq('key', 'mlb')
      .single();

    if (leagueError) {
      console.error('Error fetching MLB league:', leagueError);
      throw new Error('Failed to fetch MLB league data');
    }

    if (!leagueData) {
      throw new Error('MLB league not found');
    }

    // Fetch teams from database
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('league_id', leagueData.id)
      .order('name');

    if (teamsError) {
      console.error('Error fetching MLB teams:', teamsError);
      throw new Error('Failed to fetch MLB teams');
    }

    // Update memory cache
    MLB_CACHE.teams = {
      data: teams,
      timestamp: Date.now()
    };

    return teams;
  } catch (error) {
    console.error('Error in fetchMlbTeams:', error);
    throw error;
  }
}

/**
 * Fetches MLB games from cache or database
 * @param {boolean} [forceRefresh=false] - Force refresh from database
 * @returns {Promise<Game[]>} Array of MLB games
 */
export async function fetchMlbGames(forceRefresh = false): Promise<Game[]> {
  try {
    // Check memory cache first
    if (!forceRefresh && MLB_CACHE.games && MLB_CACHE.games.data && 
        Date.now() - MLB_CACHE.games.timestamp < CACHE_DURATION_MS) {
      console.log('Using cached MLB games data');
      return MLB_CACHE.games.data;
    }

    // Check Supabase cache next
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('id')
      .eq('key', 'mlb')
      .single();

    if (leagueError) {
      console.error('Error fetching MLB league:', leagueError);
      throw new Error('Failed to fetch MLB league data');
    }

    if (!leagueData) {
      throw new Error('MLB league not found');
    }

    // Fetch upcoming games from database
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        *,
        home_team:home_team_id(*),
        away_team:away_team_id(*)
      `)
      .eq('league_id', leagueData.id)
      .gt('game_date', new Date().toISOString())
      .order('game_date', { ascending: true })
      .limit(10);

    if (gamesError) {
      console.error('Error fetching MLB games:', gamesError);
      throw new Error('Failed to fetch MLB games');
    }

    // Update memory cache
    MLB_CACHE.games = {
      data: games,
      timestamp: Date.now()
    };

    return games;
  } catch (error) {
    console.error('Error in fetchMlbGames:', error);
    throw error;
  }
}

/**
 * Clears the MLB cache
 */
export function clearMlbCache() {
  MLB_CACHE.teams = null;
  MLB_CACHE.games = null;
  console.log('MLB cache cleared');
} 
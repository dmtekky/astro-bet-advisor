import { supabase } from '@/lib/supabase';
import { Sport } from '@/types';
import { Game, Team } from '@/types/supabase';

// Types are now imported from @/types/supabase

// Map your sport keys to The Odds API sport keys
const SPORT_KEYS: Record<string, string> = {
  nba: 'basketball_nba',
  mlb: 'baseball_mlb',
  nfl: 'americanfootball_nfl',
  nhl: 'icehockey_nhl',
  soccer: 'soccer_epl',
  tennis: 'tennis_atp',
  golf: 'golf_pga',
  ncaa: 'basketball_ncaab',
  mma: 'mma_mixed_martial_arts'
};

/**
 * Fetches games for a specific sport from The Odds API
 * @param sport - The sport key (e.g., 'nba', 'nfl')
 * @param daysFromNow - Number of days from now to fetch games for (default: 7)
 */
export const fetchGamesFromOddsAPI = async (sport: Sport, daysFromNow: number = 7): Promise<Game[]> => {
  try {
    const apiKey = process.env.REACT_APP_ODDS_API_KEY || '';
    if (!apiKey) {
      console.warn('No Odds API key found. Please set REACT_APP_ODDS_API_KEY environment variable.');
      return [];
    }

    const oddsApiSport = SPORT_KEYS[sport] || sport;
    const url = `https://api.the-odds-api.com/v4/sports/${oddsApiSport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
    }
    
    const games = await response.json();
    
    // Cache the games in Supabase for offline use
    await cacheGamesInSupabase(games, sport);
    
    return games;
  } catch (error) {
    console.error('Error fetching games from Odds API:', error);
    // Fall back to Supabase if API fails
    return fetchCachedGames(sport);
  }
};

/**
 * Caches games in Supabase for offline use
 */
const cacheGamesInSupabase = async (games: Game[], sport: Sport): Promise<void> => {
  try {
    const gamesToUpsert = games.map(game => ({
      id: game.id,
      sport,
      home_team: game.home_team,
      away_team: game.away_team,
      home_team_id: game.home_team_id,
      away_team_id: game.away_team_id,
      commence_time: game.commence_time,
      bookmakers: game.bookmakers,
      status: game.status || 'scheduled',
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('schedules')
      .upsert(gamesToUpsert, { onConflict: 'id' });

    if (error) {
      console.error('Error caching games in Supabase:', error);
    }
  } catch (error) {
    console.error('Error in cacheGamesInSupabase:', error);
  }
};

/**
 * Fetches cached games from Supabase
 */
const fetchCachedGames = async (sport: Sport): Promise<Game[]> => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('sport', sport)
      .gte('commence_time', new Date().toISOString())
      .order('commence_time', { ascending: true });

    if (error) throw error;
    
    // Transform the data to match the Game interface
    return (data || []).map(game => ({
      ...game,
      bookmakers: game.bookmakers || []
    }));
  } catch (error) {
    console.error('Error fetching cached games:', error);
    return [];
  }
};

/**
 * Fetches team standings for a specific sport
 */
export const fetchStandings = async (sport: Sport): Promise<Team[]> => {
  // First try to fetch from our database
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('sport', sport)
      .order('win_percentage', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data as Team[];
    }
    
    // If no data in our DB, fetch from external API
    return await fetchStandingsFromExternal(sport);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return [];
  }
};

/**
 * Fetches team standings from an external API
 */
const fetchStandingsFromExternal = async (sport: Sport): Promise<Team[]> => {
  // This would be replaced with actual API call to fetch standings
  // For now, return an empty array
  return [];
};

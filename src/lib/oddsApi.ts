import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Create a supabase client with the updated database types
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface OddsResponse {
  id?: string;
  sport_key: string;
  sport_title: string;
  commencing_at: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
  home_team_id?: string;
  away_team_id?: string;
  last_update?: string;
}

// Cache in memory to reduce Supabase calls
const ODDS_API_CACHE: { [key: string]: { data: OddsResponse[] | null; timestamp: number } } = {};

export async function fetchOdds(sport: string, forceRefresh = false): Promise<OddsResponse[]> {
  try {
    // Check memory cache first
    const cacheKey = `odds_${sport}`;
    const cachedData = ODDS_API_CACHE[cacheKey];
    
    // Return cached data if it exists and is less than 1 hour old
    if (!forceRefresh && cachedData && cachedData.data && Date.now() - cachedData.timestamp < 3600000) {
      console.log(`Using cached odds data for ${sport}`);
      return cachedData.data;
    }

    // Check Supabase cache next
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('cached_odds')
      .select('*')
      .eq('sport', sport)
      .order('last_update', { ascending: false })
      .limit(1);

    // If we have data in Supabase and it's less than 24 hours old, use it
    if (!forceRefresh && supabaseData && supabaseData.length > 0) {
      const lastUpdate = new Date(supabaseData[0].last_update);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 24) {
        console.log(`Using Supabase cached odds data for ${sport}, last updated ${hoursSinceUpdate.toFixed(1)} hours ago`);
        // Parse the JSON data from Supabase
        const parsedData = JSON.parse(supabaseData[0].data as string) as OddsResponse[];
        
        // Update memory cache
        ODDS_API_CACHE[cacheKey] = {
          data: parsedData,
          timestamp: Date.now()
        };
        
        return parsedData;
      }
    }

    // If we get here, we need to fetch from the API
    console.log(`Fetching fresh odds data for ${sport} from API`);
    const sportKey = getSportKey(sport);
    
    // Get upcoming games for the next 2 weeks
    const params = {
      apiKey: import.meta.env.VITE_THE_ODDS_API_KEY,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
      // No limit parameter to get all available games
    };

    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
      params,
    });

    console.log(`Remaining requests: ${response.headers['x-requests-remaining']}`);
    console.log(`Used requests: ${response.headers['x-requests-used']}`);

    const odds = response.data as OddsResponse[];
    
    // Update memory cache
    ODDS_API_CACHE[cacheKey] = {
      data: odds,
      timestamp: Date.now()
    };

    // Save to Supabase for persistence
    await saveOddsToSupabase(odds, sport);
    
    return odds;
  } catch (error) {
    console.error('Error fetching odds:', error);
    
    // If API call fails, try to use Supabase cache regardless of age
    try {
      const { data: fallbackData } = await supabase
        .from('cached_odds')
        .select('*')
        .eq('sport', sport)
        .order('last_update', { ascending: false })
        .limit(1);
        
      if (fallbackData && fallbackData.length > 0) {
        console.log(`Using fallback Supabase cached odds data for ${sport} due to API error`);
        return JSON.parse(fallbackData[0].data as string) as OddsResponse[];
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback data:', fallbackError);
    }
    
    throw error;
  }
}

function getSportKey(sport: string): string {
  // Map from our sport names to The Odds API sport keys
  const sportKeyMap: Record<string, string> = {
    'nba': 'basketball_nba',
    'nfl': 'americanfootball_nfl',
    'mlb': 'baseball_mlb',
    'soccer': 'soccer_epl', // Default to EPL
    'epl': 'soccer_epl',
    'laliga': 'soccer_spain_la_liga',
    'bundesliga': 'soccer_germany_bundesliga',
    'seriea': 'soccer_italy_serie_a',
    'uefa': 'soccer_uefa_european_championship',
    'worldcup': 'soccer_fifa_world_cup',
    'ncaab': 'basketball_ncaab',
    'ncaaf': 'americanfootball_ncaaf',
  };
  
  return sportKeyMap[sport.toLowerCase()] || sport;
}

async function saveOddsToSupabase(odds: OddsResponse[], sport: string) {
  try {
    // Save to cached_odds table for persistence
    const { error: cacheError } = await supabase
      .from('cached_odds')
      .upsert({
        id: `odds_${sport}`, // Use a consistent ID for upsert
        sport,
        data: JSON.stringify(odds) as any, // Cast to any to avoid type issues
        last_update: new Date().toISOString()
      });

    // Create betting odds records for each team in each game
    const bettingOdds = odds.flatMap((game) => {
      return game.bookmakers.flatMap((bookmaker) => {
        return bookmaker.markets[0].outcomes.map((outcome, index) => {
          const isHome = index === 0;
          return {
            bookmaker: bookmaker.title,
            odds: outcome.price,
            type: 'h2h',
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            game_id: `${game.sport_key}-${game.commencing_at}`,
            team_id: isHome ? game.home_team : game.away_team,
          };
        });
      });
    });

    await supabase
      .from('betting_odds')
      .insert(bettingOdds)
      .select();
  } catch (error) {
    console.error('Error saving odds to Supabase:', error);
  }
}

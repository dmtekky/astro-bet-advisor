import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

interface OddsResponse {
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
}

const ODDS_API_CACHE: { [key: string]: { data: OddsResponse[] | null; timestamp: number } } = {};

export async function fetchOdds(sport: string): Promise<OddsResponse[]> {
  try {
    // Check cache first
    const cacheKey = `odds_${sport}`;
    const cachedData = ODDS_API_CACHE[cacheKey];
    
    // Return cached data if it exists and is less than 1 hour old
    if (cachedData && cachedData.data && Date.now() - cachedData.timestamp < 3600000) {
      return cachedData.data;
    }

    const sportKey = getSportKey(sport);
    
    // For testing, limit to 5 games per sport
    const params = {
      apiKey: import.meta.env.VITE_THE_ODDS_API_KEY,
      regions: 'us',
      markets: 'h2h',
      oddsFormat: 'decimal',
      limit: 5
    };

    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
      params,
    });

    const odds = response.data as OddsResponse[];
    
    // Cache the data
    ODDS_API_CACHE[cacheKey] = {
      data: odds,
      timestamp: Date.now()
    };

    try {
      await saveOddsToSupabase(odds, sport);
    } catch (error) {
      console.error('Error saving odds to Supabase:', error);
    }

    return odds;
  } catch (error) {
    console.error('Error fetching odds:', error);
    // Return empty array instead of throwing error for better UX
    return [];
  }
}

function getSportKey(sport: string): string {
  const sportMap = {
    'nba': 'basketball_nba',
    'mlb': 'baseball_mlb',
    'nfl': 'americanfootball_nfl',
    'boxing': 'boxing',
  };
  return sportMap[sport.toLowerCase()];
}

async function saveOddsToSupabase(odds: OddsResponse[], sport: string) {
  try {
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

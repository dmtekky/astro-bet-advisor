import { supabase } from './supabase';
import type { Sport } from '@/types/sports';

export const fetchGames = async (sport: Sport['key']) => {
  try {
    // Map the sport key to match the format in the schedules table
    const sportMap: Record<string, string> = {
      'basketball_nba': 'nba',
      'baseball_mlb': 'mlb',
      'americanfootball_nfl': 'nfl',
      'boxing': 'boxing',
      'soccer': 'soccer',
      'americanfootball_ncaaf': 'ncaa'
    };

    const sportValue = sportMap[sport] || sport;

    console.log(`Fetching games for sport: ${sport} (mapped to: ${sportValue})`);
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('sport', sportValue)
      .order('commence_time', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
    
    console.log(`Fetched ${data.length} games for ${sport}`);
    
    // Transform the data to match the expected Game interface
    return data.map(game => {
      // Parse odds if it's a string
      let parsedOdds = 'N/A';
      try {
        if (typeof game.odds === 'string') {
          parsedOdds = JSON.parse(game.odds);
        } else if (game.odds) {
          parsedOdds = game.odds;
        }
      } catch (e) {
        console.warn('Error parsing odds:', e);
      }

      return {
        ...game,
        id: game.id,
        sport_key: sport,
        home_team: game.home_team,
        away_team: game.away_team,
        home_team_id: game.id + '_home', // Temporary ID since we don't have team IDs
        away_team_id: game.id + '_away', // Temporary ID since we don't have team IDs
        commence_time: game.commence_time,
        start_time: game.commence_time,
        status: game.status || 'scheduled',
        odds: parsedOdds,
        external_id: game.external_id,
        home_team_abbreviation: game.home_team_abbreviation || game.home_team?.substring(0, 3).toUpperCase(),
        away_team_abbreviation: game.away_team_abbreviation || game.away_team?.substring(0, 3).toUpperCase(),
        score_home: game.score_home,
        score_away: game.score_away,
        created_at: game.created_at,
        updated_at: game.updated_at
      };
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

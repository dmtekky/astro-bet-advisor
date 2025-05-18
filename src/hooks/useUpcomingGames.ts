import { useState, useEffect } from 'react';
import { Game, Sport } from '@/types';
import { fetchUpcomingGamesBySport, ScheduledGame } from '@/lib/supabase';

// Utility to safely map a string to the Sport type
const toSport = (sportStr: string): Sport | undefined => {
  const validSports: Sport[] = ['nba', 'mlb', 'nfl', 'boxing', 'soccer', 'ncaa'];
  if (validSports.includes(sportStr as Sport)) {
    return sportStr as Sport;
  }
  return undefined;
};

export const useUpcomingGames = (sport: string) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        // Fetch upcoming games from Supabase
        const scheduledGames: ScheduledGame[] = await fetchUpcomingGamesBySport(sport);
        // Map ScheduledGame to Game type
        const games: Game[] = scheduledGames
          .map((g) => {
            const sport = toSport(g.sport);
            if (!sport) return null; // skip invalid sports
            return {
              id: g.id.toString(),
              sport,
              home_team_id: g.home_team,
              away_team_id: g.away_team,
              start_time: g.start_time,
              status: 'scheduled', // or g.status if available
              external_id: g.id.toString(),
            };
          })
          .filter((g): g is Game => g !== null);
        setGames(games);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [sport]);

  return { games, loading, error };
};

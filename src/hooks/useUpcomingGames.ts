import { useState, useEffect } from 'react';
import { Game } from '@/types';

export const useUpcomingGames = (sport: string) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        // Calculate date range (next 16 days)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 16);
        
        // Format dates as YYYY-MM-DD
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        // TODO: Replace with actual API call
        // This is a mock implementation
        const mockGames: Game[] = [
          // Today
          {
            id: '1',
            sport: 'basketball',
            home_team_id: 'lal',
            away_team_id: 'gsw',
            start_time: new Date().toISOString(),
            status: 'scheduled',
            external_id: '1'
          },
          // Tomorrow
          {
            id: '2',
            sport: 'basketball',
            home_team_id: 'bos',
            away_team_id: 'mia',
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            external_id: '2'
          },
          // Day after tomorrow
          {
            id: '3',
            sport: 'basketball',
            home_team_id: 'lal',
            away_team_id: 'bkn',
            start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            external_id: '3'
          },
        ];
        
        // Filter by sport and date range
        const filteredGames = mockGames.filter(game => 
          game.sport === sport && 
          new Date(game.start_time) >= startDate && 
          new Date(game.start_time) <= endDate
        );
        
        setGames(filteredGames);
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

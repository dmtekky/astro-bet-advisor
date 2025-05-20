import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isAfter, subHours } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Game, GameWithTeams, GamesByDate, Team, SportKey } from '@/types/dashboard';

const fetchTeams = async (sport: string): Promise<Record<string, Team>> => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('sport', sport.toUpperCase());

  if (error) {
    console.error('Error fetching teams:', error);
    return {};
  }

  const teamsMap: Record<string, Team> = {};
  data?.forEach((team: Team) => {
    teamsMap[team.id] = team;
  });
  
  return teamsMap;
};

const fetchGames = async (sport: string): Promise<Game[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('sport', sport.toUpperCase())
    .order('commence_time', { ascending: true });

  if (error) {
    console.error('Error fetching games:', error);
    return [];
  }

  return data || [];
};

export const useGames = (sport: string) => {
  // Fetch teams
  const { data: teams = {}, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', sport],
    queryFn: () => fetchTeams(sport),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!sport,
  });
  
  // Fetch games
  const { 
    data: games = [], 
    isLoading: isLoadingGames, 
    error, 
    refetch 
  } = useQuery<Game[], Error>({
    queryKey: ['games', sport],
    queryFn: () => fetchGames(sport),
    enabled: !!sport && !isLoadingTeams,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (games) => {
      const now = subHours(new Date(), 4); // Show games from last 4 hours
      
      return games
        .filter(game => {
          try {
            const gameTime = parseISO(game.commence_time || game.start_time || game.game_time);
            return isAfter(gameTime, now);
          } catch (e) {
            console.warn('Invalid game time:', game);
            return false;
          }
        })
        .map(game => ({
          ...game,
          home_team_data: game.home_team_id ? teams[game.home_team_id] : {
            id: game.home_team_id || '',
            name: game.home_team,
          },
          away_team_data: game.away_team_id ? teams[game.away_team_id] : {
            id: game.away_team_id || '',
            name: game.away_team,
          },
        }));
    }
  });

  // Group games by date
  const gamesByDate = React.useMemo(() => {
    const groups: GamesByDate = {};
    
    games.forEach((game: GameWithTeams) => {
      try {
        const gameDate = format(
          parseISO(game.commence_time || game.start_time || game.game_time), 
          'yyyy-MM-dd'
        );
        
        if (!groups[gameDate]) {
          groups[gameDate] = [];
        }
        
        // Only include games where we have team data
        if (game.home_team_data && game.away_team_data) {
          groups[gameDate].push(game);
        }
      } catch (e) {
        console.warn('Error processing game:', game);
      }
    });
    
    return groups;
  }, [games]);

  return {
    games,
    gamesByDate,
    isLoading: isLoadingTeams || isLoadingGames,
    error,
    refetch,
  };
};

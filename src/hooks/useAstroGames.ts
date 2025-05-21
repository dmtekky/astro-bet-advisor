import { useMemo } from 'react';
import { useGames } from './useGames';
import { useAstroData } from './useAstroData';
import { Game, GameWithTeams } from '@/types/dashboard';

// Utility functions for astrological calculations
const calculateAstroEdge = (game: Game, astroData: any): number => {
  if (!astroData) return 50;
  
  let score = 50; // Base score
  
  // Moon phase influence
  if (astroData.moon?.phase === 'Full Moon' || astroData.moon?.phase === 'New Moon') {
    score += 10; // Favor new and full moons
  }
  
  // Mercury retrograde influence
  if (astroData.mercury?.retrograde) {
    score -= 5; // Mercury retrograde penalty
  }
  
  // Team name influence (pseudo-astrological randomness)
  const homeTeamName = game.home_team || '';
  const awayTeamName = game.away_team || '';
  const homeTeamHash = homeTeamName.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const awayTeamHash = awayTeamName.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Add some "astrological" randomness based on team names
  score += (homeTeamHash - awayTeamHash) % 21;
  
  return Math.max(0, Math.min(100, score));
};

const getAstroInfluence = (edge: number): string => {
  if (edge >= 70) return 'Strong positive astrological influence';
  if (edge >= 60) return 'Favorable astrological conditions';
  if (edge <= 30) return 'Strong negative astrological influence';
  if (edge <= 40) return 'Challenging astrological conditions';
  return 'Neutral astrological influence';
};

export const useAstroGames = (sport: string) => {
  // Get game data from useGames hook
  const { games, gamesByDate, isLoading: isLoadingGames, error, refetch } = useGames(sport);
  
  // Get current date for astrological data
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Get astrological data
  const { astroData, loading: isLoadingAstro } = useAstroData(dateStr);
  
  // Enhance games with astrological data
  const gamesWithAstro = useMemo(() => {
    if (!games || !astroData) return [];
    
    return (games as Game[]).map(game => {
      const astroEdge = calculateAstroEdge(game, astroData);
      return {
        ...game,
        astroEdge,
        astroInfluence: getAstroInfluence(astroEdge)
      };
    });
  }, [games, astroData]);
  
  // Enhance gamesByDate with astrological data
  const gamesByDateWithAstro = useMemo(() => {
    if (!gamesByDate || !astroData) return {};
    
    const result = { ...gamesByDate };
    
    // Add astrological data to each game in each date group
    Object.keys(result).forEach(date => {
      result[date] = result[date].map(game => {
        const astroEdge = calculateAstroEdge(game, astroData);
        return {
          ...game,
          astroEdge,
          astroInfluence: getAstroInfluence(astroEdge)
        };
      });
    });
    
    return result;
  }, [gamesByDate, astroData]);
  
  return {
    games: gamesWithAstro,
    gamesByDate: gamesByDateWithAstro,
    isLoading: isLoadingGames || isLoadingAstro,
    error,
    refetch,
    astroData
  };
};

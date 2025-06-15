import { Game } from '@/types';
import { ExtendedTeam } from '@/features/dashboard/types';

// Type for a single game group by date
export interface GameGroup {
  date: Date;
  games: Game[];
}

export interface UpcomingGamesProps {
  /**
   * Array of game groups, each containing games for a specific date
   */
  gameGroups: GameGroup[];
  
  /**
   * Whether the games are currently loading
   */
  isLoading: boolean;
  
  /**
   * Callback when "View All Games" button is clicked
   */
  onViewAllGames: () => void;
  
  /**
   * Function to find team by ID
   */
  findTeam: (teamId: string) => ExtendedTeam | undefined;
  
  /**
   * Function to get game prediction data
   */
  getGamePrediction: (game: Game, homeTeam: ExtendedTeam, awayTeam: ExtendedTeam) => any;
  
  /**
   * Function to transform hook data to game prediction data
   */
  transformHookDataToGamePredictionData: (data: any) => any;
  
  /**
   * Astrological data for predictions
   */
  astroData: any;
}

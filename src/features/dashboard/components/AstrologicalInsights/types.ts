// Import only what's actually exported from gamePredictions
import { GamePredictionData } from '@/types/gamePredictions';

// Local type definitions for CelestialBody and Aspect since they're not exported
interface CelestialBody {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  sign: string;
  element: string;
  modality: string;
  house: number;
  retrograde: boolean;
  position: number;
}

interface Aspect {
  body1: string;
  body2: string;
  aspect: string;
  orb: number;
  exact: boolean;
  influence: number;
}
import { Game } from '@/types';

export interface AstrologicalInsight {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface AstrologicalInsightsProps {
  /**
   * The game for which to show astrological insights
   */
  game: Game | null;
  
  /**
   * The home team
   */
  homeTeam: any | null; // Using any to match the current implementation
  
  /**
   * The away team
   */
  awayTeam: any | null; // Using any to match the current implementation
  
  /**
   * Whether the data is currently loading
   */
  isLoading: boolean;
  
  /**
   * The astrological data to display
   */
  astroData?: GamePredictionData | null;
  
  /**
   * Function to get the game prediction
   */
  getGamePrediction: (game: Game, homeTeam: any, awayTeam: any) => any;
  
  /**
   * Function to transform hook data to game prediction data
   */
  transformHookDataToGamePredictionData: (data: any) => any;
}

export interface AspectInfluence {
  description: string;
  strength: number;
  area?: string[];
}

export interface AstrologyInfluence {
  name: string;
  impact: number;
  description: string;
  icon?: React.ReactNode;
}

export interface ElementsDistribution {
  fire: number;
  earth: number;
  water: number;
  air: number;
}

export interface ModalBalance {
  cardinal: number;
  fixed: number;
  mutable: number;
}

export interface ElementalBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
}

/**
 * Type definitions for astrology components
 */

import { AstroData } from '../../../types/astrology';

// Birth data structure
export interface BirthDataProps {
  date: string;
  time: string;
  timeUnknown: boolean;
  city: string;
}

// Props for the main NatalChartProfile component
export interface NatalChartProfileProps {
  birthData?: BirthDataProps;
  userId?: string;
  onDataLoad?: (data: {
    natalChartData?: any;
    planetaryCounts?: number[];
    planetsPerSign?: Record<string, string[]>;
  }) => void;
  natalChartData?: any;
  planetaryCounts?: number[];
  planetsPerSign?: Record<string, string[]>;
  className?: string;
  interpretations?: AstroData | null;
}

// Props for the NatalChart component
export interface NatalChartProps {
  astroData: any;
  isLoading?: boolean;
  error?: Error | null;
  onDownload?: () => Promise<void>;
  onShare?: () => Promise<void>;
  isDownloading?: boolean;
  width?: number;
  height?: number;
  onError?: (error: Error) => void;
}

// Props for the PlanetaryCountChart component
export interface PlanetaryCountChartProps {
  planetCounts: number[] | null;
  planetsPerSign: Record<string, string[]> | null;
  isLoading: boolean;
  error: Error | null;
  onDownload: () => Promise<void>;
  onShare: () => Promise<void>;
  isDownloading: boolean;
  className?: string;
}

// Props for placeholder components
export interface ChartPlaceholderProps {
  showForm?: boolean;
  setShowForm?: (show: boolean) => void;
  propBirthData?: BirthDataProps;
}

// User data structure from Supabase
export interface UserData {
  id: string;
  birth_date?: string;
  birth_time?: string;
  birth_city?: string;
  birth_time_unknown?: boolean;
  planetary_data?: any;
  planetary_count?: number[];
  planets_per_sign?: Record<string, string[]>;
  created_at?: string;
  updated_at?: string;
}

// Chart.js instance type
export interface ChartInstance {
  destroy: () => void;
}

// AstroChart instance type
export interface AstroChartInstance {
  radix: (data: {
    planets: Record<string, number[]>;
    cusps: number[];
  }) => void;
  destroy?: () => void;
}

// Zodiac sign names
export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Planet names for reference
export const PLANET_NAMES = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];

export type { AstroData, AstroDataResponse, MoonPhaseInfo } from './app.types.js';
import type { AstroData } from './app.types.js';
import { BirthData } from './profiles.js';

// Birth data structure
export interface BirthDataProps {
  date: string;
  time: string;
  timeUnknown: boolean;
  city: string;
}

// Props for the main NatalChartProfile component
export interface NatalChartProfileProps {
  birthData?: BirthData | null;
  userId?: string;
  onDataLoad?: (
    data: {
      natalChartData?: any;
      planetaryCounts?: number[];
      planetsPerSign?: Record<string, string[]>;
    }
  ) => void;
  natalChartData?: any;
  planetaryCounts?: Record<string, number> | null;
  planetsPerSign?: Record<string, string[]> | null;
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
  radix: (
    data: {
      planets: Record<string, number[]>;
      cusps: number[];
    }
  ) => void;
  destroy?: () => void;
}

import { ZODIAC_SIGNS, PLANET_NAMES } from '../lib/constants.js';

export type ZodiacSign = typeof ZODIAC_SIGNS[number];
export type PlanetName = typeof PLANET_NAMES[number];

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';
export type AspectType = 'Conjunction' | 'Opposition' | 'Trine' | 'Square' | 'Sextile' | 'Quincunx' | 'Semi-Square' | 'Semi-Sextile';

export interface CelestialBody {
  name: PlanetName | 'Ascendant' | 'Midheaven' | 'North Node' | 'South Node';
  sign: ZodiacSign;
  degree: number;
  house: number;
  retrograde: boolean;
}

export interface Dignity {
  planet: PlanetName;
  sign: ZodiacSign;
  type: 'Exaltation' | 'Fall' | 'Detriment' | 'Rulership';
}

export type HouseSystem = 'Placidus' | 'Koch' | 'Whole Signs'; // Example house systems

export interface Aspect {
  planet1: PlanetName | 'Ascendant' | 'Midheaven';
  planet2: PlanetName | 'Ascendant' | 'Midheaven';
  type: AspectType;
  orb: number;
  isMajor: boolean;
}

export interface AspectPattern {
  name: string;
  planets: PlanetName[];
  description: string;
}

export interface ElementalBalance {
  fire: { score: number; percentage: number };
  earth: { score: number; percentage: number };
  air: { score: number; percentage: number };
  water: { score: number; percentage: number };
}

export interface ModalBalance {
  cardinal: { score: number; percentage: number };
  fixed: { score: number; percentage: number };
  mutable: { score: number; percentage: number };
}

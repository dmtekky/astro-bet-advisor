/**
 * Advanced astrology data types for the Astro Bet Advisor app
 */

export type ZodiacSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' 
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
export type HouseSystemType = 'Placidus' | 'Koch' | 'Equal' | 'Whole';
export type PlanetName = 
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';

export interface CelestialBody {
  name: string;
  longitude: number;
  latitude?: number;
  distance?: number;  // from Earth in AU
  speed: number;      // daily motion
  sign: ZodiacSign;
  house?: number;
  dignity?: Dignity;
  retrograde: boolean;
  declination?: number;
  rightAscension?: number;
  phase?: string | number;     // for Moon and inner planets (string for name, number for value)
  phaseValue?: number;         // numeric phase value (0-1)
  phase_name?: string;         // phase name (e.g., 'New Moon')
  magnitude?: number;          // brightness
  degree: number;              // degree within the sign
  minute?: number;             // arcminute within the degree
  illumination?: number;        // for Moon (0-1)
  [key: string]: any;          // Allow additional properties
}

export interface Dignity {
  score: number;  // -5 to +5
  status: {
    ruler: boolean;
    exaltation: boolean;
    detriment: boolean;
    fall: boolean;
    triplicity?: boolean;
    term?: boolean;
    face?: boolean;
  };
  essentialScore?: number;
  accidentalScore?: number;
  mutualReception?: string[]; // planets in mutual reception
}

export interface HouseSystem {
  system: HouseSystemType;
  cusps: number[];  // 12 house cusps
  angles: {
    asc: number;      // Ascendant
    mc: number;       // Midheaven
    dsc: number;      // Descendant
    ic: number;       // Imum Coeli
  };
  intercepted?: ZodiacSign[]; // signs intercepted in houses
}

export interface Aspect {
  from: string;     // planet 1
  to: string;       // planet 2
  type: AspectType;
  exact?: boolean;  // if applying/separating
  orb: number;      // degrees from exact
  influence: {
    description: string;
    strength: number;  // 0-1
    area?: string[];   // life areas affected
  };
}

export interface AspectPattern {
  type: 'Grand Trine' | 'T-Square' | 'Grand Cross' | 'Kite' | 'Mystic Rectangle';
  planets: string[];  // involved planets
  signs: ZodiacSign[];    // involved signs
  elements: Element[]; // involved elements
  influence: string;  // interpretation
  strength: number;   // 0-1 scale
}

export interface ElementalBalance {
  fire: { score: number; planets: string[] };
  earth: { score: number; planets: string[] };
  air: { score: number; planets: string[] };
  water: { score: number; planets: string[] };
}

export interface ModalBalance {
  cardinal: { score: number; planets: string[] };
  fixed: { score: number; planets: string[] };
  mutable: { score: number; planets: string[] };
}

export interface AstroData {
  // Calculation metadata
  date: string;
  queryTime: string;
  observer?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    timezone: string;
  };
  
  // Core data
  sun: CelestialBody;
  moon: CelestialBody;
  planets: Record<string, CelestialBody>;
  houses?: HouseSystem;
  
  // Analysis
  aspects: Aspect[];
  patterns?: AspectPattern[];
  dignities?: Record<string, Dignity>;
  elements?: ElementalBalance;
  modalities?: ModalBalance;
  
  // Extra insights
  moonPhase: {
    name: string;
    value: number; // 0-1
    illumination: number; // 0-1
  };
}

// For the API
export interface AstroDataResponse {
  date: string;
  query_time: string;
  observer?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    timezone: string;
  };
  sun: {
    sign: string;
    longitude: number;
    degree: number;
    minute?: number;
    retrograde?: boolean;
  };
  moon: {
    sign: string;
    longitude: number;
    phase: number;
    phase_name: string;
    degree: number;
    minute?: number;
    retrograde?: boolean;
  };
  positions: Array<{
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
    minute?: number;
    retrograde?: boolean;
  }>;
  // Optional structured planetary data
  planets?: Record<string, {
    name: string;
    longitude: number;
    sign: string;
    degree: number;
    retrograde?: boolean;
    speed?: number;
    house?: number;
  }>;
  aspects: Array<{
    name: string;
    aspect: string;
    orb: number;
    influence: string;
  }>;
  retrograde: Array<{
    planet: string;
    isRetrograde: boolean;
    influence: string;
  }>;
  houses?: {
    system: string;
    cusps: number[];
    angles: {
      asc: number;
      mc: number;
      dsc: number;
      ic: number;
    };
  };
  elements?: {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
  };
  modalities?: {
    cardinal: { score: number; planets: string[] };
    fixed: { score: number; planets: string[] };
    mutable: { score: number; planets: string[] };
  };
  dignities?: Record<string, {
    score: number;
    status: string;
    description: string;
  }>;
  patterns?: Array<{
    type: string;
    planets: string[];
    signs?: string[];
    elements?: string[];
    influence: string;
    strength: number;
  }>;
}

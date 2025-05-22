/**
 * Enhanced Astrological Data Hook
 * 
 * This hook fetches and transforms astrological data from the API,
 * providing a clean, typed interface for components.
 */
import { useMemo, useCallback } from 'react';
import useSWR from 'swr';
import type { AspectType, CelestialBody, ZodiacSign } from '../types/astrology';

// Base URL for API requests
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return '/api/unified-astro';
  
  // In production (Vercel), use relative URL
  if (window.location.hostname !== 'localhost') {
    return '/api/unified-astro';
  }
  
  // In development, use the local API server
  return 'http://localhost:3001/api/unified-astro';
};

const API_BASE_URL = getApiBaseUrl();

// API Response type (matches the structure returned by the API)
interface ApiResponse {
  // Sidereal specific properties
  sidereal?: boolean;
  ayanamsa?: number;
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
    speed?: number;
    house?: number;
  };
  moon: {
    sign: string;
    longitude: number;
    phase: number;
    phase_name: string;
    degree: number;
    minute?: number;
    retrograde?: boolean;
    illumination?: number;
    speed?: number;
    house?: number;
  };
  mercury?: {
    sign: string;
    longitude: number;
    degree: number;
    minute?: number;
    retrograde?: boolean;
    speed?: number;
    house?: number;
  };
  positions?: Array<{
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
    minute?: number;
    retrograde?: boolean;
    speed?: number;
    house?: number;
  }>;
  aspects?: Array<{
    name: string;
    aspect: string;
    orb: number;
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
  retrograde?: Array<{
    planet: string;
    isRetrograde: boolean;
    influence: string;
  }>;
  planets?: Record<string, {
    name: string;
    longitude: number;
    sign: string;
    degree: number;
    retrograde?: boolean;
    speed?: number;
    house?: number;
  }>;
  current_hour?: {
    ruler: string;
    influence: string;
    sign: string;
    is_positive: boolean;
  };
  next_event?: {
    name: string;
    date: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
    type: string;
    sign: string;
  };
  lunar_nodes?: {
    north_node: {
      sign: string;
      degree: number;
      house: number;
    };
    south_node: {
      sign: string;
      degree: number;
      house: number;
    };
    next_transit: {
      type: string;
      sign: string;
      date: string;
      description: string;
    };
    karmic_lessons: string[];
  };
}

// Our transformed data model
interface AstroData {
  sidereal?: boolean;
  ayanamsa?: number;
  date: string;
  queryTime: string;
  observer?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    timezone: string;
  };
  sun: CelestialBody;
  moon: CelestialBody & {
    phase?: string | number;
    phaseValue?: number;
    phase_name?: string;
    illumination?: number;
  };
  mercury?: CelestialBody;
  current_hour?: {
    ruler: string;
    influence: string;
    sign: string;
    is_positive: boolean;
  };
  next_event?: {
    name: string;
    date: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
    type: string;
    sign: string;
  };
  lunar_nodes?: {
    north_node: {
      sign: string;
      degree: number;
      house: number;
    };
    south_node: {
      sign: string;
      degree: number;
      house: number;
    };
    next_transit: {
      type: string;
      sign: string;
      date: string;
      description: string;
    };
    karmic_lessons: string[];
  };
  planets: Record<string, CelestialBody>;
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
  aspects: Record<string, string>;
  aspectsList: Array<{
    from: string;
    to: string;
    type: AspectType;
    orb: number;
    influence: {
      description: string;
      strength: number;
    };
  }>;
  patterns?: Array<{
    type: string;
    planets: string[];
    signs?: string[];
    elements?: string[];
    influence: string;
    strength: number;
  }>;
  dignities?: Record<string, {
    score: number;
    status: string;
    description: string;
  }>;
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  modalities: {
    cardinal: number;
    fixed: number;
    mutable: number;
  };
  // For debugging - positions array from the API
  positions?: Array<{
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
    retrograde?: boolean;
  }>;
}

// Return type for the hook
interface UseAstroDataReturn {
  astroData: AstroData | null;
  loading: boolean;
  error: Error | null;
  refreshData: () => void;
}

// Fetch function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Get icon for zodiac sign (helper function)
const getZodiacIcon = (sign: string): string => {
  const signMap: Record<string, string> = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓'
  };
  return signMap[sign.toLowerCase()] || '?';
};

/**
 * Hook to fetch and transform astrological data
 * @param dateParam - Date to get data for, defaults to current date
 * @returns Astrological data, loading state, and error
 */
export const useAstroData = (dateParam: Date | string = new Date()): UseAstroDataReturn => {
  // Format date as YYYY-MM-DD
  const dateStr = typeof dateParam === 'string' 
    ? dateParam 
    : dateParam.toISOString().split('T')[0];

  // Fetch data from API
  const { data: apiData, error, isLoading, mutate } = useSWR<ApiResponse>(
    `${API_BASE_URL}?date=${dateStr}&sidereal=true`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: true,
      dedupingInterval: 3600000, // 1 hour
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      }
    }
  );

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    mutate();
  }, [mutate]);

  // Console log for debugging
  console.log('Sidereal API Response:', { 
    apiData: {
      sun: apiData?.sun,
      moon: apiData?.moon,
      sidereal: apiData?.sidereal,
      ayanamsa: apiData?.ayanamsa,
      date: apiData?.date,
      planets: apiData?.planets,
      positions: apiData?.positions?.filter((p: any) => p.planet.toLowerCase() === 'sun')
    }, 
    error, 
    isLoading 
  });
  
  // Log the full API URL being called
  console.log('API URL:', `${API_BASE_URL}?date=${dateStr}&sidereal=true`);

  // Transform API data to our internal model
  const transformedData = useMemo((): AstroData | null => {
    if (!apiData) return null;

    try {
      console.log('Raw API Data:', JSON.stringify(apiData, null, 2));
      
      // Extract necessary data
      const { 
        sun, 
        moon, 
        mercury,
        positions, 
        aspects, 
        houses, 
        elements, 
        modalities, 
        dignities, 
        patterns,
        current_hour,
        next_event,
        lunar_nodes,
        sidereal,
        ayanamsa,
        planets
      } = apiData;

      console.log('Sidereal mode:', sidereal, 'Ayanamsa:', ayanamsa);
      console.log('Sun data:', sun);
      console.log('Planets data:', planets);

      // Create planetary data
      const planetData: Record<string, CelestialBody> = {};
      
      // IMPORTANT: First priority - use planets object from API
      if (planets && typeof planets === 'object') {
        console.log('Processing planets from API planets object');
        Object.entries(planets).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            const planetKey = key.toLowerCase();
            console.log(`Adding planet ${planetKey} from planets object:`, value);
            planetData[planetKey] = {
              name: value.name || key,
              longitude: value.longitude || 0,
              sign: (value.sign || 'Aries') as ZodiacSign,
              degree: value.degree || 0,
              retrograde: Boolean(value.retrograde),
              speed: value.speed || 1,
              house: value.house || (houses ? Math.floor((value.longitude || 0) / 30) % 12 + 1 : undefined)
            };
          }
        });
      }
      
      // Second priority - use positions array
      if (positions && Array.isArray(positions)) {
        console.log('Processing planets from positions array');
        positions.forEach(p => {
          if (p && typeof p === 'object') {
            const planetKey = (p.planet || '').toLowerCase();
            // Only add if not already added from planets object
            if (!planetData[planetKey]) {
              console.log(`Adding planet ${planetKey} from positions array:`, p);
              planetData[planetKey] = {
                name: p.planet,
                longitude: p.longitude || 0,
                sign: (p.sign || 'Aries') as ZodiacSign,
                degree: p.degree || 0,
                retrograde: Boolean(p.retrograde),
                speed: p.speed || 0,
                house: p.house || (houses ? Math.floor((p.longitude || 0) / 30) % 12 + 1 : undefined)
              };
            }
          }
        });
      }

      // Third priority - use direct sun/moon objects if not already added
      if (sun && !planetData.sun) {
        console.log('Adding Sun from direct sun object:', sun);
        planetData.sun = {
          name: 'Sun',
          longitude: sun.longitude || 0,
          sign: (sun.sign || 'Aries') as ZodiacSign,
          degree: sun.degree || 0,
          retrograde: Boolean(sun.retrograde),
          speed: sun.speed || 0.9833, // Average speed of the Sun in degrees per day
          house: sun.house || 1 // Default house
        };
        
        // If we have houses, calculate the house position
        if (houses && houses.cusps?.length > 0) {
          const sunLongitude = sun.longitude || 0;
          // Find which house the Sun is in
          for (let i = 0; i < 12; i++) {
            const cusp1 = houses.cusps[i];
            const cusp2 = houses.cusps[(i + 1) % 12];
            
            // Handle the 12th house (crosses 360/0 degrees)
            if (i === 11 && cusp1 > cusp2) {
              if (sunLongitude >= cusp1 || sunLongitude < cusp2) {
                planetData.sun.house = i + 1;
                break;
              }
            } else if (sunLongitude >= cusp1 && sunLongitude < cusp2) {
              planetData.sun.house = i + 1;
              break;
            }
          }
        }
      }
      
      // Final check on Sun data
      console.log('Final Sun data:', planetData.sun);

      // Add moon data if not already added
      if (moon && !planetData.moon) {
        console.log('Adding Moon from direct moon object:', moon);
        planetData.moon = {
          name: 'Moon',
          longitude: moon.longitude || 0,
          sign: (moon.sign || 'Cancer') as ZodiacSign,
          degree: moon.degree || 0,
          retrograde: Boolean(moon.retrograde),
          speed: moon.speed || 13, // Moon moves about 13 degrees per day
          house: moon.house || (houses ? Math.floor((moon.longitude || 0) / 30) % 12 + 1 : undefined)
        };
      }

      // Add mercury data if not already added
      if (mercury && !planetData.mercury) {
        console.log('Adding Mercury from direct mercury object:', mercury);
        planetData.mercury = {
          name: 'Mercury',
          longitude: mercury.longitude || 0,
          sign: (mercury.sign || 'Gemini') as ZodiacSign,
          degree: mercury.degree || 0,
          retrograde: Boolean(mercury.retrograde),
          speed: mercury.speed || 1,
          house: mercury.house || (houses ? Math.floor((mercury.longitude || 0) / 30) % 12 + 1 : undefined)
        };
      }

      // Create aspects map (for backward compatibility)
      const aspectsMap: Record<string, string> = {};
      
      // Process aspects into more usable structure
      const aspectsList = (Array.isArray(aspects) ? aspects : []).map(a => {
        if (!a || typeof a !== 'object') return null;
        
        const parts = (a.name || '').split(' ');
        const from = parts[0] || 'Sun';
        const aspectType = (parts[1] || 'conjunction').toLowerCase() as AspectType;
        const to = parts[2] || 'Moon';
        
        // Add to aspects map for backward compatibility
        aspectsMap[`${from.toLowerCase()}_${to.toLowerCase()}`] = aspectType;
        
        return {
          from,
          to,
          type: aspectType,
          orb: typeof a.orb === 'number' ? a.orb : 0,
          influence: {
            description: a.influence || 'No description available',
            strength: 0.8 // Default value
          }
        };
      }).filter(Boolean) as Array<{
        from: string;
        to: string;
        type: AspectType;
        orb: number;
        influence: { description: string; strength: number };
      }>;

      // Final debug check of the planetary data
      console.log('Final planetary data:', {
        sun: planetData.sun,
        moon: planetData.moon,
        mercury: planetData.mercury
      });
      
      // Return the transformed data
      return {
        sidereal,
        ayanamsa,
        date: apiData.date,
        queryTime: apiData.query_time,
        observer: apiData.observer,
        sun: planetData.sun,
        moon: {
          ...planetData.moon,
          phase: moon?.phase,
          phaseValue: moon?.phase,
          phase_name: moon?.phase_name,
          illumination: moon?.illumination
        },
        mercury: planetData.mercury,
        planets: planetData,
        houses: houses ? {
          system: houses.system || 'placidus',
          cusps: Array.isArray(houses.cusps) ? houses.cusps : Array(12).fill(0).map((_, i) => i * 30),
          angles: houses.angles || {
            asc: 0,
            mc: 90,
            dsc: 180,
            ic: 270
          }
        } : undefined,
        aspects: aspectsMap,
        aspectsList: aspectsList,
        patterns: apiData.patterns,
        dignities: apiData.dignities,
        elements: {
          fire: elements?.fire?.score || 0,
          earth: elements?.earth?.score || 0,
          air: elements?.air?.score || 0,
          water: elements?.water?.score || 0
        },
        modalities: {
          cardinal: modalities?.cardinal?.score || 0,
          fixed: modalities?.fixed?.score || 0,
          mutable: modalities?.mutable?.score || 0
        },
        current_hour: apiData.current_hour,
        next_event: apiData.next_event,
        lunar_nodes: apiData.lunar_nodes,
        // Add positions array for debugging
        positions: apiData.positions
      };
    } catch (error) {
      console.error('Error transforming astrological data:', error);
      return null;
    }
  }, [apiData]);

  return {
    astroData: transformedData,
    loading: isLoading,
    error: error as Error,
    refreshData
  };
};

export default useAstroData;

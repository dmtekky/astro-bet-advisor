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
  if (typeof window === 'undefined') return '/api/astro-enhanced';
  
  // In production (Vercel), use relative URL
  if (window.location.hostname !== 'localhost') {
    return '/api/astro-enhanced';
  }
  
  // In development, use the local API server
  return 'http://localhost:3001/api/astro-enhanced';
};

const API_BASE_URL = getApiBaseUrl();

// API Response type (matches the structure returned by the API)
interface ApiResponse {
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
    illumination?: number;
  };
  mercury?: {
    sign: string;
    longitude: number;
    degree: number;
    minute?: number;
    retrograde?: boolean;
    speed?: number;
  };
  positions: Array<{
    planet: string;
    longitude: number;
    sign: string;
    degree: number;
    minute?: number;
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
export interface AstroData {
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
  aspects: Record<string, string>; // For backward compatibility
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
}

// Return type for the hook
export interface UseAstroDataReturn {
  astroData: AstroData | null;
  loading: boolean;
  error: Error | null;
  refreshData: () => void;
}

// Fetch function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API request failed with status ${res.status}`);
  }
  return res.json() as Promise<ApiResponse>;
};

// Get icon for zodiac sign (helper function)
const getZodiacIcon = (sign: string): string => {
  const icons: Record<string, string> = {
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓',
  };
  return icons[sign] || '✨';
};

/**
 * Hook to fetch and transform astrological data
 * @param dateParam - Date to get data for, defaults to current date
 * @returns Astrological data, loading state, and error
 */
export function useAstroData(dateParam: Date | string = new Date()): UseAstroDataReturn {
  // Format date parameter consistently
  const dateStr = useMemo(() => {
    if (dateParam instanceof Date) {
      return dateParam.toISOString().split('T')[0];
    } else if (typeof dateParam === 'string') {
      const match = dateParam.match(/^\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, [dateParam]);

  // Fetch data from API
  const { data: apiData, error, isLoading, mutate } = useSWR<ApiResponse>(
    `${API_BASE_URL}?date=${dateStr}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: true,
      dedupingInterval: 3600000, // 1 hour - planetary data doesn't change quickly
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 1000);
      },
    }
  );

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    mutate();
  }, [mutate]);

  // Console log for debugging
  console.log('API Response:', { apiData, error, isLoading });

  // Transform API data to our internal model
  const transformedData = useMemo((): AstroData | null => {
    if (!apiData) return null;

    try {
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
        lunar_nodes
      } = apiData;

      // Create planetary data
      const planetData: Record<string, CelestialBody> = {};
      
      // Add all planets from positions
      if (positions && Array.isArray(positions)) {
        positions.forEach(p => {
          if (p && typeof p === 'object') {
            const planetKey = (p.planet || '').toLowerCase();
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
        });
      }


      // Ensure we have sun and moon data
      if (sun) {
        planetData.sun = {
          name: 'Sun',
          longitude: sun.longitude || 0,
          sign: (sun.sign || 'Aries') as ZodiacSign,
          degree: sun.degree || 0,
          retrograde: false,
          speed: 1,
          house: houses ? Math.floor((sun.longitude || 0) / 30) % 12 + 1 : undefined
        };
      }


      if (moon) {
        // Create a moon object with all required properties
        const moonData: CelestialBody = {
          name: 'Moon',
          longitude: moon.longitude || 0,
          sign: (moon.sign || 'Cancer') as ZodiacSign,
          degree: moon.degree || 0,
          retrograde: Boolean(moon.retrograde),
          speed: 13,
          house: houses ? Math.floor((moon.longitude || 0) / 30) % 12 + 1 : undefined,
          phase: moon.phase_name || 'New Moon',
          phaseValue: typeof moon.phase === 'number' ? moon.phase : 0,
          phase_name: moon.phase_name || 'New Moon',
          illumination: moon.illumination || 0
        };
        planetData.moon = moonData;
      }

      if (mercury) {
        planetData.mercury = {
          name: 'Mercury',
          longitude: mercury.longitude || 0,
          sign: (mercury.sign || 'Gemini') as ZodiacSign,
          degree: mercury.degree || 0,
          retrograde: Boolean(mercury.retrograde),
          speed: typeof mercury.speed === 'number' ? mercury.speed : 1,
          house: houses ? Math.floor((mercury.longitude || 0) / 30) % 12 + 1 : undefined
        };
      }


      // Create aspects map (for backward compatibility)
      const aspectsMap: Record<string, string> = {};
      
      // Process aspects into more usable structure
      const processedAspects = (Array.isArray(aspects) ? aspects : []).map(a => {
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

      // Transform elements to simple form
      const simpleElements = {
        fire: elements?.fire?.score || 0.25,
        earth: elements?.earth?.score || 0.25,
        air: elements?.air?.score || 0.25,
        water: elements?.water?.score || 0.25
      };

      // Transform modalities to simple form
      const simpleModalities = {
        cardinal: modalities?.cardinal?.score || 0.33,
        fixed: modalities?.fixed?.score || 0.33,
        mutable: modalities?.mutable?.score || 0.34
      };

      // Return transformed data with current_hour and next_event
      return {
        date: apiData.date || new Date().toISOString(),
        queryTime: apiData.query_time || new Date().toISOString(),
        observer: apiData.observer || {
          latitude: 40.7128,
          longitude: -74.0060,
          timezone: 'America/New_York'
        },
        sun: planetData.sun || {
          name: 'Sun',
          sign: 'Aries',
          longitude: 0,
          degree: 0,
          retrograde: false,
          speed: 1
        },
        moon: {
          name: 'Moon',
          sign: 'Cancer' as ZodiacSign,
          longitude: 0,
          degree: 0,
          retrograde: false,
          speed: 13,
          house: 4,
          phase: 'New Moon',
          phaseValue: 0,
          phase_name: 'New Moon',
          illumination: 0
        } as CelestialBody,
        mercury: planetData.mercury || {
          name: 'Mercury',
          sign: 'Gemini',
          longitude: 0,
          degree: 0,
          retrograde: false,
          speed: 1,
          house: 3
        },
        current_hour: current_hour || {
          ruler: 'Sun',
          influence: 'A time of new beginnings',
          sign: 'Aries',
          is_positive: true
        },
        lunar_nodes: lunar_nodes || {
          north_node: {
            sign: 'Taurus',
            degree: 15,
            house: 2
          },
          south_node: {
            sign: 'Scorpio',
            degree: 15,
            house: 8
          },
          next_transit: {
            type: 'lunar_node',
            sign: 'Aries',
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: 'North Node enters Aries'
          },
          karmic_lessons: [
            'Learning to value stability and tangible results',
            'Releasing obsessive or controlling behaviors'
          ]
        },
        next_event: next_event || {
          name: 'New Moon in Aries',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'A time for new beginnings and fresh starts',
          intensity: 'high' as const,
          type: 'new_moon',
          sign: 'Aries'
        },
        planets: planetData,
        houses: houses ? {
          system: houses.system || 'placidus',
          cusps: Array.isArray(houses.cusps) ? houses.cusps : Array(12).fill(0).map((_, i) => i * 30),
          angles: {
            asc: houses.angles?.asc || 0,
            mc: houses.angles?.mc || 0,
            dsc: houses.angles?.dsc || 180,
            ic: houses.angles?.ic || 90
          }
        } : undefined,
        aspects: aspectsMap,
        aspectsList: processedAspects,
        patterns: Array.isArray(patterns) ? patterns : [],
        dignities: typeof dignities === 'object' ? dignities : {},
        elements: simpleElements,
        modalities: simpleModalities
      };
    } catch (error) {
      console.error('Error transforming API data:', error);
      return null;
    }
  }, [apiData]);

  return {
    astroData: transformedData,
    loading: isLoading,
    error,
    refreshData
  };
}

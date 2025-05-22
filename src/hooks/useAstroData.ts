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

// API Response type (matches the actual API response structure)
interface ApiResponse {
  date: string;
  query_time: string;
  sidereal?: boolean;
  ayanamsa?: number;
  observer?: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  planets: Record<string, {
    name: string;
    longitude: number;
    sign: string;
    degree: number;
    minute?: number;
    retrograde?: boolean;
  }>;
  moon_phase: {
    illumination: number | null;
    phase_name: string;
  };
  void_of_course_moon?: {
    is_void: boolean;
    start: string | null;
    end: string | null;
    next_sign: string | null;
  };
  elements: {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
  };
  modalities: {
    cardinal: { score: number; planets: string[] };
    fixed: { score: number; planets: string[] };
    mutable: { score: number; planets: string[] };
  };
  aspects: Array<{
    planets: string[];
    type: string;
    angle: number;
    orb: number;
    influence: string;
  }>;
  planetary_hours: any[];
  astro_weather: string;
  interpretations: {
    sun?: string;
    moon?: string;
    mercury?: string;
    venus?: string;
    mars?: string;
    jupiter?: string;
    saturn?: string;
    uranus?: string;
    neptune?: string;
    pluto?: string;
    chiron?: string;
    north_node?: string;
    aspects?: Array<{
      aspect: string;
      interpretation: string;
    }>;
  };
  // extensible: add more fields for unique profiles
  [key: string]: any;
}

// Our transformed data model for frontend
interface AstroData {
  date: string;
  queryTime: string;
  sidereal?: boolean;
  ayanamsa?: number;
  observer?: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  planets: Record<string, CelestialBody & {
    interpretation?: string;
  }>;
  moonPhase: {
    illumination: number | null;
    phase: string;
  };
  voidMoon?: {
    isVoid: boolean;
    start: string | null;
    end: string | null;
    nextSign: string | null;
  };
  aspects: Array<{
    planets: string[];
    type: string;
    angle: number;
    orb: number;
    influence: string;
    interpretation?: string;
  }>;
  elements: {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
  };
  modalities: {
    cardinal: { score: number; planets: string[] };
    fixed: { score: number; planets: string[] };
    mutable: { score: number; planets: string[] };
  };
  astroWeather: string;
  interpretations: {
    planets: Record<string, string>;
    aspects: Array<{
      aspect: string;
      interpretation: string;
    }>;
  };
  // extensible: add more fields for unique player profiles
  [key: string]: any;
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
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
};

// Get icon for zodiac sign (helper function)
const getZodiacIcon = (sign: string): string => {
  const signs: Record<string, string> = {
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
  return signs[sign.toLowerCase()] || '?';
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
  console.log('API Response:', { 
    apiData: {
      sidereal: apiData?.sidereal,
      ayanamsa: apiData?.ayanamsa,
      date: apiData?.date,
      planets: apiData?.planets,
      moon_phase: apiData?.moon_phase
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
      
      // Extract necessary data from actual API response
      const {
        date,
        query_time,
        sidereal,
        ayanamsa,
        observer,
        planets,
        moon_phase,
        void_of_course_moon,
        aspects,
        elements,
        modalities,
        astro_weather,
        interpretations,
        ...rest
      } = apiData;

      // Map planets object directly (add interpretation if available)
      const planetData: Record<string, CelestialBody & { interpretation?: string }> = {};
      if (planets && typeof planets === 'object') {
        Object.entries(planets).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            const planetKey = key.toLowerCase();
            planetData[planetKey] = {
              name: value.name || key,
              longitude: value.longitude,
              sign: value.sign as ZodiacSign,
              degree: value.degree, // API uses 'degree' not 'degrees'
              retrograde: Boolean(value.retrograde),
              speed: 1, // Default speed (required by CelestialBody type)
              interpretation: interpretations?.[planetKey] || undefined
            };
          }
        });
      }

      // Map aspects
      const mappedAspects = Array.isArray(aspects)
        ? aspects.map(a => {
            // Find matching interpretation if available
            const aspectKey = `${a.planets[0]} ${a.type} ${a.planets[1]}`;
            const aspectInterpretation = interpretations?.aspects?.find(
              i => i.aspect === aspectKey
            )?.interpretation || '';
            
            return {
              planets: a.planets,
              type: a.type,
              angle: a.angle,
              orb: a.orb,
              influence: a.influence,
              interpretation: aspectInterpretation
            };
          })
        : [];

      // Map planet interpretations
      const planetInterpretations: Record<string, string> = {};
      Object.keys(interpretations || {}).forEach(key => {
        if (key !== 'aspects' && typeof interpretations[key] === 'string') {
          planetInterpretations[key] = interpretations[key];
        }
      });

      // Compose final AstroData
      return {
        date,
        queryTime: query_time,
        sidereal,
        ayanamsa,
        observer,
        planets: planetData,
        moonPhase: {
          illumination: moon_phase?.illumination || 0,
          phase: moon_phase?.phase_name || 'Unknown'
        },
        voidMoon: void_of_course_moon ? {
          isVoid: void_of_course_moon.is_void,
          start: void_of_course_moon.start,
          end: void_of_course_moon.end,
          nextSign: void_of_course_moon.next_sign
        } : undefined,
        aspects: mappedAspects,
        elements,
        modalities,
        astroWeather: astro_weather,
        interpretations: {
          planets: planetInterpretations,
          aspects: interpretations?.aspects || []
        },
        ...rest // allow extensibility for unique player profiles
      };
    } catch (error) {
      console.error('Error transforming API data:', error);
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
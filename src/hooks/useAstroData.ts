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
  return '/api/unified-astro';
};

const API_BASE_URL = getApiBaseUrl();

// API Response type (matches the actual API response structure)
interface ApiResponse {
  date: string;
  query_time?: string;
  sidereal?: boolean;
  ayanamsa?: number;
  observer?: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  planets: Record<string, {
    name?: string;
    longitude: number;
    sign: string;
    degrees?: number;
    degree?: number;
    minute?: number;
    retrograde?: boolean;
    weight?: number;
    error?: boolean;
  }>;
  // Support both API response formats
  moon_phase?: {
    illumination: number | null;
    phase_name: string;
  };
  moonPhase?: {
    illumination: number | null;
    angle?: number;
    phase: string;
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
  console.log('[Fetcher] Attempting to fetch URL:', url);
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
  const apiUrl = `${API_BASE_URL}?date=${dateStr}&sidereal=true&t=${Date.now()}`;
  const { data: apiData, error, isLoading, mutate } = useSWR<ApiResponse>(
    apiUrl,
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
      },
      fallbackData: null // Provide fallback to prevent undefined errors
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
            // Use any type to handle different interpretations structures
            const anyInterpretations = interpretations as any;
            const interpretation = anyInterpretations?.planets?.[planetKey]?.interpretation || 
                                 anyInterpretations?.[planetKey] || undefined;
            
            planetData[planetKey] = {
              name: value.name || key,
              longitude: value.longitude || 0,
              sign: value.sign as ZodiacSign,
              // Handle both degree and degrees properties
              degree: value.degree || value.degrees || 0,
              retrograde: Boolean(value.retrograde),
              speed: 1, // Default speed (required by CelestialBody type)
              interpretation: interpretation
            };
          }
        });
      }

      // Map aspects
      const mappedAspects = Array.isArray(aspects)
        ? aspects.map(a => {
            // Handle different aspect structures
            const anyAspect = a as any; // Use any type to access potentially missing properties
            const planets = Array.isArray(anyAspect.planets) ? anyAspect.planets : 
                          (anyAspect.from && anyAspect.to ? [anyAspect.from, anyAspect.to] : []);
            
            // Find matching interpretation if available
            const aspectKey = planets.length >= 2 ? `${planets[0]} ${anyAspect.type} ${planets[1]}` : '';
            const anyInterpretations = interpretations as any;
            const aspectInterpretation = anyInterpretations?.aspects && Array.isArray(anyInterpretations.aspects) ?
              anyInterpretations.aspects.find((i: any) => i.aspect === aspectKey)?.interpretation || '' : '';
            
            return {
              planets: planets,
              type: anyAspect.type || '',
              angle: anyAspect.angle || 0,
              orb: anyAspect.orb || 0,
              influence: anyAspect.influence || '',
              interpretation: aspectInterpretation
            };
          })
        : [];

      // Map planet interpretations - handle both API response formats
      const planetInterpretations: Record<string, string> = {};
      
      // Use any type to handle different interpretations structures
      const anyInterpretations = interpretations as any;
      
      // Handle flat structure
      if (anyInterpretations && typeof anyInterpretations === 'object') {
        Object.keys(anyInterpretations).forEach(key => {
          if (key !== 'aspects' && key !== 'planets' && typeof anyInterpretations[key] === 'string') {
            planetInterpretations[key] = anyInterpretations[key];
          }
        });
      }
      
      // Handle nested structure
      if (anyInterpretations?.planets && typeof anyInterpretations.planets === 'object') {
        Object.keys(anyInterpretations.planets).forEach(key => {
          const planetInterp = anyInterpretations.planets[key];
          if (typeof planetInterp === 'object' && planetInterp.interpretation) {
            planetInterpretations[key] = planetInterp.interpretation;
          } else if (typeof planetInterp === 'string') {
            planetInterpretations[key] = planetInterp;
          }
        });
      }

      // Compose final AstroData
      return {
        date,
        queryTime: query_time,
        sidereal,
        ayanamsa,
        observer,
        planets: planetData,
        moonPhase: {
          // Handle both API response formats
          illumination: moon_phase?.illumination || apiData.moonPhase?.illumination || 0,
          phase: moon_phase?.phase_name || apiData.moonPhase?.phase || 'Unknown'
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
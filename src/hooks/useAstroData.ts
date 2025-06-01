/**
 * Enhanced Astrological Data Hook
 * 
 * This hook fetches and transforms astrological data from the API,
 * providing a clean, typed interface for components.
 */
import { useMemo, useCallback } from 'react';
import useSWR from 'swr';
import type { AspectType, CelestialBody, ZodiacSign, MoonPhaseInfo } from '../types/astrology';

// Import the moon phase calculation functions
import { getMoonPhase, getMoonPhaseInfo } from '../lib/astroCalculations';

// Helper function to determine moon phase value (0 to 1) and name
const getProcessedMoonPhase = (
  _apiMoonPhase?: { angle?: number; phase?: string; illumination?: number | null },
  _apiMoon_Phase?: { phase_name?: string; illumination?: number | null }
): MoonPhaseInfo => {
  // Always use our accurate moon phase calculation
  const now = new Date();
  const phase = getMoonPhase(now);
  const { name, illumination } = getMoonPhaseInfo(phase);
  
  return { 
    name, 
    value: phase, 
    illumination: illumination / 100 // Convert to 0-1 range
  };
};

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

// Raw API Aspect type
interface RawApiAspect {
  planet1: string;
  planet2: string;
  aspect: string;
  angle: number;
  orb: number;
  strength: number;
  applying: boolean;
  // Add other properties if they exist in the raw API response for aspects
}

// Raw API Aspect Interpretation type
interface RawApiAspectInterpretation {
  planet1: string;
  planet2: string;
  aspect: string;
  interpretation: string;
  // Add other properties if they exist
}

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
  aspects: RawApiAspect[];
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
    aspects?: RawApiAspectInterpretation[];
  };
  // extensible: add more fields for unique profiles
  [key: string]: any;
}

// Transformed Aspect type for frontend use
interface TransformedAspect {
  planets: (CelestialBody & { interpretation?: string })[];
  type: string;
  angle: number;
  orb: number;
  influence: string;
  applying: boolean;
  interpretation?: string;
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
  moonPhase: MoonPhaseInfo;
  voidMoon?: {
    isVoid: boolean;
    start: string | null;
    end: string | null;
    nextSign: string | null;
  };
  aspects: TransformedAspect[];
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
export interface UseAstroDataReturn {
  astroData: AstroData | null;
  loading: boolean;
  error: Error | null;
  refreshData: () => void;
}

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
export const useAstroData = (dateParam: Date | string | null = new Date()): UseAstroDataReturn => {
  // Format date as YYYY-MM-DD, handling null/undefined cases
  let dateStr = '';
  
  if (dateParam === null || dateParam === undefined) {
    console.log('[useAstroData] dateParam is null or undefined, using current date');
    dateParam = new Date();
  }
  
  try {
    dateStr = typeof dateParam === 'string' 
      ? dateParam 
      : dateParam.toISOString().split('T')[0];
  } catch (err) {
    console.error('[useAstroData] Error formatting date:', err);
    dateStr = new Date().toISOString().split('T')[0]; // Fallback to current date
  }

  // Stable key for SWR, based on actual data dependencies
  const swrKey = `${API_BASE_URL}?date=${dateStr}&sidereal=true`;
  // Fetch function for SWR
const fetcher = async (baseApiUrl: string) => {
  const urlToFetch = `${baseApiUrl}&t=${Date.now()}`; // Append timestamp for cache-busting
  console.log('[Fetcher] Attempting to fetch URL:', urlToFetch);
  const response = await fetch(urlToFetch);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Fetcher] API request failed:', response.status, errorText);
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }
  const rawText = await response.text();
  try {
    const jsonData = JSON.parse(rawText);
    return jsonData;
  } catch (e) {
    console.error('[Fetcher] Failed to parse API response JSON:', e, "Raw text was:", rawText);
    throw new Error('Failed to parse API response JSON');
  }
};

const { data: apiData, error, isLoading, mutate } = useSWR<ApiResponse>(
    swrKey, // Use the stable key
    fetcher,
    {
      revalidateOnFocus: false, // Keep
      revalidateOnReconnect: false, // Keep
      shouldRetryOnError: false,    // Disable retries for now
      // Using SWR default for dedupingInterval
      // No fallbackData, apiData will be undefined initially then populated
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
  
  // Log the SWR key being used
  console.log('SWR Key:', swrKey);

  // Log SWR values before transformation
  console.log('[useAstroData] Values from SWR before useMemo - apiData:', JSON.stringify(apiData, null, 2), 'error:', error, 'isLoading:', isLoading);

  // Transform API data to our internal model
  const transformedData = useMemo((): AstroData | null => {
    console.log('[useAstroData/transformedData] Attempting transformation. apiData:', JSON.stringify(apiData, null, 2));
    if (!apiData) {
      console.log('[useAstroData/transformedData] apiData is null or undefined, returning null.');
      return null;
    }

    try {
      console.log('[useAstroData/transformedData] Inside try block, pre-JSON.stringify apiData:', apiData ? Object.keys(apiData).join(', ') : 'apiData is null');
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
        moonPhase, // Destructure raw moonPhase to prevent overwrite by ...rest
        void_of_course_moon,
        aspects,
        elements,
        modalities,
        astro_weather,
        interpretations,
        ...rest
      } = apiData;
      console.log('[useAstroData/transformedData] Destructured apiData successfully.');

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
        ? aspects.map((rawAspect: RawApiAspect, index) => {
            console.log(`[useAstroData/transformedData/aspects] Processing raw aspect ${index}:`, JSON.stringify(rawAspect));

            const p1Name = rawAspect.planet1?.toLowerCase();
            const p2Name = rawAspect.planet2?.toLowerCase();
            const aspectType = rawAspect.aspect?.toLowerCase();

            if (!p1Name || !p2Name || !aspectType) {
              console.warn(`[useAstroData/transformedData/aspects] Skipping aspect ${index} due to missing planet names or aspect type.`, rawAspect);
              return null; // Or a default/empty aspect object
            }

            const planet1 = planetData[p1Name];
            const planet2 = planetData[p2Name];

            if (!planet1 || !planet2) {
              console.warn(`[useAstroData/transformedData/aspects] Skipping aspect ${index} because one or both planets ('${p1Name}', '${p2Name}') not found in planetData. Raw aspect:`, rawAspect, 'PlanetData keys:', Object.keys(planetData));
              return null;
            }
            
            console.log(`[useAstroData/transformedData/aspects] Mapped planets for aspect ${index}:`, planet1.name, planet2.name);

            const influence = rawAspect.strength != null ? `${Math.round(rawAspect.strength * 100)}%` : 'N/A';
            
            let interpretationText = '';
            if (interpretations?.aspects && Array.isArray(interpretations.aspects)) {
              const foundInterpretation = interpretations.aspects.find((interp: RawApiAspectInterpretation) => {
                const interpP1 = interp.planet1?.toLowerCase();
                const interpP2 = interp.planet2?.toLowerCase();
                const interpAspect = interp.aspect?.toLowerCase();
                return (
                  (interpP1 === p1Name && interpP2 === p2Name && interpAspect === aspectType) ||
                  (interpP1 === p2Name && interpP2 === p1Name && interpAspect === aspectType) // Check reversed order
                );
              });
              if (foundInterpretation && foundInterpretation.interpretation) {
                interpretationText = foundInterpretation.interpretation;
                console.log(`[useAstroData/transformedData/aspects] Found interpretation for ${p1Name}-${aspectType}-${p2Name}: "${interpretationText}"`);
              } else {
                console.log(`[useAstroData/transformedData/aspects] No interpretation found for ${p1Name}-${aspectType}-${p2Name} from API. Searched in:`, interpretations.aspects);

                // Client-side fallback for missing interpretations
                const fallbackKey = `${p1Name}-${aspectType}-${p2Name}`;
                const reversedFallbackKey = `${p2Name}-${aspectType}-${p1Name}`;
                
                // Organized fallbacks by planet combinations
                const knownFallbacks: Record<string, string> = {
                  // Uranus-Pluto aspects
                  "uranus-sextile-pluto": "Uranus sextile Pluto: This aspect fosters transformative breakthroughs and innovative approaches to deep-seated issues. It encourages embracing change and using personal power constructively to evolve societal structures or personal paradigms.",
                  "pluto-sextile-uranus": "Pluto sextile Uranus: This aspect fosters transformative breakthroughs and innovative approaches to deep-seated issues. It encourages embracing change and using personal power constructively to evolve societal structures or personal paradigms.",
                  "uranus-trine-pluto": "Uranus trine Pluto: This harmonious aspect brings powerful transformative energy and the ability to revolutionize structures in a flowing, natural way. It supports positive change that respects deeper truths and facilitates evolution without unnecessary destruction.",
                  "pluto-trine-uranus": "Pluto trine Uranus: This harmonious aspect brings powerful transformative energy and the ability to revolutionize structures in a flowing, natural way. It supports positive change that respects deeper truths and facilitates evolution without unnecessary destruction.",
                  
                  // Neptune-Pluto aspects
                  "neptune-sextile-pluto": "Neptune sextile Pluto: This aspect blends spiritual awareness with transformative power. It offers opportunities to dissolve outdated structures and replace them with more spiritually aligned approaches. Intuition and deep psychological insights work together harmoniously.",
                  "pluto-sextile-neptune": "Pluto sextile Neptune: This aspect blends transformative power with spiritual awareness. It offers opportunities to dissolve outdated structures and replace them with more spiritually aligned approaches. Deep psychological insights and intuition work together harmoniously.",
                  
                  // Uranus-Neptune aspects
                  "uranus-sextile-neptune": "Uranus sextile Neptune: This aspect creates opportunities to blend innovation with spiritual insight. It supports bringing visionary ideas into practical reality and finding unconventional solutions to spiritual or compassionate endeavors.",
                  "neptune-sextile-uranus": "Neptune sextile Uranus: This aspect creates opportunities to blend spiritual insight with innovation. It supports bringing visionary ideas into practical reality and finding compassionate approaches to technological or progressive endeavors."
                };

                if (knownFallbacks[fallbackKey]) {
                  interpretationText = knownFallbacks[fallbackKey];
                  console.log(`[useAstroData/transformedData/aspects] Used client-side fallback for ${fallbackKey}: "${interpretationText}"`);
                } else if (knownFallbacks[reversedFallbackKey]) {
                  interpretationText = knownFallbacks[reversedFallbackKey];
                  console.log(`[useAstroData/transformedData/aspects] Used client-side fallback for ${reversedFallbackKey} (reversed): "${interpretationText}"`);
                }
              }
            } else {
                console.log(`[useAstroData/transformedData/aspects] interpretations.aspects is not an array or is missing.`);
            }

            return {
              planets: [planet1, planet2],
              type: aspectType,
              angle: rawAspect.angle || 0,
              orb: rawAspect.orb || 0,
              influence: influence,
              applying: Boolean(rawAspect.applying),
              interpretation: interpretationText,
            };
          }).filter(aspect => aspect !== null) as TransformedAspect[] // Remove any skipped aspects and assert type
        : [];
      console.log('[useAstroData/transformedData] Finished mapping aspects:', JSON.stringify(mappedAspects, null, 2));

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
      const result: AstroData = {
        date,
        queryTime: query_time,
        sidereal,
        ayanamsa,
        observer,
        planets: planetData,
        moonPhase: getProcessedMoonPhase(apiData.moonPhase, moon_phase),
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
      console.log('[useAstroData/transformedData] Successfully transformed data:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[useAstroData/transformedData] Error during transformation:', error, 'Original apiData:', JSON.stringify(apiData, null, 2));
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
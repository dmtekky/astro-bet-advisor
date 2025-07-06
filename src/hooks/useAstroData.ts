/**
 * Enhanced Astrological Data Hook
 *
 * This hook fetches and transforms astrological data from the API,
 * providing a clean, typed interface for components.
 */
import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type {
  AspectType,
  CelestialBody,
  ZodiacSign,
  MoonPhaseInfo,
} from "../types/astrology.js";
import * as z from "zod"; // Import Zod
import { ASPECT_INTERPRETATIONS } from '../utils/aspectInterpretations.js'; // Import aspect interpretations

// Initialize Supabase client with fallback to REACT_APP_ prefixed variables for backward compatibility
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.REACT_APP_SUPABASE_URL ||
    "",
  import.meta.env.VITE_SUPABASE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
    "",
);

// Import the moon phase calculation functions
// Define zodiac sign and element helpers locally since they're missing from astroCalculations
const getZodiacSign = (longitude: number): ZodiacSign => {
  const signs: ZodiacSign[] = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const index = Math.floor(longitude / 30) % 12;
  return signs[index];
};

const getElementFromSign = (sign: ZodiacSign): Element => {
  const elements: Record<ZodiacSign, Element> = {
    "Aries": "Fire",
    "Leo": "Fire",
    "Sagittarius": "Fire",
    "Taurus": "Earth",
    "Virgo": "Earth",
    "Capricorn": "Earth",
    "Gemini": "Air",
    "Libra": "Air",
    "Aquarius": "Air",
    "Cancer": "Water",
    "Scorpio": "Water",
    "Pisces": "Water"
  };
  return elements[sign];
};

// Constants for moon phase calculations
const LUNAR_CYCLE_DAYS = 29.53058867; // Synodic month in days
const LUNAR_CYCLE_MS = LUNAR_CYCLE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Calculate the current moon phase (0-1)
 * 0 = new moon, 0.5 = full moon, 1 = next new moon
 */
const getMoonPhase = (date: Date = new Date()): number => {
  // Known new moon date (Jan 11, 2024 06:57 UTC)
  const knownNewMoon = new Date('2024-01-11T06:57:00Z').getTime();
  const now = date.getTime();
  
  // Calculate days since known new moon
  const daysSinceKnownNewMoon = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
  
  // Calculate current phase (0-1)
  const phase = (daysSinceKnownNewMoon % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS;
  
  return phase;
};

/**
 * Get detailed moon phase information
 */
const getMoonPhaseInfo = (phase?: number, date: Date = new Date()): { 
  name: string; 
  emoji: string; 
  phase: number; 
  illumination: number; 
  nextFullMoon: string; 
  ageInDays: number; 
  phaseType: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
} => {
  // If phase is not provided, calculate it
  const currentPhase = typeof phase === 'number' ? phase : getMoonPhase(date);
  
  // Calculate illumination (0-1) - simplified sine wave approximation
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * currentPhase));
  
  // Calculate moon age in days
  const ageInDays = currentPhase * LUNAR_CYCLE_DAYS;
  
  // Calculate next full moon
  let daysToNextFullMoon = (0.5 - currentPhase) * LUNAR_CYCLE_DAYS;
  if (daysToNextFullMoon < 0) {
    daysToNextFullMoon += LUNAR_CYCLE_DAYS; // If we're past full moon this cycle
  }
  const nextFullMoon = new Date(date.getTime() + daysToNextFullMoon * 24 * 60 * 60 * 1000);
  
  // Determine phase name and type
  let name: string;
  let emoji: string;
  let phaseType: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
  
  if (currentPhase < 0.03 || currentPhase > 0.97) {
    name = 'New Moon';
    emoji = '🌑';
    phaseType = 'new';
  } else if (currentPhase < 0.22) {
    name = 'Waxing Crescent';
    emoji = '🌒';
    phaseType = 'waxing-crescent';
  } else if (currentPhase < 0.28) {
    name = 'First Quarter';
    emoji = '🌓';
    phaseType = 'first-quarter';
  } else if (currentPhase < 0.47) {
    name = 'Waxing Gibbous';
    emoji = '🌔';
    phaseType = 'waxing-gibbous';
  } else if (currentPhase < 0.53) {
    name = 'Full Moon';
    emoji = '🌕';
    phaseType = 'full';
  } else if (currentPhase < 0.72) {
    name = 'Waning Gibbous';
    emoji = '🌖';
    phaseType = 'waning-gibbous';
  } else if (currentPhase < 0.78) {
    name = 'Last Quarter';
    emoji = '🌗';
    phaseType = 'last-quarter';
  } else {
    name = 'Waning Crescent';
    emoji = '🌘';
    phaseType = 'waning-crescent';
  }
  
  return {
    name,
    emoji,
    phase: currentPhase,
    illumination,
    nextFullMoon: nextFullMoon.toISOString(),
    ageInDays,
    phaseType
  };
};

/**
 * Helper function to determine moon phase value (0 to 1) and name
 * @param _apiMoonPhase - Optional moon phase data from API (legacy)
 * @param _apiMoon_Phase - Optional moon phase data from API (alternative format)
 * @returns Complete moon phase information
 */
const getProcessedMoonPhase = (
  _apiMoonPhase?: {
    angle?: number;
    phase?: string;
    illumination?: number | null;
  },
  _apiMoon_Phase?: { phase_name?: string; illumination?: number | null },
): MoonPhaseInfo => {
  try {
    // Get the current moon phase info using our calculation
    const now = new Date();
    const moonInfo = getMoonPhaseInfo(undefined, now);

    // Create a properly typed MoonPhaseInfo object
    const moonPhaseInfo: MoonPhaseInfo = {
      name: moonInfo.name,
      value: moonInfo.phase,
      illumination: moonInfo.illumination,
      nextFullMoon: new Date(moonInfo.nextFullMoon),
      ageInDays: moonInfo.ageInDays,
      phaseType: moonInfo.phaseType,
    };

    return moonPhaseInfo;
  } catch (error) {
    console.error("Error processing moon phase:", error);
    
    // Return a safe default in case of errors
    const defaultDate = new Date(Date.now() + 29.53 * 24 * 60 * 60 * 1000); // ~30 days from now

    const defaultMoonPhase: MoonPhaseInfo = {
      name: "New Moon",
      value: 0,
      illumination: 0,
      nextFullMoon: defaultDate,
      ageInDays: 0,
      phaseType: "new",
    };

    return defaultMoonPhase;
  }
};

// Base URL for API requests
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") return "/api/unified-astro";

  // In production (Vercel), use relative URL
  if (window.location.hostname !== "localhost") {
    return "/api/unified-astro";
  }

  // In development, use the local API server
  return "/api/unified-astro";
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
  planets: Record<
    string,
    {
      name?: string;
      longitude: number;
      sign: string;
      degrees?: number;
      degree?: number;
      minute?: number;
      retrograde?: boolean;
      weight?: number;
      error?: boolean;
    }
  >;
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
  planets: Record<
    string,
    CelestialBody & {
      interpretation?: string;
    }
  >;
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
  cusps?: number[]; // Add this line to include the cusps array from backend
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
    aries: "♈",
    taurus: "♉",
    gemini: "♊",
    cancer: "♋",
    leo: "♌",
    virgo: "♍",
    libra: "♎",
    scorpio: "♏",
    sagittarius: "♐",
    capricorn: "♑",
    aquarius: "♒",
    pisces: "♓",
  };
  return signs[sign.toLowerCase()] || "?";
};

/**
 * Hook to fetch and transform astrological data
 * @param dateParam - Date to get data for, defaults to current date
 * @returns Astrological data, loading state, and error
 */
export const useAstroData = (
  dateParam: Date | string | null = new Date(),
): UseAstroDataReturn => {
  // Format date as YYYY-MM-DD, handling null/undefined cases
  let dateStr = "";

  if (dateParam === null || dateParam === undefined) {
    console.log(
      "[useAstroData] dateParam is null or undefined, using current date",
    );
    dateParam = new Date();
  }

  try {
    if (typeof dateParam === "string") {
      dateStr = dateParam;
    } else if (dateParam instanceof Date && dateParam && typeof dateParam.toISOString === 'function') {
      dateStr = dateParam.toISOString().split("T")[0];
    } else {
      // If dateParam is neither a string nor a valid Date, create a new Date
      dateStr = new Date().toISOString().split("T")[0];
    }
  } catch (err) {
    console.error("[useAstroData] Error formatting date:", err);
    dateStr = new Date().toISOString().split("T")[0]; // Fallback to current date
  }

  // Stable key for SWR, based on actual data dependencies
  const swrKey = `/api/unified-astro?date=${dateStr}&sidereal=true`;

  // Enhanced fetch function with better error handling and auth flow
  const fetcher = async (baseApiUrl: string) => {
    const urlToFetch = `${baseApiUrl}&t=${Date.now()}`; // Append timestamp for cache-busting
    console.log("[useAstroData] Fetching URL:", urlToFetch);

    // Get Supabase session if available
    console.log("[useAstroData] Getting Supabase session...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn(
        "[useAstroData] Error getting Supabase session:",
        sessionError,
      );
    } else {
      console.log(
        "[useAstroData] Session status:",
        session ? "Authenticated" : "No active session",
      );
    }

    // Prepare headers with auth
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add auth token if available, otherwise use anon key as fallback
    const anonKey =
      import.meta.env.VITE_SUPABASE_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.REACT_APP_SUPABASE_ANON_KEY;
    if (session?.access_token) {
      console.log("[useAstroData] Using authenticated session token");
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else if (anonKey) {
      console.log("[useAstroData] Using anonymous access with anon key");
      headers["apikey"] = anonKey;
      headers["Authorization"] = `Bearer ${anonKey}`;
    } else {
      console.warn("[useAstroData] No auth token or anon key available");
    }

    try {
      console.log(
        "[useAstroData] Making request with headers:",
        JSON.stringify(headers, null, 2),
      );
      const response = await fetch(urlToFetch, {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useAstroData] API request failed:", {
          status: response.status,
          statusText: response.statusText,
          url: urlToFetch,
          error: errorText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        // Handle 401/403 specifically with retry logic
        if (response.status === 401 || response.status === 403) {
          console.log(
            "[useAstroData] Authentication required, attempting to refresh session...",
          );

          try {
            const { data, error: refreshError } =
              await supabase.auth.refreshSession();

            if (refreshError || !data.session) {
              console.error(
                "[useAstroData] Session refresh failed:",
                refreshError,
              );
              // If refresh fails, try with anon key if not already using it
              if (anonKey && !headers["apikey"]) {
                console.log("[useAstroData] Retrying with anonymous access...");
                const anonHeaders = {
                  ...headers,
                  apikey: anonKey,
                  Authorization: `Bearer ${anonKey}`,
                };
                const anonResponse = await fetch(urlToFetch, {
                  headers: anonHeaders,
                  credentials: "include",
                });

                if (!anonResponse.ok) {
                  throw new Error(
                    `Anonymous access failed: ${anonResponse.status} ${anonResponse.statusText}`,
                  );
                }
                return await anonResponse.json();
              }
              throw new Error(
                `Authentication failed: ${refreshError?.message || "No session after refresh"}`,
              );
            }

            // Retry with new token
            console.log(
              "[useAstroData] Session refreshed, retrying with new token...",
            );
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${data.session.access_token}`,
            };

            const retryResponse = await fetch(urlToFetch, {
              headers: retryHeaders,
              credentials: "include",
            });

            if (!retryResponse.ok) {
              const retryError = await retryResponse.text();
              throw new Error(
                `Retry failed with status ${retryResponse.status}: ${retryError}`,
              );
            }

            return await retryResponse.json();
          } catch (error: unknown) {
            console.error(
              "[useAstroData] Error during session refresh/retry:",
              error
            );
            
            // Properly handle the unknown error type
            if (error instanceof Error) {
              throw new Error(`Failed to refresh session: ${error.message}`);
            } else {
              throw new Error(`Failed to refresh session: ${String(error)}`);
            }
          }
        }

        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`,
        );
      }

      const responseData = await response.json();
      console.log("[useAstroData] Successfully fetched data");
      return responseData;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("[useAstroData] Request failed:", {
        error: errorMessage,
        url: urlToFetch,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Request failed: ${errorMessage}`);
    }
  };

  const swrOptions = {
    dedupingInterval: 30000, // Prevent duplicate requests for 30 seconds
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    retryCount: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    onErrorRetry: (
      error: Error,
      _: any,
      __: any,
      revalidate: any,
      { retryCount }: { retryCount: number },
    ) => {
      // Don't retry on 401/403 as it's likely an auth issue
      if (error.message.includes("401") || error.message.includes("403")) {
        console.log("[useAstroData] Not retrying 401/403 error");
        return;
      }

      // Only retry up to configured retryCount
      if (retryCount >= 3) return;

      // Retry with exponential backoff
      const timeout = Math.min(1000 * 2 ** retryCount, 30000);
      console.log(
        `[useAstroData] Retrying (${retryCount + 1}/3) in ${timeout}ms...`,
      );
      setTimeout(() => revalidate({ retryCount }), timeout);
    },
  };

  const {
    data: apiData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [swrKey],
    queryFn: () => fetcher(swrKey),
    retry: swrOptions.retryCount,
    retryDelay: swrOptions.retryDelay,
    staleTime: swrOptions.dedupingInterval,
    refetchOnWindowFocus: swrOptions.revalidateOnFocus,
    refetchOnReconnect: swrOptions.revalidateOnReconnect
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to manually refresh data
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (refreshError: unknown) {
      console.error("Error refreshing data:", refreshError);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Console log for debugging
  console.log("API Response:", {
    apiData: {
      sidereal: apiData?.sidereal,
      ayanamsa: apiData?.ayanamsa,
      date: apiData?.date,
      planets: apiData?.planets,
      moon_phase: apiData?.moon_phase,
    },
    error,
    isLoading,
  });

  // Log the SWR key being used
  console.log("SWR Key:", swrKey);

  // Log SWR values before transformation
  console.log(
    "[useAstroData] Values from SWR before useMemo - apiData:",
    JSON.stringify(apiData, null, 2),
    "error:",
    error,
    "isLoading:",
    isLoading,
  );

  // Transform API data to our internal model
  const transformedData = useMemo((): AstroData | null => {
    console.log(
      "[useAstroData/transformedData] Attempting transformation. apiData:",
      JSON.stringify(apiData, null, 2),
    );
    if (!apiData) {
      console.log(
        "[useAstroData/transformedData] apiData is null or undefined, returning null.",
      );
      return null;
    }

    try {
      console.log(
        "[useAstroData/transformedData] Inside try block, pre-JSON.stringify apiData:",
        apiData ? Object.keys(apiData).join(", ") : "apiData is null",
      );
      console.log("Raw API Data:", JSON.stringify(apiData, null, 2));

      // Zod schema for API response
      const AstroDataSchema = z.object({
        date: z.string().datetime(),
        sidereal: z.boolean().optional(),
        ayanamsa: z.number().optional(),
        planets: z.record(
          z.object({
            longitude: z.number(),
            sign: z.string(),
            degrees: z.number(),
            retrograde: z.boolean(),
            weight: z.number().optional(),
            tropicalLongitude: z.number().optional(),
          }),
        ),
        moonPhase: z
          .object({
            illumination: z.number(),
            angle: z.number(),
            phase: z.string(),
          })
          .optional(),
        aspects: z
          .array(
            z.object({
              planet1: z.string(),
              planet2: z.string(),
              aspect: z.string(),
              angle: z.number(),
              orb: z.number(),
              strength: z.number(),
              applying: z.boolean(),
              interpretation: z.string().optional(),
            }),
          )
          .optional(),
        elements: z
          .object({
            fire: z.number(),
            earth: z.number(),
            water: z.number(),
            air: z.number(),
          })
          .optional(),
        modalities: z
          .object({
            cardinal: z.number(),
            fixed: z.number(),
            mutable: z.number(),
          })
          .optional(),
        astro_weather: z
          .object({
            overall: z.number(),
            action: z.number(),
            thinking: z.number(),
            feeling: z.number(),
            creativity: z.number(),
            spirituality: z.number(),
          })
          .optional(),
        interpretations: z
          .object({
            planets: z.record(
              z.object({
                sign: z.string(),
                retrograde: z.boolean(),
                interpretation: z.string(),
              }),
            ),
            aspects: z.array(
              z.object({
                planet1: z.string(),
                planet2: z.string(),
                aspect: z.string(),
                angle: z.number(),
                orb: z.number(),
                strength: z.number(),
                applying: z.boolean(),
                interpretation: z.string(),
              }),
            ),
          })
          .optional(),
        sunSign: z.string().optional(),
        cusps: z.array(z.number()).optional(), // Add this line to include the cusps array from backend
      });

      // Validate and parse API response
      const parseResult = AstroDataSchema.safeParse(apiData);
      if (!parseResult.success) {
        console.error("[useAstroData] API response validation failed:", {
          error: parseResult.error,
          response: apiData,
        });

        // Return minimal valid structure with default values
        const currentDate = new Date().toISOString().split('T')[0];
        return {
          date: currentDate,
          queryTime: new Date().toISOString(),
          planets: {},
          aspects: [],
          elements: {
            fire: { score: 0, planets: [] },
            earth: { score: 0, planets: [] },
            air: { score: 0, planets: [] },
            water: { score: 0, planets: [] }
          },
          moonPhase: {
            name: 'Unknown',
            value: 0,
            illumination: 0,
            nextFullMoon: new Date().toISOString(),
            ageInDays: 0,
            phaseType: 'new'
          },
          astroWeather: 'Unknown'
        };
      }

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
        cusps, // Add this line to include the cusps array from backend
        ...rest
      } = apiData;
      console.log(
        "[useAstroData/transformedData] Destructured apiData successfully.",
      );

      // Map planets object directly (add interpretation if available)
      const planetData: Record<
        string,
        CelestialBody & { interpretation?: string }
      > = {};
      if (planets && typeof planets === "object") {
        Object.entries(planets).forEach(([key, value]) => {
          if (value && typeof value === "object") {
            const planetKey = key.toLowerCase();
            // Capitalize the planet name for display
            const displayName = key.charAt(0).toUpperCase() + key.slice(1);
            
            planetData[planetKey] = {
              name: displayName, // Explicitly set capitalized name
              longitude: value.longitude || 0,
              sign: value.sign as ZodiacSign,
              degree: value.degrees || value.degree || 0, // Handle both API versions
              retrograde: Boolean(value.retrograde),
              // Handle speed property which might not be in the type
              speed: (value as any).speed || 1,
              // Safely access interpretation
              interpretation: interpretations && 
                interpretations.planets && 
                planetKey in interpretations.planets ? 
                interpretations.planets[planetKey] : '',
            };
          }
        });
        
        // Add debug logging
        console.log("[useAstroData] Transformed planets:", planetData);
      }

      // Map aspects
      const mappedAspects = Array.isArray(aspects)
        ? aspects.map((rawAspect) => {
            const p1Name = rawAspect.planet1?.toLowerCase();
            const p2Name = rawAspect.planet2?.toLowerCase();
            
            // Skip if planet names are missing
            if (!p1Name || !p2Name) {
              console.warn("[useAstroData] Missing planet names in aspect:", rawAspect);
              return null;
            }
            
            const planet1 = planetData[p1Name];
            const planet2 = planetData[p2Name];
            
            // Skip if planets not found in planetData
            if (!planet1 || !planet2) {
              console.warn(`[useAstroData] Planets not found for aspect: ${p1Name}-${rawAspect.aspect}-${p2Name}`);
              return null;
            }

            // Find matching interpretation
            const aspectInterpretation = interpretations?.aspects?.find(
              (a) => 
                (a.planet1?.toLowerCase() === p1Name && 
                 a.planet2?.toLowerCase() === p2Name && 
                 a.aspect?.toLowerCase() === rawAspect.aspect?.toLowerCase()) ||
                (a.planet1?.toLowerCase() === p2Name && 
                 a.planet2?.toLowerCase() === p1Name && 
                 a.aspect?.toLowerCase() === rawAspect.aspect?.toLowerCase())
            )?.interpretation || '';

            // Capitalize aspect type for display
            const aspectType = rawAspect.aspect 
              ? rawAspect.aspect.charAt(0).toUpperCase() + rawAspect.aspect.slice(1).toLowerCase() 
              : 'Unknown';
            
            return {
              planets: [planet1, planet2],
              type: aspectType,
              angle: rawAspect.angle || 0,
              orb: rawAspect.orb || 0,
              influence: rawAspect.strength != null ? `${Math.round(rawAspect.strength * 100)}%` : "N/A",
              applying: Boolean(rawAspect.applying),
              interpretation: aspectInterpretation || ASPECT_INTERPRETATIONS[aspectType.toLowerCase()] || 'No interpretation available',
            };
          }).filter(aspect => aspect !== null) as TransformedAspect[]
        : [];
        
        // Add debug logging
        console.log("[useAstroData] First 3 transformed aspects:", mappedAspects.slice(0, 3));
      console.log(
        "[useAstroData/transformedData] Finished mapping aspects:",
        JSON.stringify(mappedAspects, null, 2),
      );

      // Map planet interpretations - handle both API response formats
      const planetInterpretations: Record<string, string> = {};

      // Use any type to handle different interpretations structures
      const anyInterpretations = interpretations as any;

      // Handle flat structure
      if (anyInterpretations && typeof anyInterpretations === "object") {
        Object.keys(anyInterpretations).forEach((key) => {
          if (
            key !== "aspects" &&
            key !== "planets" &&
            typeof anyInterpretations[key] === "string"
          ) {
            planetInterpretations[key] = anyInterpretations[key];
          }
        });
      }

      // Handle nested structure
      if (
        anyInterpretations?.planets &&
        typeof anyInterpretations.planets === "object"
      ) {
        Object.keys(anyInterpretations.planets).forEach((key) => {
          const planetInterp = anyInterpretations.planets[key];
          if (typeof planetInterp === "object" && planetInterp.interpretation) {
            planetInterpretations[key] = planetInterp.interpretation;
          } else if (typeof planetInterp === "string") {
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
        voidMoon: void_of_course_moon
          ? {
              isVoid: void_of_course_moon.is_void,
              start: void_of_course_moon.start,
              end: void_of_course_moon.end,
              nextSign: void_of_course_moon.next_sign,
            }
          : undefined,
        aspects: mappedAspects,
        elements,
        modalities,
        astroWeather: astro_weather,
        interpretations: {
          planets: planetInterpretations,
          aspects: interpretations?.aspects || [],
        },
        cusps: cusps || [], // Add this line to include the cusps array from backend, with fallback to empty array if missing
        ...rest, // allow extensibility for unique player profiles
      };
      console.log(
        "[useAstroData/transformedData] Successfully transformed data:",
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      console.error(
        "[useAstroData/transformedData] Error during transformation:",
        error,
        "Original apiData:",
        JSON.stringify(apiData, null, 2),
      );
      return null;
    }
  }, [apiData]);

  return {
    astroData: transformedData,
    loading: isLoading,
    error: error as Error,
    refreshData,
  };
};

export default useAstroData;

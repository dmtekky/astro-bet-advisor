/**
 * Enhanced Astrological Data Hook
 *
 * This hook fetches and transforms astrological data from the API,
 * providing a clean, typed interface for components.
 */
import { useMemo, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@supabase/supabase-js";
import type {
  AspectType,
  CelestialBody,
  ZodiacSign,
  MoonPhaseInfo,
} from "../types/astrology";
import * as z from "zod"; // Import Zod

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
import { getMoonPhase, getMoonPhaseInfo } from "../lib/astroCalculations";

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
  // Always use our accurate moon phase calculation
  const now = new Date();

  try {
    const moonInfo = getMoonPhaseInfo(undefined, now);

    // Create a properly typed MoonPhaseInfo object
    const moonPhaseInfo: MoonPhaseInfo = {
      name: moonInfo.name,
      value: moonInfo.phase,
      illumination: moonInfo.illumination / 100, // Convert to 0-1 range
      nextFullMoon: new Date(moonInfo.nextFullMoon),
      ageInDays: moonInfo.ageInDays,
      phaseType: moonInfo.phaseType,
    };

    return moonPhaseInfo;
  } catch (error) {
    console.error("Error processing moon phase:", error);
    // Return a safe default in case of errors
    const defaultDate = new Date(now.getTime() + 29.53 * 24 * 60 * 60 * 1000); // ~30 days from now

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
    dateStr =
      typeof dateParam === "string"
        ? dateParam
        : dateParam.toISOString().split("T")[0];
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
          } catch (refreshError) {
            console.error(
              "[useAstroData] Error during session refresh/retry:",
              refreshError,
            );
            throw new Error(
              `Failed to refresh session: ${refreshError.message}`,
            );
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
      // Don't retry on 403 (permission denied) as it's likely an auth issue
      if (error.message.includes("403")) {
        console.log("[useAstroData] Not retrying 403 error");
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
  } = useSWR(swrKey, fetcher, swrOptions);

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    // mutate();
  }, []);

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
      });

      // Validate and parse API response
      const parseResult = AstroDataSchema.safeParse(apiData);
      if (!parseResult.success) {
        console.error("[useAstroData] API response validation failed:", {
          error: parseResult.error,
          response: apiData,
        });

        // Return minimal valid structure
        return {
          date,
          planets: {},
          aspects: [],
          elements: undefined,
          sunSign: undefined,
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
            // Use any type to handle different interpretations structures
            const anyInterpretations = interpretations as any;
            const interpretation =
              anyInterpretations?.planets?.[planetKey]?.interpretation ||
              anyInterpretations?.[planetKey] ||
              undefined;

            planetData[planetKey] = {
              name: value.name || key,
              longitude: value.longitude || 0,
              sign: value.sign as ZodiacSign,
              // Handle both degree and degrees properties
              degree: value.degree || value.degrees || 0,
              retrograde: Boolean(value.retrograde),
              speed: 1, // Default speed (required by CelestialBody type)
              interpretation: interpretation,
            };
          }
        });
      }

      // Map aspects
      const mappedAspects = Array.isArray(aspects)
        ? (aspects
            .map((rawAspect: RawApiAspect, index) => {
              console.log(
                `[useAstroData/transformedData/aspects] Processing raw aspect ${index}:`,
                JSON.stringify(rawAspect),
              );

              const p1Name = rawAspect.planet1?.toLowerCase();
              const p2Name = rawAspect.planet2?.toLowerCase();
              const aspectType = rawAspect.aspect?.toLowerCase();

              if (!p1Name || !p2Name || !aspectType) {
                console.warn(
                  `[useAstroData/transformedData/aspects] Skipping aspect ${index} due to missing planet names or aspect type.`,
                  rawAspect,
                );
                return null; // Or a default/empty aspect object
              }

              const planet1 = planetData[p1Name];
              const planet2 = planetData[p2Name];

              if (!planet1 || !planet2) {
                console.warn(
                  `[useAstroData/transformedData/aspects] Skipping aspect ${index} because one or both planets ('${p1Name}', '${p2Name}') not found in planetData. Raw aspect:`,
                  rawAspect,
                  "PlanetData keys:",
                  Object.keys(planetData),
                );
                return null;
              }

              console.log(
                `[useAstroData/transformedData/aspects] Mapped planets for aspect ${index}:`,
                planet1.name,
                planet2.name,
              );

              const influence =
                rawAspect.strength != null
                  ? `${Math.round(rawAspect.strength * 100)}%`
                  : "N/A";

              let interpretationText = "";
              if (
                interpretations?.aspects &&
                Array.isArray(interpretations.aspects)
              ) {
                const foundInterpretation = interpretations.aspects.find(
                  (interp: RawApiAspectInterpretation) => {
                    const interpP1 = interp.planet1?.toLowerCase();
                    const interpP2 = interp.planet2?.toLowerCase();
                    const interpAspect = interp.aspect?.toLowerCase();
                    return (
                      (interpP1 === p1Name &&
                        interpP2 === p2Name &&
                        interpAspect === aspectType) ||
                      (interpP1 === p2Name &&
                        interpP2 === p1Name &&
                        interpAspect === aspectType) // Check reversed order
                    );
                  },
                );
                if (foundInterpretation && foundInterpretation.interpretation) {
                  interpretationText = foundInterpretation.interpretation;
                  console.log(
                    `[useAstroData/transformedData/aspects] Found interpretation for ${p1Name}-${aspectType}-${p2Name}: "${interpretationText}"`,
                  );
                } else {
                  console.log(
                    `[useAstroData/transformedData/aspects] No interpretation found for ${p1Name}-${aspectType}-${p2Name} from API. Searched in:`,
                    interpretations.aspects,
                  );

                  // Client-side fallback for missing interpretations
                  const fallbackKey = `${p1Name}-${aspectType}-${p2Name}`;
                  const reversedFallbackKey = `${p2Name}-${aspectType}-${p1Name}`;

                  // Organized fallbacks by planet combinations
                  const knownFallbacks: Record<string, string> = {
                    // Uranus-Pluto aspects
                    "uranus-sextile-pluto":
                      "Uranus sextile Pluto: This aspect fosters transformative breakthroughs and innovative approaches to deep-seated issues. It encourages embracing change and using personal power constructively to evolve societal structures or personal paradigms.",
                    "pluto-sextile-uranus":
                      "Pluto sextile Uranus: This aspect fosters transformative breakthroughs and innovative approaches to deep-seated issues. It encourages embracing change and using personal power constructively to evolve societal structures or personal paradigms.",
                    "uranus-trine-pluto":
                      "Uranus trine Pluto: This harmonious aspect brings powerful transformative energy and the ability to revolutionize structures in a flowing, natural way. It supports positive change that respects deeper truths and facilitates evolution without unnecessary destruction.",
                    "pluto-trine-uranus":
                      "Pluto trine Uranus: This harmonious aspect brings powerful transformative energy and the ability to revolutionize structures in a flowing, natural way. It supports positive change that respects deeper truths and facilitates evolution without unnecessary destruction.",

                    // Neptune-Pluto aspects
                    "neptune-sextile-pluto":
                      "Neptune sextile Pluto: This aspect blends spiritual awareness with transformative power. It offers opportunities to dissolve outdated structures and replace them with more spiritually aligned approaches. Intuition and deep psychological insights work together harmoniously.",
                    "pluto-sextile-neptune":
                      "Pluto sextile Neptune: This aspect blends transformative power with spiritual awareness. It offers opportunities to dissolve outdated structures and replace them with more spiritually aligned approaches. Deep psychological insights and intuition work together harmoniously.",

                    // Uranus-Neptune aspects
                    "uranus-sextile-neptune":
                      "Uranus sextile Neptune: This aspect creates opportunities to blend innovation with spiritual insight. It supports bringing visionary ideas into practical reality and finding unconventional solutions to spiritual or compassionate endeavors.",
                    "neptune-sextile-uranus":
                      "Neptune sextile Uranus: This aspect creates opportunities to blend spiritual insight with innovation. It supports bringing visionary ideas into practical reality and finding compassionate approaches to technological or progressive endeavors.",
                  };

                  if (knownFallbacks[fallbackKey]) {
                    interpretationText = knownFallbacks[fallbackKey];
                    console.log(
                      `[useAstroData/transformedData/aspects] Used client-side fallback for ${fallbackKey}: "${interpretationText}"`,
                    );
                  } else if (knownFallbacks[reversedFallbackKey]) {
                    interpretationText = knownFallbacks[reversedFallbackKey];
                    console.log(
                      `[useAstroData/transformedData/aspects] Used client-side fallback for ${reversedFallbackKey} (reversed): "${interpretationText}"`,
                    );
                  }
                }
              } else {
                console.log(
                  `[useAstroData/transformedData/aspects] interpretations.aspects is not an array or is missing.`,
                );
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
            })
            .filter((aspect) => aspect !== null) as TransformedAspect[]) // Remove any skipped aspects and assert type
        : [];
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

/**
 * Geocoding Service
 * 
 * This service provides geocoding functionality to convert location names to coordinates.
 * It uses multiple providers with fallback support and includes caching for performance.
 * 
 * Features:
 * - Multiple geocoding providers (Nominatim as primary, Google Maps as fallback)
 * - Local storage caching with TTL (time-to-live) of 30 days
 * - Rate limiting to prevent API abuse
 * - Error handling and standardized error format
 * - Automatic cache management to prevent storage overflow
 * - Standardized result format across providers
 * 
 * Usage:
 * ```typescript
 * import { geocodeLocation } from '@/services/geocoding';
 * 
 * // Basic usage
 * const coordinates = await geocodeLocation('New York');
 * console.log(coordinates.latitude, coordinates.longitude);
 * 
 * // With options
 * const coordinates = await geocodeLocation('New York', { 
 *   forceRefresh: true,  // Skip cache
 *   provider: 'google'    // Force specific provider
 * });
 * ```
 * 
 * Primary provider: OpenStreetMap Nominatim API
 * Fallback provider: Google Maps Geocoding API (requires API key)
 */

// Types for geocoding responses and requests
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  timezoneOffset?: number;
  raw: any; // Raw response from the geocoding service
  provider?: string; // Which provider returned this result
}

export interface GeocodingError {
  message: string;
  code: string;
  raw?: any;
}

export interface GeocodingOptions {
  limit?: number;
  language?: string;
  countryCode?: string;
  skipCache?: boolean;
  providers?: string[];
  googleMapsApiKey?: string;
}

// Cache interface
interface CacheEntry {
  result: GeocodingResult;
  timestamp: number;
  expiresAt: number;
}

// Cache configuration
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const CACHE_KEY_PREFIX = 'geocode_';
const CACHE_VERSION = 'v1'; // Increment this when cache format changes

// Provider configuration
const PROVIDERS = {
  NOMINATIM: 'nominatim',
  GOOGLE: 'google',
};

// Default provider order
const DEFAULT_PROVIDERS = [PROVIDERS.NOMINATIM, PROVIDERS.GOOGLE];

// Rate limiting configuration
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (Nominatim requirement)
let lastRequestTime = 0;

/**
 * Geocode a location string to coordinates
 * 
 * @param locationString - The location to geocode (e.g., "New York, NY")
 * @param options - Optional parameters for the geocoding request
 * @returns Promise resolving to geocoding result
 */
export async function geocodeLocation(
  locationString: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult> {
  // Normalize and validate input
  const normalizedLocation = locationString.trim();
  if (!normalizedLocation) {
    throw createError('Empty location string provided', 'INVALID_INPUT');
  }

  // Determine which providers to use
  const providers = options.providers || DEFAULT_PROVIDERS;
  
  // Check cache first (unless skipCache is true)
  if (!options.skipCache) {
    const cachedResult = getCachedResult(normalizedLocation);
    if (cachedResult) {
      console.log('Using cached geocoding result for:', normalizedLocation);
      return cachedResult;
    }
  }

  // Try each provider in sequence until one succeeds
  let lastError: any = null;
  
  for (const provider of providers) {
    try {
      let result: GeocodingResult;
      
      switch (provider) {
        case PROVIDERS.NOMINATIM:
          result = await geocodeWithNominatim(normalizedLocation);
          break;
        case PROVIDERS.GOOGLE:
          const apiKey = options.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            throw createError('Google Maps API key is required', 'MISSING_API_KEY');
          }
          result = await geocodeWithGoogle(normalizedLocation, apiKey);
          break;
        default:
          console.warn(`Unknown geocoding provider: ${provider}`);
          continue;
      }
      
      // Cache successful result
      if (!options.skipCache) {
        cacheResult(normalizedLocation, result);
      }
      
      return result;
    } catch (error) {
      console.error(`Geocoding with ${provider} failed:`, error);
      lastError = error;
      // Continue to next provider
    }
  }
  
  // If we get here, all providers failed
  throw lastError || createError('All geocoding providers failed', 'GEOCODING_FAILED');
}

/**
 * Geocode using Nominatim (OpenStreetMap)
 * 
 * @param location - The location string to geocode
 * @returns A standardized geocoding result
 */
async function geocodeWithNominatim(location: string): Promise<GeocodingResult> {
  try {
    // Build the URL with query parameters
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('format', 'json');
    url.searchParams.append('q', location);
    url.searchParams.append('addressdetails', '1');
    url.searchParams.append('limit', '1');
    
    // Add delay if needed to respect rate limits
    await applyRateLimiting();
    
    // Make the API request with timeout and retry logic
    let response;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        response = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'AstroBetAdvisor/1.0',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) break;
        
        // If we get rate limited (429) or server error (5xx), wait and retry
        if (response.status === 429 || response.status >= 500) {
          retries--;
          if (retries > 0) {
            console.log(`Geocoding API returned ${response.status}, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            continue;
          }
        }
        
        break;
      } catch (err) {
        retries--;
        if (retries > 0) {
          console.log(`Geocoding API request failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }
        throw err;
      }
    }
    
    if (!response.ok) {
      throw createError(
        `Nominatim API error: ${response.status} ${response.statusText}`,
        'API_ERROR',
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw createError(
        `No results found for location: ${location}`,
        'NO_RESULTS'
      );
    }
    
    // Process the first result
    const result = processNominatimResult(data[0]);
    result.provider = PROVIDERS.NOMINATIM;
    
    return result;
  } catch (error: unknown) {
    console.error('Nominatim geocoding error:', error);
    
    // Rethrow with standardized format
    if (error && typeof error === 'object' && 'code' in error) {
      throw error; // Already in our error format
    } else {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Unknown error';
      
      throw createError(
        `Nominatim geocoding failed: ${errorMessage}`,
        'GEOCODING_FAILED',
        { originalError: error }
      );
    }
  }
}

/**
 * Geocode using Google Maps API
 * 
 * @param location - The location string to geocode
 * @param apiKey - Google Maps API key
 * @returns A standardized geocoding result
 */
async function geocodeWithGoogle(
  location: string,
  apiKey: string
): Promise<GeocodingResult> {
  if (!apiKey) {
    throw createError('Google Maps API key is required', 'MISSING_API_KEY');
  }
  
  try {
    // Construct the API URL
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    
    // Make the API request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw createError(
        `Google Maps API error: ${response.status} ${response.statusText}`,
        'API_ERROR',
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw createError(
        `No results found for location: ${location}`,
        'NO_RESULTS'
      );
    }
    
    // Process the first result
    const result = processGoogleResult(data.results[0]);
    result.provider = PROVIDERS.GOOGLE;
    
    return result;
  } catch (error: unknown) {
    console.error('Google Maps geocoding error:', error);
    
    // Rethrow with standardized format
    if (error && typeof error === 'object' && 'code' in error) {
      throw error; // Already in our error format
    } else {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Unknown error';
      
      throw createError(
        `Google Maps geocoding failed: ${errorMessage}`,
        'GEOCODING_FAILED',
        { originalError: error }
      );
    }
  }
}

/**
 * Get timezone information for coordinates
 * 
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Promise resolving to timezone offset in minutes
 */
export async function getTimezoneOffset(
  latitude: number,
  longitude: number
): Promise<number> {
  // For now, we'll use a simple approach that gets the current timezone offset
  // In a production app, you'd want to use a proper timezone API that can handle historical dates
  try {
    const response = await fetch(
      `https://secure.geonames.org/timezoneJSON?lat=${latitude}&lng=${longitude}&username=demo`
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.rawOffset !== undefined) {
      // Convert hours to minutes
      return Math.round(data.rawOffset * 60);
    }
    
    throw new Error('Timezone data not found');
  } catch (error) {
    console.error('Timezone error:', error);
    // Return a default offset as fallback (UTC)
    return 0;
  }
}

/**
 * Reverse geocode coordinates to an address
 * 
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @param options - Optional parameters for the geocoding request
 * @returns Promise resolving to geocoding result
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  options: GeocodingOptions = {}
): Promise<GeocodingResult> {
  // Validate input
  if (isNaN(latitude) || isNaN(longitude)) {
    throw createError('Invalid coordinates provided', 'INVALID_INPUT');
  }

  // Check cache
  const cacheKey = `${latitude},${longitude}`;
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Apply rate limiting
  await applyRateLimiting();

  try {
    // Construct the API URL
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      addressdetails: '1',
    });

    if (options.language) {
      params.append('accept-language', options.language);
    }

    // Make the API request
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'AstroBetAdvisor/1.0',
        },
      }
    );

    // Handle HTTP errors
    if (!response.ok) {
      throw createError(
        `Reverse geocoding API returned ${response.status}: ${response.statusText}`,
        'API_ERROR',
        { status: response.status }
      );
    }

    // Parse the response
    const data = await response.json();

    // Handle error response
    if (data.error) {
      throw createError(data.error, 'API_ERROR');
    }

    // Process the result
    const result = processNominatimResult(data);

    // Cache the result
    cacheResult(cacheKey, result);

    return result;
  } catch (error) {
    // Handle fetch errors
    if (error.name === 'AbortError') {
      throw createError('Reverse geocoding request timed out', 'TIMEOUT');
    }

    // Re-throw our custom errors
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Handle other errors
    console.error('Reverse geocoding error:', error);
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : 'Unknown error';
    
    throw createError(
      `Failed to reverse geocode coordinates: ${errorMessage}`,
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }
}

/**
 * Process a Nominatim API result into our standard format
 */
function processNominatimResult(data: any): GeocodingResult {
  const { lat, lon, display_name, address } = data;
  
  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
    displayName: display_name,
    city: address?.city || address?.town || address?.village || address?.hamlet,
    state: address?.state,
    country: address?.country,
    provider: PROVIDERS.NOMINATIM,
    raw: data
  };
}

/**
 * Process a Google Maps API result into our standard format
 */
function processGoogleResult(data: any): GeocodingResult {
  const { geometry, formatted_address, address_components } = data;
  
  // Extract address components
  const getComponent = (type: string) => {
    const component = address_components?.find((c: any) => 
      c.types.includes(type)
    );
    return component?.long_name;
  };
  
  return {
    latitude: geometry.location.lat,
    longitude: geometry.location.lng,
    displayName: formatted_address,
    city: getComponent('locality') || getComponent('administrative_area_level_3'),
    state: getComponent('administrative_area_level_1'),
    country: getComponent('country'),
    provider: PROVIDERS.GOOGLE,
    raw: data
  };
}

/**
 * Create a standardized error object
 */
function createError(message: string, code: string, details: any = {}): GeocodingError {
  return {
    message,
    code,
    ...details,
  };
}

/**
 * Apply rate limiting to respect API usage policies
 */
async function applyRateLimiting(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Get a cached geocoding result
 */
function getCachedResult(key: string): GeocodingResult | null {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${key}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const entry: CacheEntry = JSON.parse(cachedData);
    
    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Update access time to extend TTL for frequently used items
    // but don't write to localStorage on every access (performance optimization)
    if (entry.expiresAt - Date.now() < CACHE_TTL / 2) {
      // Only refresh if we're in the second half of the TTL period
      entry.expiresAt = Date.now() + CACHE_TTL;
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    }
    
    return entry.result;
  } catch (error) {
    console.error('Error retrieving from geocoding cache:', error);
    return null;
  }
}

/**
 * Cache a geocoding result
 */
function cacheResult(key: string, result: GeocodingResult): void {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${key}`;
    const now = Date.now();
    const entry: CacheEntry = {
      result,
      timestamp: now,
      expiresAt: now + CACHE_TTL
    };
    
    // Check if we're approaching storage limits
    if (isStorageNearlyFull()) {
      // Clear older entries to make room
      clearOldestCacheEntries();
    }
    
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error('Error storing geocoding result in cache:', error);
    // Non-fatal error, continue without caching
    
    // If it's a quota error, clear some space
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldestCacheEntries(20); // Clear more entries
    }
  }
}

/**
 * Clear the geocoding cache
 * 
 * @param olderThan - Optional timestamp, only clear entries older than this
 */
export function clearGeocodingCache(olderThan?: number): void {
  try {
    const keysToRemove: string[] = [];
    
    // Collect keys to remove (we can't remove while iterating)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        if (olderThan) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const entry = JSON.parse(data) as CacheEntry;
              if (entry.timestamp < olderThan) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        } else {
          // No timestamp filter, remove all
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove collected keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`Geocoding cache cleared: ${keysToRemove.length} entries removed`);
  } catch (error) {
    console.error('Error clearing geocoding cache:', error);
  }
}

/**
 * Check if localStorage is nearly full
 */
function isStorageNearlyFull(threshold = 0.9): boolean {
  try {
    // Estimate storage usage by checking existing keys
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }
    
    // Typical localStorage limit is 5MB (5 * 1024 * 1024)
    // We'll use a conservative estimate
    const estimatedLimit = 4 * 1024 * 1024; // 4MB
    
    return totalSize > threshold * estimatedLimit;
  } catch (error) {
    console.error('Error checking storage capacity:', error);
    return false; // Assume not full on error
  }
}

/**
 * Clear oldest cache entries to free up space
 */
function clearOldestCacheEntries(count = 10): void {
  try {
    const cacheEntries: {key: string; timestamp: number}[] = [];
    
    // Collect all geocoding cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const entry = JSON.parse(data) as CacheEntry;
            cacheEntries.push({
              key,
              timestamp: entry.timestamp
            });
          }
        } catch (e) {
          // If entry is corrupted, remove it
          localStorage.removeItem(key);
        }
      }
    }
    
    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries
    const entriesToRemove = Math.min(count, cacheEntries.length);
    for (let i = 0; i < entriesToRemove; i++) {
      localStorage.removeItem(cacheEntries[i].key);
    }
    
    console.log(`Cleared ${entriesToRemove} old geocoding cache entries`);
  } catch (error) {
    console.error('Error clearing cache entries:', error);
  }
}

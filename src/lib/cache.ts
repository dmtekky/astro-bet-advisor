import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with fallback behavior
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('Supabase environment variables not found. Server-side caching will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Cache TTLs
const BROWSER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const SERVER_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Cache keys
const getAstroCacheKey = (date: string, sidereal: boolean) => `astro_${date}_${sidereal}`;
const getLastFetchKey = (date: string, sidereal: boolean) => `last_fetch_${date}_${sidereal}`;

// Browser cache functions
const getBrowserCache = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > BROWSER_CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from browser cache:', error);
    return null;
  }
};

const setBrowserCache = (key: string, data: any): void => {
  try {
    const item = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error writing to browser cache:', error);
  }
};

// Server cache functions
const getServerCache = async (date: string, sidereal: boolean): Promise<any> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('astro_cache')
      .select('*')
      .eq('date', date)
      .eq('sidereal', sidereal)
      .single();

    if (error) {
      console.error('Error fetching from server cache:', error);
      return null;
    }

    if (!data) return null;

    // Check if cache is expired
    const cacheAge = Date.now() - new Date(data.updated_at as string).getTime();
    if (cacheAge > SERVER_CACHE_TTL) {
      // Delete expired cache entry
      await supabase
        .from('astro_cache')
        .delete()
        .eq('date', date)
        .eq('sidereal', sidereal);
      return null;
    }

    return JSON.parse(data.data as string);
  } catch (error) {
    console.error('Error accessing server cache:', error);
    return null;
  }
};

const setServerCache = async (date: string, sidereal: boolean, data: any): Promise<void> => {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('astro_cache')
      .upsert({
        date,
        sidereal,
        data: JSON.stringify(data),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error writing to server cache:', error);
    }
  } catch (error) {
    console.error('Error accessing server cache:', error);
  }
};

// Clear expired cache entries
const clearExpiredCache = async (): Promise<void> => {
  if (!supabase) return;

  try {
    const cutoff = new Date(Date.now() - SERVER_CACHE_TTL).toISOString();
    const { error } = await supabase
      .from('astro_cache')
      .delete()
      .lt('updated_at', cutoff);

    if (error) {
      console.error('Error clearing expired cache:', error);
    }
  } catch (error) {
    console.error('Error accessing server cache:', error);
  }
};

// Main cache functions
export const getCachedAstroData = async (date: string, sidereal: boolean): Promise<any> => {
  // Try browser cache first
  const cacheKey = getAstroCacheKey(date, sidereal);
  const browserData = getBrowserCache(cacheKey);
  if (browserData) return browserData;

  // Try server cache
  const serverData = await getServerCache(date, sidereal);
  if (serverData) {
    // Update browser cache with server data
    setBrowserCache(cacheKey, serverData);
    return serverData;
  }

  return null;
};

export const setCachedAstroData = async (date: string, sidereal: boolean, data: any): Promise<void> => {
  const cacheKey = getAstroCacheKey(date, sidereal);
  
  // Set browser cache
  setBrowserCache(cacheKey, data);
  
  // Set server cache
  await setServerCache(date, sidereal, data);
}; 
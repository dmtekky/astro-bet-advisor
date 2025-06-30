/**
 * Geocoding Context
 * 
 * This context provides geocoding functionality throughout the app,
 * including loading states, error handling, and caching.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  geocodeLocation, 
  reverseGeocode, 
  getTimezoneOffset,
  GeocodingResult, 
  GeocodingError, 
  GeocodingOptions 
} from '@/services/geocoding';

// Context interface
interface GeocodingContextType {
  // Geocoding functions
  geocode: (location: string, options?: GeocodingOptions) => Promise<GeocodingResult>;
  reverseGeocode: (lat: number, lng: number, options?: GeocodingOptions) => Promise<GeocodingResult>;
  getTimezone: (lat: number, lng: number) => Promise<number>;
  
  // State
  isLoading: boolean;
  error: GeocodingError | null;
  lastResult: GeocodingResult | null;
  data: GeocodingResult[];
  
  // Actions
  clearError: () => void;
  clearLastResult: () => void;
}

// Create the context
const GeocodingContext = createContext<GeocodingContextType | undefined>(undefined);

// Provider props
interface GeocodingProviderProps {
  children: ReactNode;
}

/**
 * Geocoding Provider Component
 */
export const GeocodingProvider: React.FC<GeocodingProviderProps> = ({ children }) => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeocodingError | null>(null);
  const [lastResult, setLastResult] = useState<GeocodingResult | null>(null);
  const [data, setData] = useState<GeocodingResult[]>([]);

  // Geocode a location string
  const geocode = useCallback(async (
    location: string,
    options?: GeocodingOptions
  ): Promise<GeocodingResult> => {
    setIsLoading(true);
    setError(null);
    setData([]); // Clear previous data
    try {
      const result = await geocodeLocation(location, options);
      setLastResult(result);
      setData(result ? [result] : []); 
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as GeocodingError);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Reverse geocode coordinates
  const reverseGeocode = useCallback(async (
    lat: number,
    lng: number,
    options?: GeocodingOptions
  ): Promise<GeocodingResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await reverseGeocode(lat, lng, options);
      setLastResult(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as GeocodingError);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Get timezone offset
  const getTimezone = useCallback(async (
    lat: number,
    lng: number
  ): Promise<number> => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = await getTimezoneOffset(lat, lng);
      setIsLoading(false);
      return offset;
    } catch (err) {
      setError(err as GeocodingError);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear last result
  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);

  // Context value
  const contextValue = {
    geocode,
    reverseGeocode,
    getTimezone,
    isLoading,
    error,
    lastResult,
    data,
    clearError,
    clearLastResult,
  };

  return (
    <GeocodingContext.Provider value={contextValue}>
      {children}
    </GeocodingContext.Provider>
  );
};

/**
 * Hook to use the geocoding context
 */
export const useGeocoding = (): GeocodingContextType => {
  const context = useContext(GeocodingContext);
  
  if (context === undefined) {
    throw new Error('useGeocoding must be used within a GeocodingProvider');
  }
  
  return context;
};

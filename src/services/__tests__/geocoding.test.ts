import { geocodeLocation, clearGeocodingCache } from '../geocoding';
import fetchMock from 'jest-fetch-mock';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    length: jest.fn(() => Object.keys(store).length),
  };
})();

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('Geocoding Service', () => {
  beforeAll(() => {
    // Enable fetch mocks
    fetchMock.enableMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock console methods to prevent noise in test output
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    // Clear mocks and localStorage before each test
    fetchMock.resetMocks();
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('geocodeLocation', () => {
    it('should return geocoding results from Nominatim API', async () => {
      // Mock successful Nominatim API response
      fetchMock.mockResponseOnce(JSON.stringify([{
        lat: '40.7128',
        lon: '-74.0060',
        display_name: 'New York, United States',
        address: {
          city: 'New York',
          state: 'New York',
          country: 'United States'
        }
      }]));

      const result = await geocodeLocation('New York');

      // Verify the result
      expect(result).toBeDefined();
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.0060);
      expect(result.displayName).toBe('New York, United States');
      expect(result.city).toBe('New York');
      expect(result.provider).toBe('nominatim');

      // Verify the API was called with correct parameters
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const fetchUrl = fetchMock.mock.calls[0][0] as string;
      expect(fetchUrl).toContain('nominatim.openstreetmap.org');
      expect(fetchUrl).toContain('New%20York');
    });

    it('should return cached results if available', async () => {
      // First, mock a successful API call
      fetchMock.mockResponseOnce(JSON.stringify([{
        lat: '40.7128',
        lon: '-74.0060',
        display_name: 'New York, United States',
        address: {
          city: 'New York',
          state: 'New York',
          country: 'United States'
        }
      }]));

      // First call should hit the API
      await geocodeLocation('New York');

      // Reset fetch mock to verify it's not called again
      fetchMock.resetMocks();

      // Second call should use cache
      const result = await geocodeLocation('New York');

      // Verify the result
      expect(result).toBeDefined();
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.0060);

      // Verify the API was NOT called again
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should fall back to Google Maps API if Nominatim fails', async () => {
      // Mock environment variable for Google Maps API key
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key';

      // Mock Nominatim API failure
      fetchMock.mockRejectOnce(new Error('Nominatim API error'));

      // Mock successful Google Maps API response
      fetchMock.mockResponseOnce(JSON.stringify({
        results: [{
          geometry: {
            location: {
              lat: 40.7128,
              lng: -74.0060
            }
          },
          formatted_address: 'New York, NY, USA',
          address_components: [
            { long_name: 'New York', types: ['locality'] },
            { long_name: 'New York', types: ['administrative_area_level_1'] },
            { long_name: 'United States', types: ['country'] }
          ]
        }]
      }));

      const result = await geocodeLocation('New York');

      // Verify the result
      expect(result).toBeDefined();
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.0060);
      expect(result.provider).toBe('google');

      // Verify both APIs were called
      expect(fetchMock).toHaveBeenCalledTimes(2);
      
      // Clean up
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    });

    it('should throw an error if all geocoding providers fail', async () => {
      // Mock both APIs failing
      fetchMock.mockRejectOnce(new Error('Nominatim API error'));
      fetchMock.mockRejectOnce(new Error('Google Maps API error'));

      await expect(geocodeLocation('Invalid Location')).rejects.toThrow('Geocoding failed');
    });
  });

  describe('Cache Management', () => {
    it('should clear the geocoding cache', async () => {
      // First, populate the cache
      fetchMock.mockResponseOnce(JSON.stringify([{
        lat: '40.7128',
        lon: '-74.0060',
        display_name: 'New York, United States',
        address: {
          city: 'New York',
          state: 'New York',
          country: 'United States'
        }
      }]));

      await geocodeLocation('New York');
      
      // Verify cache was populated
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Clear the cache
      clearGeocodingCache();
      
      // Verify removeItem was called
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      
      // Reset fetch mock
      fetchMock.resetMocks();
      
      // Mock another successful API call
      fetchMock.mockResponseOnce(JSON.stringify([{
        lat: '40.7128',
        lon: '-74.0060',
        display_name: 'New York, United States',
        address: {
          city: 'New York',
          state: 'New York',
          country: 'United States'
        }
      }]));
      
      // Next geocode call should hit the API again since cache was cleared
      await geocodeLocation('New York');
      
      // Verify API was called
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

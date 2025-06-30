import { City, LocationSuggestion } from '@/types/location';
import citiesData from '@/data/cities.json';

const cities = citiesData as City[];

// Popular cities to show as examples
const POPULAR_CITIES = [
  'New York, US',
  'London, GB',
  'Tokyo, JP',
  'Paris, FR',
  'Sydney, AU',
  'Dubai, AE',
  'Singapore, SG',
  'Toronto, CA',
  'Berlin, DE',
  'Mumbai, IN'
];

// Minimum similarity score (0-1) to consider a fuzzy match
const MIN_SIMILARITY_SCORE = 0.6;

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  
  if (longerLength === 0) return 1.0;
  
  // If strings are very different in length, they're not similar
  if (longerLength - shorter.length > 3) return 0;
  
  // Check for direct inclusion (e.g., 'new york' in 'new york city')
  if (longer.toLowerCase().includes(shorter.toLowerCase())) {
    return 0.7 + (shorter.length / longerLength) * 0.3;
  }
  
  // Calculate Levenshtein distance
  const distance: number[][] = [];
  for (let i = 0; i <= longerLength; i++) {
    distance[i] = [i];
  }
  for (let j = 1; j <= shorter.length; j++) {
    distance[0][j] = j;
  }
  
  for (let i = 1; i <= longerLength; i++) {
    for (let j = 1; j <= shorter.length; j++) {
      const cost = longer[i - 1].toLowerCase() === shorter[j - 1].toLowerCase() ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + cost
      );
    }
  }
  
  const distanceValue = distance[longerLength][shorter.length];
  return 1.0 - distanceValue / Math.max(longerLength, shorter.length);
}

/**
 * Search for cities matching the query with fuzzy matching
 */
export function searchCities(query: string, limit = 5): { results: LocationSuggestion[]; hasExactMatch: boolean } {
  if (!query.trim()) return { results: [], hasExactMatch: false };
  
  const lowerQuery = query.toLowerCase().trim();
  const exactMatches: LocationSuggestion[] = [];
  const fuzzyMatches: Array<{city: LocationSuggestion, score: number}> = [];
  
  // First pass: look for exact matches
  for (const city of cities) {
    const cityName = city.name.toLowerCase();
    const adminName = city.admin1?.toLowerCase() || '';
    const countryName = city.country?.toLowerCase() || '';
    
    const fullName = `${cityName}, ${adminName ? adminName + ', ' : ''}${countryName}`.toLowerCase();
    
    // Check for exact matches in name, admin, or country
    if (cityName === lowerQuery || 
        adminName === lowerQuery || 
        countryName === lowerQuery ||
        fullName.includes(lowerQuery)) {
      exactMatches.push({
        ...city,
        formatted: `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}`
      });
      if (exactMatches.length >= limit) break;
      continue;
    }
    
    // Calculate fuzzy match score
    const nameScore = calculateSimilarity(cityName, lowerQuery);
    const adminScore = adminName ? calculateSimilarity(adminName, lowerQuery) : 0;
    const countryScore = countryName ? calculateSimilarity(countryName, lowerQuery) : 0;
    const maxScore = Math.max(nameScore, adminScore, countryScore);
    
    if (maxScore >= MIN_SIMILARITY_SCORE) {
      fuzzyMatches.push({
        city: {
          ...city,
          formatted: `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}`
        },
        score: maxScore
      });
    }
  }
  
  // If we have exact matches, return them
  if (exactMatches.length > 0) {
    return {
      results: exactMatches.slice(0, limit),
      hasExactMatch: true
    };
  }
  
  // Otherwise, return fuzzy matches sorted by score
  fuzzyMatches.sort((a, b) => b.score - a.score);
  return {
    results: fuzzyMatches.slice(0, limit).map(match => match.city),
    hasExactMatch: false
  };
}

/**
 * Get popular cities as examples
 */
export function getPopularCities(limit = 5): LocationSuggestion[] {
  const popular: LocationSuggestion[] = [];
  
  for (const cityStr of POPULAR_CITIES) {
    if (popular.length >= limit) break;
    const [name, countryCode] = cityStr.split(', ');
    const match = cities.find(c => 
      c.name === name && c.countryCode === countryCode
    );
    
    if (match) {
      popular.push({
        ...match,
        formatted: cityStr
      });
    }
  }
  
  return popular;
}

/**
 * Validate location input
 */
export function validateLocationInput(input: string): { isValid: boolean; error?: string } {
  if (!input.trim()) {
    return { 
      isValid: false, 
      error: 'Location is required. Try: New York, London, Tokyo' 
    };
  }
  
  // Basic validation - at least 2 characters, no special characters except spaces, commas, and hyphens
  const locationRegex = /^[\p{L}\s,'-]{2,}$/u;
  if (!locationRegex.test(input)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid location (letters, spaces, commas, hyphens only). Try: Paris, Tokyo, or New York' 
    };
  }
  
  // Check if the input is too short for meaningful search
  if (input.trim().length < 2) {
    return {
      isValid: false,
      error: 'Please enter at least 2 characters'
    };
  }
  
  return { isValid: true };
}

/**
 * Get suggestions for similar city names
 */
export function getSimilarCitySuggestions(query: string, limit = 3): string[] {
  if (!query.trim() || query.trim().length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();
  
  // Try to find cities with similar names
  for (const city of cities) {
    const cityName = city.name.toLowerCase();
    if (cityName.startsWith(lowerQuery[0])) { // Only check cities starting with same letter for performance
      const similarity = calculateSimilarity(cityName, lowerQuery);
      if (similarity > 0.7) { // Higher threshold for spelling corrections
        suggestions.add(city.name);
        if (suggestions.size >= limit) break;
      }
    }
  }
  
  return Array.from(suggestions);
}

/**
 * Format location for display
 */
export function formatLocation(city: City): string {
  return `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}`;
}

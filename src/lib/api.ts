// API utility functions for making requests to our backend

// Use the API server URL (default to localhost:3001 if not specified)
const API_BASE_URL = 'http://localhost:3001';

/**
 * Fetch data from the API with proper error handling
 * @param endpoint - The API endpoint to fetch from (without the base URL)
 * @returns Promise with the JSON response
 */
export async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Fetching from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Fetch all news articles
 * @returns Promise with the news articles data
 */
export async function fetchNewsArticles() {
  return fetchFromApi<{articles: any[]}>('/api/news');
}

/**
 * Fetch a specific news article by slug
 * @param slug - The article slug
 * @returns Promise with the article data
 */
export async function fetchNewsArticle(slug: string) {
  return fetchFromApi<any>(`/api/news/${slug}`);
}

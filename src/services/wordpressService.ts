import axios, { AxiosError } from 'axios';
import he from 'he'; // Import the HTML entities decoder library

// WordPress API base URL
const API_BASE_URL = 'https://fmowp.wasmer.app/wp-json/wp/v2';
const JWT_AUTH_URL = 'https://fmowp.wasmer.app/wp-json/jwt-auth/v1/token';

// Configure axios with defaults for WordPress API
const wpAxios = axios.create({
  baseURL: 'https://fmowp.wasmer.app/wp-json/wp/v2',
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor for debugging
wpAxios.interceptors.response.use(
  response => {
    console.log(`WordPress API response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    console.error('WordPress API error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interface for WordPress post data
export interface WordPressPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  tags: number[]; // Add tags property
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url: string;
      avatar_urls: Record<string, string>;
    }>;
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>;
  };
}

// Interface for processed blog post data
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  description: string;
  image: string;
  imageAlt: string;
  author: string;
  publishedAt: string;
  tags?: string[];
}

/**
 * Authenticate with WordPress using JWT
 * @returns JWT token
 */
export const authenticateWithWordPress = async (username: string, password: string) => {
  try {
    console.log('Authenticating with WordPress JWT');
    const response = await axios.post(JWT_AUTH_URL, {
      username,
      password
    });
    
    console.log('Authentication successful');
    return response.data.token;
  } catch (error: any) {
    console.error('WordPress authentication error:', error?.response?.data || error.message);
    throw new Error('Failed to authenticate with WordPress');
  }
};

// Cache for posts to avoid redundant API calls
let postsCache: BlogPost[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Fetch all published posts from WordPress with caching
 * @param forceRefresh Force refresh the cache
 * @returns Array of processed blog posts
 */
export const fetchPosts = async (forceRefresh = false): Promise<BlogPost[]> => {
  const now = Date.now();
  
  // Return cached posts if available and not expired
  if (!forceRefresh && postsCache && now - lastFetchTime < CACHE_TTL) {
    console.log('Using cached posts data');
    return postsCache;
  }
  
  try {
    console.log('Fetching all posts from WordPress API');
    const response = await wpAxios.get('/posts', {
      params: {
        per_page: 20, // Reduced from 100 to 20 posts per page
        status: 'publish',
        _embed: true // Get embedded data in one request
      },
      timeout: 15000
    });
    
    const posts: WordPressPost[] = response.data;
    const processedPosts = posts.map(processWordPressPost);
    
    // Update cache
    postsCache = processedPosts;
    lastFetchTime = now;
    
    return processedPosts;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error('Timeout error fetching WordPress posts. Consider checking network or API server.');
      } else {
        console.error('Error fetching WordPress posts:', error);
      }
    } else {
      console.error('Unexpected error fetching WordPress posts:', error);
    }
    
    // Return cached posts if available, even if expired
    if (postsCache) {
      console.log('Returning stale cached posts due to fetch error');
      return postsCache;
    }
    
    return []; // Return empty array on error to avoid crashing the app
  }
};

export const fetchAllPosts = async (): Promise<BlogPost[]> => {
  // This function is kept for backward compatibility if needed, or can be removed
  return fetchPosts();
};

// Cache for individual posts
const postCache: Record<string, { post: BlogPost, timestamp: number }> = {};

/**
 * Fetch a single post by slug with caching
 * @param slug Post slug
 * @param forceRefresh Force refresh the cache
 * @returns Processed blog post
 */
export const fetchPostBySlug = async (slug: string, forceRefresh = false): Promise<BlogPost | null> => {
  const now = Date.now();
  
  // Return cached post if available and not expired
  if (!forceRefresh && postCache[slug] && now - postCache[slug].timestamp < CACHE_TTL) {
    console.log(`Using cached data for post: ${slug}`);
    return postCache[slug].post;
  }
  
  // Check if we already have this post in the posts cache
  if (!forceRefresh && postsCache) {
    const cachedPost = postsCache.find(post => post.slug === slug);
    if (cachedPost) {
      console.log(`Found post ${slug} in posts cache`);
      // Update the individual post cache
      postCache[slug] = { post: cachedPost, timestamp: now };
      return cachedPost;
    }
  }
  
  try {
    console.log(`Fetching post with slug "${slug}" from WordPress API`);
    const response = await wpAxios.get('/posts', {
      params: {
        slug,
        _embed: true,  // This will embed all available related resources
        status: 'publish'
      }
    });
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      console.log(`No post found with slug: ${slug}`);
      return null;
    }
    
    const formattedPost = processWordPressPost(response.data[0]);
    
    // Update cache
    postCache[slug] = { post: formattedPost, timestamp: now };
    
    return formattedPost;
  } catch (error: unknown) {
    console.error(`Error fetching WordPress post with slug ${slug}:`, error);
    
    // Return cached post if available, even if expired
    if (postCache[slug]) {
      console.log(`Returning stale cached post for ${slug} due to fetch error`);
      return postCache[slug].post;
    }
    
    return null;
  }
};

/**
 * Process WordPress post data into a consistent format
 * @param post WordPress post data
 * @returns Processed blog post
 */
/**
 * Process WordPress post data into a consistent format
 * @param post WordPress post data
 * @returns Processed blog post
 */
const processWordPressPost = (post: WordPressPost): BlogPost => {
  const author = post._embedded?.author?.[0]?.name || 'Unknown Author';
  const image = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
  const imageAlt = post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || post.title.rendered;
  
  // Decode HTML entities in text content
  const decodedTitle = he.decode(post.title.rendered);
  const decodedContent = post.content.rendered;
  const excerptText = he.decode(post.excerpt.rendered.replace(/<[^>]+>/g, '')); // Remove HTML tags and decode
  const description = excerptText; // Use excerpt as description
  
  const tags = post._embedded?.['wp:term']?.[0]
    ?.filter(term => term.taxonomy === 'post_tag')
    .map(term => term.name) || [];

  return {
    id: String(post.id),
    slug: post.slug,
    title: decodedTitle,
    content: decodedContent,
    excerpt: excerptText,
    description: description,
    image: image,
    imageAlt: imageAlt,
    author: author,
    publishedAt: post.date,
    tags: tags,
  };
};

import React, { useEffect, useState, ErrorBoundary as ReactErrorBoundary } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiArrowRight, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import { fetchPosts, BlogPost } from '../services/wordpressService';

// Using BlogPost interface from wordpressService.ts

// Custom ErrorBoundary to catch and handle errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('BlogPage ErrorBoundary caught an error:', error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently handle the error without showing anything
    }
    return this.props.children;
  }
}

const BlogPage: React.FC = () => {
  const [allArticles, setAllArticles] = useState<BlogPost[]>([]);
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6; // Reduced from showing all articles at once

  useEffect(() => {
    document.title = "Blog | Full Moon Odds";
    
    // Prevent any potential AstroChart loading errors
    window.addEventListener('error', (event) => {
      if (event.message?.includes('AstroChart')) {
        event.preventDefault();
        console.warn('Prevented AstroChart error from affecting page load');
      }
    }, { capture: true });
    
    const fetchArticles = async () => {
      try {
        console.log('Loading blog articles from WordPress API...');
        
        const posts = await fetchPosts();
        console.log(`Found ${posts.length} blog articles`);
        
        if (posts.length > 0) {
          console.log('First blog article data:', posts[0]);
          setFeaturedArticle(posts[0]);
          setAllArticles(posts.slice(1));
          
          // Only set the first page of articles initially
          setArticles(posts.slice(1, 1 + articlesPerPage));
        } else {
          console.log('No blog articles found');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load blog articles. Please try again later.';
        console.error('Error in fetchArticles:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
    
    // Cleanup function
    return () => {
      window.removeEventListener('error', () => {});
    };
  }, []);
  
  // Handle page changes
  useEffect(() => {
    if (allArticles.length > 0) {
      const startIndex = (currentPage - 1) * articlesPerPage;
      const endIndex = startIndex + articlesPerPage;
      setArticles(allArticles.slice(startIndex, endIndex));
    }
  }, [currentPage, allArticles]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-pulse h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Generate structured data for SEO
  const generateStructuredData = () => {
    const blogPosts = featuredArticle ? [featuredArticle, ...articles] : articles;
    
    const itemListElement = blogPosts.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.description,
        "author": {
          "@type": "Person",
          "name": post.author
        },
        "datePublished": post.publishedAt,
        "image": post.image || "/placeholder-blog-image.jpg",
        "url": `https://fullmoonodds.com/blog/${post.slug}`
      }
    }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": itemListElement
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Helmet>
        <title>Blog | Full Moon Odds</title>
        <meta name="description" content="Discover insightful articles and analysis on sports betting, astrology, and more." />
        <meta name="keywords" content="sports betting, astrology, blog, full moon odds, betting analysis" />
        <meta property="og:title" content="Blog | Full Moon Odds" />
        <meta property="og:description" content="Discover insightful articles and analysis on sports betting, astrology, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fullmoonodds.com/blog" />
        <meta property="og:image" content="https://fullmoonodds.com/images/blog-og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | Full Moon Odds" />
        <meta name="twitter:description" content="Discover insightful articles and analysis on sports betting, astrology, and more." />
        <meta name="twitter:image" content="https://fullmoonodds.com/images/blog-og-image.jpg" />
        <link rel="canonical" href="https://fullmoonodds.com/blog" />
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-20">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Latest Blog Posts</h1>
          <p className="text-xl text-indigo-100 max-w-3xl">
            Discover insightful articles and analysis on various topics.
          </p>
        </div>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 md:w-1/2">
                {featuredArticle.image && (
                  <img 
                    className="h-full w-full object-cover md:h-96" 
                    src={featuredArticle.image} 
                    alt={featuredArticle.title} 
                  />
                )}
              </div>
              <div className="p-8 md:w-1/2 flex flex-col">
                <div className="uppercase tracking-wide text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                  Featured Blog Post
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {featuredArticle.title}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300 flex-grow">
                  {featuredArticle.description}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiClock className="mr-1" />
                    <span>{formatDate(featuredArticle.publishedAt)}</span>
                  </div>
                  <Link
                    to={`/blog/${featuredArticle.slug}`}
                    className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                  >
                    Read full story
                    <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">All Blog Posts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link 
              to={`/blog/${article.slug}`}
              key={article.id}
              className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48">
                {article.image && (
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {article.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(article.publishedAt)}
                  </span>
                  <span className="inline-flex items-center text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors">
                    Read more
                    <FiArrowRight className="ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {articles.length === 0 && allArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No blog articles found.</p>
          </div>
        )}
        
        {/* Pagination */}
        {allArticles.length > articlesPerPage && (
          <div className="flex justify-center items-center mt-12 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900'}`}
              aria-label="Previous page"
            >
              <FiChevronLeft size={20} />
            </button>
            
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {currentPage} of {Math.ceil(allArticles.length / articlesPerPage)}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(allArticles.length / articlesPerPage)))}
              disabled={currentPage >= Math.ceil(allArticles.length / articlesPerPage)}
              className={`p-2 rounded-full ${currentPage >= Math.ceil(allArticles.length / articlesPerPage) ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900'}`}
              aria-label="Next page"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
      </ErrorBoundary>
    </div>
  );
};

export default BlogPage;

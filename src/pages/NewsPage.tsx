import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiClock, FiArrowRight } from 'react-icons/fi';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  publishedAt: string;
  slug: string;
  teamHome?: string;
  teamAway?: string;
  score?: {
    home: number;
    away: number;
  };
}

const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "News | Astro Bet Advisor";
    
    const fetchArticles = async () => {
      try {
        console.log('Loading articles from JSON file...');
        
        // Import the articles JSON file directly
        // This assumes the JSON file is in the public directory or properly imported
        const response = await fetch('/news/index.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load articles: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Loaded articles data:', data);
        
        // Make sure data.articles exists and is an array
        let allArticles = [];
        
        if (data && Array.isArray(data.articles)) {
          allArticles = data.articles;
        } else if (Array.isArray(data)) {
          // If the data is directly an array
          allArticles = data;
        } else {
          throw new Error('Invalid articles data format');
        }
        
        console.log(`Found ${allArticles.length} articles`);
        
        // Process and set the articles
        const processedArticles = allArticles.map(article => ({
          id: article.id || `article-${Math.random().toString(36).substr(2, 9)}`,
          title: article.title || `${article.teamAway || 'Away'} vs ${article.teamHome || 'Home'}`,
          description: article.description || article.title || '',
          content: article.content || '',
          publishedAt: article.publishedAt || article.date || new Date().toISOString(),
          slug: article.slug || article.id || `article-${Date.now()}`,
          teamHome: article.teamHome || article.home_team,
          teamAway: article.teamAway || article.away_team,
          image: article.image || '',
          score: typeof article.score === 'string' ? parseScore(article.score) : 
                (article.score || { 
                  home: article.homeScore || 0, 
                  away: article.awayScore || 0 
                })
        }));
        
        // Helper function to parse score strings like "Marlins 0 - Giants 2"
        function parseScore(scoreStr: string) {
          if (!scoreStr) return { home: 0, away: 0 };
          const match = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
          return match ? { 
            home: parseInt(match[2].trim(), 10), 
            away: parseInt(match[1].trim(), 10) 
          } : { home: 0, away: 0 };
        }
        
        if (processedArticles.length > 0) {
          console.log('First article data:', processedArticles[0]);
          setFeaturedArticle(processedArticles[0]);
          setArticles(processedArticles.slice(1)); // Remaining articles
        } else {
          console.log('No articles found');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load articles. Please try again later.';
        console.error('Error in fetchArticles:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-20">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Latest News</h1>
          <p className="text-xl text-indigo-100 max-w-3xl">
            Stay updated with the latest MLB game recaps, analysis, and insights powered by AI.
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
                  Featured Story
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
                    to={`/news/${featuredArticle.slug}`}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Latest Updates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link 
              to={`/news/${article.slug}`}
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

        {articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No articles found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;

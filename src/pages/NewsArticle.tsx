import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MarkdownContent from '../components/MarkdownContent';

interface Article {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  image?: string;
  teamHome?: string;
  teamAway?: string;
  score?: {
    home: number;
    away: number;
  };
}

const NewsArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (!slug) {
          throw new Error('Article slug is missing');
        }

        // First, load the index to find the article
        const indexResponse = await fetch('/news/index.json');
        if (!indexResponse.ok) {
          throw new Error('Failed to load news index');
        }
        
        const indexData = await indexResponse.json();
        const articles = indexData.articles || [];
        
        // Find the article with the matching slug
        const articleData = articles.find((a: any) => a.slug === slug);
        
        if (!articleData) {
          throw new Error('Article not found');
        }

        // Load the full article content
        const articleResponse = await fetch(`/news/${slug}.json`);
        if (!articleResponse.ok) {
          throw new Error('Failed to load article content');
        }
        
        const articleContent = await articleResponse.json();
        
        // Combine the data from the index with the full content
        const fullArticle = {
          ...articleData,
          ...articleContent,
          // Ensure we have all required fields
          id: articleData.id || slug,
          title: articleData.title || 'Untitled Article',
          content: articleContent.content || articleData.content || '',
          publishedAt: articleData.publishedAt || articleData.date || new Date().toISOString(),
          teamHome: articleData.teamHome || articleData.home_team || 'Home',
          teamAway: articleData.teamAway || articleData.away_team || 'Away',
          score: typeof articleData.score === 'string' ? parseScore(articleData.score) : 
                (articleData.score || { home: 0, away: 0 })
        };
        
        setArticle(fullArticle);
        document.title = `${fullArticle.title} | Astro Bet Advisor`;
      } catch (err: any) {
        console.error('Error fetching article:', err);
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);
  
  // Helper function to parse score strings like "Marlins 0 - Giants 2"
  const parseScore = (scoreStr: string) => {
    if (!scoreStr) return { home: 0, away: 0 };
    const match = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
    return match ? { 
      home: parseInt(match[2].trim(), 10), 
      away: parseInt(match[1].trim(), 10) 
    } : { home: 0, away: 0 };
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    out: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error || 'Article not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to News
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ← Back to News
      </button>
      
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {article.image ? (
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-64 md:h-96 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">
              {article.teamAway || 'Away'} vs {article.teamHome || 'Home'}
            </div>
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">
            {article.title}
          </h1>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-6">
            <span>
              Published on {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          {article.teamHome && article.teamAway && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">Game Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="text-lg font-medium">{article.teamAway}</div>
                <div className="text-2xl font-bold">
                  {article.score?.away} - {article.score?.home}
                </div>
                <div className="text-lg font-medium">{article.teamHome}</div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            {article.content ? (
              <MarkdownContent content={article.content} />
            ) : (
              <div className="text-gray-500 italic">
                No content available for this article.
              </div>
            )}
          </div>
        </div>
      </article>
    </motion.div>
  );
};

export default NewsArticle;

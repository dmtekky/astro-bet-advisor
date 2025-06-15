import { useState, useEffect } from 'react';
import type { Article } from '@/types/news';

export const useFeaturedArticle = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedArticle = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/news/index.json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const articles = Array.isArray(data) ? data : (data.articles || []);
        
        if (articles.length > 0) {
          const latestArticle = articles[0];
          const mappedArticle: Article = {
            slug: latestArticle.slug || `article-${Date.now()}`,
            title: latestArticle.title || 'Latest News',
            subheading: latestArticle.description || '',
            contentHtml: latestArticle.content || `<p>${latestArticle.description || ''}</p>`,
            featureImageUrl: latestArticle.image || '',
            publishedAt: latestArticle.publishedAt || new Date().toISOString(),
            author: latestArticle.author || 'AI Insights',
            tags: latestArticle.tags || ['MLB', 'News'],
          };
          setArticle(mappedArticle);
        } else {
          throw new Error('No articles found');
        }
      } catch (err) {
        console.error('Error fetching featured article:', err);
        setError('Failed to load the latest news. Please try again later.');
        
        // Fallback to default article
        setArticle({
          slug: 'ai-astrology-mlb-deep-dive-20250531',
          title: 'AI & Astrology: A New Frontier in MLB Predictions',
          subheading: 'Discover how combining advanced AI with ancient astrological wisdom is changing the game for sports bettors.',
          contentHtml: '<p>Full article content would go here...</p>',
          featureImageUrl: 'https://images.unsplash.com/photo-1580209949904-5046cf9b3f4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
          publishedAt: new Date().toISOString(),
          author: 'AI Insights',
          tags: ['MLB', 'AI', 'Astrology', 'Predictions'],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedArticle();
  }, []);

  return { article, isLoading, error };
};

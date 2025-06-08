import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchNewsArticles } from '@/lib/api';

interface Article {
  id: string;
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  slug: string;
}

const NewsIndexPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('Fetching news articles...');
        const data = await fetchNewsArticles();
        console.log('Received articles:', data);
        setArticles(data.articles || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again later.');
        setLoading(false);
      }
    };
    
    loadArticles();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">MLB News & Game Recaps</h1>
      {loading && <p>Loading articles...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && articles.length === 0 && (
        <p>No articles found.</p>
      )}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(article => (
            <div key={article.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden cursor-pointer"
              onClick={() => router.push(`/news/${article.slug}`)}>
              {article.image && (
                <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-indigo-700 dark:text-indigo-300">{article.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{article.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Published: {new Date(article.publishedAt).toLocaleDateString()}</p>
                <span className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Read More &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsIndexPage;

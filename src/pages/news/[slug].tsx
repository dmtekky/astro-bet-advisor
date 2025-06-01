import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchNewsArticle } from '@/lib/api';

interface ArticleData {
  title: string;
  content: string;
  publishedAt: string;
  image?: string;
}

const ArticleDetailPage: React.FC = () => {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (!slug) return;

    const loadArticle = async () => {
      try {
        console.log(`Fetching article with slug: ${slug}`);
        const data = await fetchNewsArticle(slug as string);
        console.log('Received article data:', data);
        setArticle(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article. Please try again later.');
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  if (loading) return <div className="container mx-auto px-4 py-8">Loading article...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>;
  if (!article) return <div className="container mx-auto px-4 py-8">Article not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/news')}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
      >
        ← Back to News
      </button>
      
      <article className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden p-6">
        <h1 className="text-3xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">{article.title}</h1>
        
        <div className="mb-6 text-sm text-gray-500">
          Published: {new Date(article.publishedAt).toLocaleDateString()}
        </div>
        
        {article.image && (
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full max-h-96 object-cover mb-8 rounded"
          />
        )}
        
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
};

export default ArticleDetailPage;

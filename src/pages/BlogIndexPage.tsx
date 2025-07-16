import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchPosts, BlogPost } from '../services/wordpressService';

// Using the BlogPost interface from wordpressService instead of a separate interface

const BlogIndexPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const postsPerPage = 6; // Reduced for faster initial load

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        // Use the optimized WordPress service with caching
        const blogPosts = await fetchPosts();
        setPosts(blogPosts);
      } catch (err: any) {
        setError(err.message);
        console.error('Error loading blog posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-white rounded-lg shadow-md p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Generate structured data for SEO
  const generateStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "headline": "Blog Posts | Full Moon Odds",
      "description": "Explore our collection of blog posts on sports betting, astrology, and more.",
      "url": "https://fullmoonodds.com/blog",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": posts.map((post, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://fullmoonodds.com/blog/${post.slug}`,
          "name": post.title
        }))
      }
    };
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Blog Posts | Full Moon Odds</title>
        <meta name="description" content="Explore our collection of blog posts on sports betting, astrology, and more." />
        <meta name="keywords" content="blog posts, sports betting, astrology, full moon odds" />
        <meta property="og:title" content="Blog Posts | Full Moon Odds" />
        <meta property="og:description" content="Explore our collection of blog posts on sports betting, astrology, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fullmoonodds.com/blog" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Blog Posts | Full Moon Odds" />
        <meta name="twitter:description" content="Explore our collection of blog posts on sports betting, astrology, and more." />
        <link rel="canonical" href="https://fullmoonodds.com/blog" />
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentPosts.map((post) => (
          <Link to={`/blog/${post.slug}`} key={post.slug} className="block">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {post.image && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{post.title}</h2>
                <p className="text-gray-600 text-sm mb-2">
                  By {post.author} on {new Date(post.publishedAt).toLocaleDateString()}
                </p>
                {post.excerpt && (
                  <p className="text-gray-700 mb-4 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="text-blue-600 hover:underline">Read more &rarr;</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {posts.length === 0 && <p>No blog posts found.</p>}
      <div className="pagination mt-8 flex justify-center items-center space-x-4">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1} 
          className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors duration-200`}
        >
          Previous
        </button>
        <span className="text-gray-700 font-medium">Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages} 
          className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors duration-200`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BlogIndexPage;

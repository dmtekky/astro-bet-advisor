import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiClock, FiUser, FiTag } from 'react-icons/fi';
import { fetchPostBySlug, fetchPosts, BlogPost } from '../services/wordpressService';
import DOMPurify from 'dompurify';

// Lazy load AdSense component to improve initial loading performance
// const AdSense = lazy(() => import('../components/AdSense'));

// Cached posts to avoid redundant API calls
let cachedPosts: BlogPost[] = [];

// Optimized related articles function that doesn't trigger additional API calls
const getRelatedArticles = async (tags: string[], currentPostId: string, maxCount = 3): Promise<BlogPost[]> => {
  if (cachedPosts.length === 0) return [];
  
  return cachedPosts
    .filter(post => post.id !== currentPostId && tags.some(tag => post.tags?.includes(tag)))
    .slice(0, maxCount);
};

const getViewCount = (postId: string) => {
  const views = JSON.parse(localStorage.getItem('viewCounts') || '{}');
  return views[postId] || 0;
};

const getTrendingArticles = (posts: BlogPost[], currentPostId: string, maxCount: number) => {
  return posts
    .filter(post => post.id !== currentPostId)
    .sort((a, b) => getViewCount(b.id) - getViewCount(a.id))  // Sort by view count descending
    .slice(0, maxCount);
};

interface BlogPostPageProps {
  initialContent?: BlogPost;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ initialContent }) => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogPost[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<BlogPost[]>([]);
  const [contentReady, setContentReady] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        let postData: BlogPost | null = null;
        if (initialContent) {
          postData = initialContent;
        } else if (slug) {
          postData = await fetchPostBySlug(slug);
        }

        if (postData) {
          setPost(postData);
          // Fetch all posts to get cachedPosts for related and trending
          const allPosts = await fetchPosts();
          const related = getRelatedArticles(allPosts, postData.id, 3);
          setRelatedArticles(related);

          const trending = getTrendingArticles(allPosts, postData.id, 3);
          setTrendingArticles(trending);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug, initialContent]);

  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = window.scrollY;
      setReadingProgress(scrolled / scrollHeight * 100);
    };
    
    window.addEventListener('scroll', updateReadingProgress);
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);

  useEffect(() => {
    if (post) {
      const views = JSON.parse(localStorage.getItem('viewCounts') || '{}');
      views[post.id] = (views[post.id] || 0) + 1;
      localStorage.setItem('viewCounts', JSON.stringify(views));
    }
  }, [post]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString; // Return original if invalid
    }
  };

  // Enhanced WordPress styling with modern design
  const wordpressStyles = {
    p: 'mb-6 leading-relaxed text-gray-700 text-lg',
    h2: 'text-3xl font-bold mt-12 mb-6 pb-3 border-b-2 border-indigo-200 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600',
    h3: 'text-2xl font-semibold mt-10 mb-5 text-indigo-700 hover:text-purple-600 transition-colors duration-300',
    h4: 'text-xl font-medium mt-8 mb-4 text-indigo-600',
    ul: 'list-disc pl-8 mb-6 space-y-2 bg-indigo-50 p-4 rounded-lg',
    ol: 'list-decimal pl-8 mb-6 space-y-2 bg-indigo-50 p-4 rounded-lg',
    li: 'mb-3 marker:text-indigo-500',
    blockquote: 'border-l-4 border-indigo-500 italic pl-6 py-4 my-6 bg-indigo-50 text-gray-800 text-lg relative before:content-["\\201C"] before:text-6xl before:text-indigo-300 before:absolute before:-left-2 before:-top-4 before:font-serif',
    table: 'min-w-full divide-y divide-gray-200 my-8 rounded-lg overflow-hidden shadow-md',
    th: 'px-6 py-4 bg-indigo-600 text-left text-sm font-semibold text-white uppercase tracking-wider',
    td: 'px-6 py-4 whitespace-normal text-base text-gray-800',
    'tbody tr:nth-child(odd)': 'bg-indigo-50',
    'tbody tr:nth-child(even)': 'bg-white',
    a: 'text-indigo-600 font-medium hover:text-indigo-800 hover:underline transition-colors',
    img: 'my-8 rounded-xl shadow-lg max-w-full h-auto border-4 border-white hover:shadow-xl transition-shadow duration-300 hover:scale-105 transform transition-transform duration-300',
    'img.alignleft': 'float-left mr-6 mb-3 mt-2',
    'img.alignright': 'float-right ml-6 mb-3 mt-2',
    'img.aligncenter': 'mx-auto block',
    'code:not(.hljs)': 'bg-indigo-100 rounded px-2 py-1 font-mono text-indigo-800 text-sm',
    pre: 'bg-gray-800 text-gray-100 p-5 rounded-xl overflow-x-auto my-6 shadow-lg relative group',
    '.wp-block-image': 'my-8',
    '.wp-block-gallery': 'grid grid-cols-2 md:grid-cols-3 gap-4 my-8',
    '.wp-block-gallery img': 'rounded-lg shadow-md border-0 hover:scale-105 transition-transform duration-300',
    '.wp-block-button': 'my-6',
    '.wp-block-button__link': 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  };

  // Apply WordPress styles to all content
  const applyWordPressStyles = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Apply styles to each element type
    Object.entries(wordpressStyles).forEach(([selector, className]) => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add(...className.split(' '));
      });
    });
    
    return doc.body.innerHTML;
  };

  // Add copy button to code blocks
  const addCopyButtons = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const codeBlocks = doc.querySelectorAll('pre');
    codeBlocks.forEach(pre => {
      const button = doc.createElement('button');
      button.innerHTML = 'Copy';
      button.className = 'absolute top-2 right-2 bg-gray-700 text-gray-100 px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity';
      button.onclick = () => {
        const code = pre.querySelector('code')?.innerText || '';
        navigator.clipboard.writeText(code);
        button.innerHTML = 'Copied!';
        setTimeout(() => button.innerHTML = 'Copy', 2000);
      };
      pre.appendChild(button);
    });
    
    return doc.body.innerHTML;
  };

  // Add lightbox functionality to images
  const addLightboxToImages = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const images = doc.querySelectorAll('img');
    images.forEach(img => {
      img.classList.add('cursor-zoom-in');
      img.onclick = () => {
        const lightbox = document.createElement('div');
        lightbox.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
        
        const lightboxImg = document.createElement('img');
        lightboxImg.src = img.src;
        lightboxImg.className = 'max-h-full max-w-full';
        
        lightbox.appendChild(lightboxImg);
        lightbox.onclick = () => document.body.removeChild(lightbox);
        document.body.appendChild(lightbox);
      };
    });
    
    return doc.body.innerHTML;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!post) {
    return <div>Blog post not found.</div>;
  }

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!post) return {};
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "datePublished": post.publishedAt,
      "description": post.title,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://fullmoonodds.com/blog/${slug}`
      }
    };
  };

  // Extract first paragraph for meta description
  const getMetaDescription = () => {
    if (!post?.content) return post?.title || "Full Moon Odds blog post";
    const firstParagraph = post.content.split('\n\n')[0].replace(/[#*_`]/g, '');
    return firstParagraph.length > 160 ? firstParagraph.substring(0, 157) + '...' : firstParagraph;
  };

  // Apply enhanced WordPress styles and interactive features
  let enhancedContent = applyWordPressStyles(post.content);
  enhancedContent = addCopyButtons(enhancedContent);
  enhancedContent = addLightboxToImages(enhancedContent);
  const sanitizedContent = DOMPurify.sanitize(enhancedContent);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 z-50" 
           style={{ width: `${readingProgress}%` }} />
      
      <Helmet>
        <title>{post?.title || 'Blog Post'} | Full Moon Odds</title>
        <meta name="description" content={getMetaDescription()} />
        <meta name="author" content={post?.author || 'Full Moon Odds'} />
        <meta property="og:title" content={`${post?.title || 'Blog Post'} | Full Moon Odds`} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://fullmoonodds.com/blog/${slug}`} />
        {post?.publishedAt && <meta property="article:published_time" content={post.publishedAt} />}
        {post?.author && <meta property="article:author" content={post.author} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post?.title || 'Blog Post'} | Full Moon Odds`} />
        <meta name="twitter:description" content={getMetaDescription()} />
        <link rel="canonical" href={`https://fullmoonodds.com/blog/${slug}`} />
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <article className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl" aria-labelledby="post-title" data-lov-id="src/pages/BlogPostPage.tsx:160:14" data-lov-name="article" data-component-path="src/pages/BlogPostPage.tsx" data-component-line="160" data-component-file="BlogPostPage.tsx" data-component-name="article" data-component-content="%7B%7D">
              {post.image && (
                <img
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  className="w-full h-80 object-cover rounded-t-lg transition-opacity duration-300 ease-in-out"
                  loading="lazy"
                  onLoad={(e) => e.currentTarget.classList.add('opacity-100')} // Fade-in effect on load
                  style={{ opacity: 0 }} // Start invisible for fade-in
                />
              )}
              {loading ? (
                <div className="animate-pulse p-8">
                  <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : (
                <div className="p-8" data-lov-id="src/pages/BlogPostPage.tsx:160:14" data-lov-name="div" data-component-path="src/pages/BlogPostPage.tsx" data-component-line="160" data-component-file="BlogPostPage.tsx" data-component-name="div" data-component-content="%7B%22className%22%3A%22p-8%22%7D">
                  <h1 id="post-title" className="text-4xl font-bold text-gray-900 mb-6 leading-snug transition-colors duration-200 hover:text-indigo-600" data-lov-id="src/pages/BlogPostPage.tsx:161:16" data-lov-name="h1" data-component-path="src/pages/BlogPostPage.tsx" data-component-line="161" data-component-file="BlogPostPage.tsx" data-component-name="h1" data-component-content="%7B%22className%22%3A%22text-4xl%20font-bold%20text-gray-900%20mb-6%20leading-snug%22%7D">
                    {post.title}
                  </h1>
                  <div className="flex items-center text-gray-500 text-sm mb-8 space-x-4" data-lov-id="src/pages/BlogPostPage.tsx:164:16" data-lov-name="div" data-component-path="src/pages/BlogPostPage.tsx" data-component-line="164" data-component-file="BlogPostPage.tsx" data-component-name="div" data-component-content="%7B%22className%22%3A%22flex%20items-center%20text-gray-500%20text-sm%20mb-8%20space-x-4%22%7D">
                    <FiUser className="text-gray-400" aria-hidden="true" />&nbsp;{post.author}
                    <FiClock className="text-gray-400" aria-hidden="true" />&nbsp;{formatDate(post.publishedAt)}
                  </div>
                  <div className="prose lg:prose-xl max-w-none mb-10 prose-headings:text-gray-800 prose-a:text-indigo-600 prose-a:underline prose-img:rounded-lg prose-img:shadow-md" data-lov-id="src/pages/BlogPostPage.tsx:172:18" data-lov-name="div" data-component-path="src/pages/BlogPostPage.tsx" data-component-line="172" data-component-file="BlogPostPage.tsx" data-component-name="div" data-component-content="%7B%22className%22%3A%22prose%20lg%3Aprose-xl%20max-w-none%20mb-10%20prose-headings%3Atext-gray-800%20prose-a%3Atext-indigo-600%20prose-a%3Aunderline%20prose-img%3Arounded-lg%20prose-img%3Ashadow-md%22%7D">
                    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-8" aria-labelledby="tags-heading">
                      <h3 id="tags-heading" className="text-lg font-semibold text-gray-700 mb-4">Tags:</h3>
                      <div className="flex flex-wrap gap-3" aria-label="Blog tags">
                        {post.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/blog?tag=${tag}`}
                            className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors duration-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            aria-label={ /* eslint-disable-line @typescript-eslint/no-unsafe-assignment-optionals */ `View posts tagged ${tag}` }
                          >
                            <FiTag className="inline mr-1 -mt-1" aria-hidden="true" /> {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <section className="mt-12 bg-white shadow-lg rounded-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {relatedArticles.map((article) => (
                    <Link to={`/blog/${article.slug}`} key={article.id} className="block group">
                      <img
                        src={article.image || '/placeholder-blog-image.jpg'}
                        alt={article.imageAlt || article.title}
                        className="w-full h-48 object-cover rounded-md mb-4 transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                        {article.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Trending Articles Section */}
            <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Trending</h2>
              <ul className="space-y-3">
                {trendingArticles.map((article) => (
                  <li key={article.id}>
                    <Link 
                      to={`/blog/${article.slug}`} 
                      className="text-lg text-gray-800 hover:text-indigo-700 hover:underline transition-colors"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;

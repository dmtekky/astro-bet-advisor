import { Helmet } from 'react-helmet-async';

interface SeoMetaTagsProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  canonicalUrl?: string;
}

export function SeoMetaTags({
  title,
  description,
  url = typeof window !== 'undefined' ? window.location.href : '',
  image = '/images/og-default.jpg',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  twitterCard = 'summary_large_image',
  twitterSite = '@fullmoonodds',
  twitterCreator = '@fullmoonodds',
  noIndex = false,
  noFollow = false,
  canonicalUrl
}: SeoMetaTagsProps) {
  // Ensure image URL is absolute
  const fullImageUrl = image.startsWith('http') 
    ? image 
    : `${process.env.REACT_APP_BASE_URL || 'https://fullmoonodds.com'}${image}`;
  
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${process.env.REACT_APP_BASE_URL || 'https://fullmoonodds.com'}${url}`;
  
  const robots = [];
  if (noIndex) robots.push('noindex');
  if (noFollow) robots.push('nofollow');
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title} | Full Moon Odds</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {robots.length > 0 && <meta name="robots" content={robots.join(', ')} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="Full Moon Odds" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Article specific */}
      {type === 'article' && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Additional tags */}
      <meta name="theme-color" content="#1a1a2e" />
      <meta name="application-name" content="Full Moon Odds" />
      <meta name="apple-mobile-web-app-title" content="Full Moon Odds" />
      
      {/* Favicons - Update these paths to your actual favicon files */}
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#1a1a2e" />
    </Helmet>
  );
}

export default SeoMetaTags;

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

interface SeoMetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

const DEFAULT_TITLE = 'Full Moon Odds - Astrological Sports Insights';
const DEFAULT_DESCRIPTION = 'Get data-driven sports insights powered by astrological analysis and team chemistry metrics.';
const DEFAULT_IMAGE = '/images/og-default.jpg';
const DEFAULT_URL = 'https://fullmoonodds.com';

const SeoMetaTags: React.FC<SeoMetaTagsProps> = ({
  title = '',
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = DEFAULT_URL,
  type = 'website',
  siteName = 'Full Moon Odds',
  twitterCard = 'summary_large_image',
  twitterSite = '@fullmoonodds',
  twitterCreator = '@fullmoonodds',
  noIndex = false,
  noFollow = false,
}) => {
  // Ensure URLs are absolute
  const fullUrl = url.startsWith('http') ? url : `${DEFAULT_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  const fullImageUrl = image.startsWith('http') ? image : `${DEFAULT_URL}${image.startsWith('/') ? '' : '/'}${image}`;

  // Set page title
  const pageTitle = title ? `${title} | ${siteName}` : siteName;

  // Handle noindex, nofollow
  const robots = [];
  if (noIndex) robots.push('noindex');
  if (noFollow) robots.push('nofollow');
  if (robots.length === 0) robots.push('index, follow');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots.join(', ')} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="theme-color" content="#1a202c" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#1a202c" />
    </Helmet>
  );
};

export default SeoMetaTags;

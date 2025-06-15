# SEO and Social Media Integration

This directory contains files related to search engine optimization (SEO) and social media integration for Full Moon Odds.

## Key Files

### `robots.txt`
- Controls search engine crawler access to your site
- Currently allows all major search engines to crawl the entire site
- Configured for Google, Bing, Twitter, and Facebook crawlers

### `sitemap.xml`
- Lists all important URLs on the site for search engines
- Includes last modified dates and change frequencies
- Helps search engines discover and index content

### `images/og-default.svg`
- Default Open Graph image for social sharing
- Used when no specific image is provided for a page
- Follows recommended dimensions of 1200x630 pixels

### `.well-known/`
- Directory for well-known URIs (RFC 8615)
- Contains security-related files

### `.well-known/security.txt`
- Provides security contact information
- Used by security researchers to report vulnerabilities
- References PGP key for encrypted communication

### `.well-known/pgp-key.txt`
- PGP public key for encrypted security reports
- Currently contains a placeholder that should be replaced with an actual key

## Best Practices

1. **Keep sitemap.xml updated** when adding new pages
2. **Update og-default.svg** to match branding changes
3. **Verify ownership** with search engines using their respective webmaster tools
4. **Monitor security@fullmoonodds.com** for security reports
5. **Replace the PGP key placeholder** with a real key in production

## Verification

To verify the site in various webmaster tools, you may need to add verification files to this directory. Common verification methods include:

- Google Search Console: HTML file or meta tag
- Bing Webmaster Tools: XML file or meta tag
- Pinterest: HTML file verification
- Yandex: HTML file or meta tag verification

Add these verification files to this directory as needed.

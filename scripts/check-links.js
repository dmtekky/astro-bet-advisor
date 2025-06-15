#!/usr/bin/env node

/**
 * Broken Link Checker for Full Moon Odds
 * 
 * This script checks for broken links in the application.
 * It can be run locally or in CI environments.
 */

const { LinkChecker } = require('linkinator');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  // Base URL for local development
  localUrl: 'http://localhost:3000',
  
  // Production URL
  productionUrl: 'https://fullmoonodds.com',
  
  // Paths to check
  paths: [
    '/',
    '/nba',
    '/mlb',
    '/nfl',
    '/news',
    '/privacy',
    '/terms'
  ],
  
  // File to save the report
  reportFile: path.join(process.cwd(), 'link-check-report.json'),
  
  // Ignore patterns (URLs that can be skipped)
  ignorePatterns: [
    // External services that might block automated checks
    'mailto:',
    'tel:',
    'https://twitter.com',
    'https://facebook.com',
    'https://instagram.com',
    'https://api.the-odds-api.com',
    'https://www.thesportsdb.com',
    
    // Dynamic or authenticated routes
    '/api/',
    '/admin/'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[33m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

// Track results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  brokenLinks: []
};

/**
 * Format a URL for checking
 */
function formatUrl(baseUrl, path) {
  return `${baseUrl}${path}`.replace(/([^:])\/\//g, '$1/');
}

/**
 * Check if a URL should be skipped
 */
function shouldSkip(url) {
  return CONFIG.ignorePatterns.some(pattern => url.includes(pattern));
}

/**
 * Print a summary of the results
 */
function printSummary() {
  console.log('\n=== Link Check Summary ===');
  console.log(`${colors.green}✓ ${results.passed} links passed${colors.reset}`);
  
  if (results.skipped > 0) {
    console.log(`${colors.yellow}⚠  ${results.skipped} links skipped${colors.reset}`);
  }
  
  if (results.failed > 0) {
    console.log(`${colors.red}✗ ${results.failed} broken links found${colors.reset}`);
    
    // Group broken links by status code
    const byStatus = results.brokenLinks.reduce((acc, link) => {
      const status = link.status || 'UNKNOWN';
      acc[status] = acc[status] || [];
      acc[status].push(link);
      return acc;
    }, {});
    
    // Print broken links by status code
    Object.entries(byStatus).forEach(([status, links]) => {
      console.log(`\nStatus ${status}:`);
      links.forEach(link => {
        console.log(`  ${link.url} (${link.text || 'No text'})`);
        console.log(`  ↳ Found on: ${link.foundOn}`);
      });
    });
  }
  
  // Save detailed report
  fs.writeFileSync(
    CONFIG.reportFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...results,
      config: {
        ...CONFIG,
        // Don't include full paths in the report
        reportFile: undefined,
        localUrl: undefined,
        productionUrl: undefined
      }
    }, null, 2)
  );
  
  console.log(`\nDetailed report saved to: ${CONFIG.reportFile}`);
  
  // Exit with appropriate status code
  process.exit(results.failed > 0 ? 1 : 0);
}

/**
 * Main function to check links
 */
async function checkLinks() {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction ? CONFIG.productionUrl : CONFIG.localUrl;
  
  console.log(`\n${colors.blue}=== Checking links on ${baseUrl} ===${colors.reset}\n`);
  
  const checker = new LinkChecker({
    timeout: 30000, // 30 seconds
    retryErrors: true,
    retryErrorsCount: 2,
    retryErrorsJitter: 1000,
    filterLevel: 1, // 0 = none, 1 = same-domain, 2 = same-hostname, 3 = same-origin
    path: path.join(process.cwd(), 'dist') // For static site checking
  });
  
  // Set up event handlers
  checker.on('pagestart', url => {
    console.log(`Checking: ${url}`);
  });
  
  checker.on('link', result => {
    const { url, state, status, parent } = result;
    
    // Skip ignored URLs
    if (shouldSkip(url)) {
      results.skipped++;
      console.log(`${colors.yellow}  ⚠  SKIP: ${url}${colors.reset}`);
      return;
    }
    
    if (state === 'BROKEN') {
      results.failed++;
      results.brokenLinks.push({
        url,
        status,
        text: result.text || '',
        foundOn: parent || 'unknown'
      });
      console.log(`${colors.red}  ✗ ${status} ${url}${colors.reset}`);
    } else {
      results.passed++;
      if (process.env.DEBUG) {
        console.log(`${colors.green}  ✓ ${status} ${url}${colors.reset}`);
      }
    }
  });
  
  try {
    // Check each path
    for (const path of CONFIG.paths) {
      const url = formatUrl(baseUrl, path);
      console.log(`\nChecking path: ${url}`);
      await checker.check({
        path: url,
        recurse: true,
        linksToSkip: CONFIG.ignorePatterns
      });
    }
    
    printSummary();
  } catch (error) {
    console.error('\nError during link checking:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkLinks();
}

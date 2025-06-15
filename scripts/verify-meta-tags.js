#!/usr/bin/env node

/**
 * Social Media Meta Tags Verifier for Full Moon Odds
 * 
 * This script verifies that all required Open Graph and Twitter Card meta tags
 * are present and properly formatted on key pages.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Base URL for local development or production
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://fullmoonodds.com' 
    : 'http://localhost:3000',
  
  // Key pages to check
  pages: [
    '/',
    '/nba',
    '/mlb',
    '/nfl',
    '/news',
    '/privacy',
    '/terms'
  ],
  
  // Required meta tags for each page type
  requiredTags: {
    default: [
      'og:title',
      'og:description',
      'og:image',
      'og:url',
      'og:type',
      'og:site_name',
      'twitter:card',
      'twitter:site',
      'twitter:title',
      'twitter:description',
      'twitter:image'
    ],
    article: [
      'article:published_time',
      'article:author'
    ]
  },
  
  // Report file
  reportFile: path.join(process.cwd(), 'meta-tags-report.json')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Track results
const results = {
  timestamp: new Date().toISOString(),
  pages: {},
  summary: {
    totalPages: 0,
    passed: 0,
    warnings: 0,
    errors: 0,
    missingTags: {},
    invalidTags: {}
  }
};

/**
 * Normalize URL to ensure consistency
 */
function normalizeUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Check if a URL is absolute
 */
function isAbsoluteUrl(url) {
  return /^https?:\/\//.test(url);
}

/**
 * Validate a meta tag value
 */
function validateTag(name, content) {
  if (!content) return { valid: false, message: 'Missing value' };
  
  // Check for common issues
  if (name === 'og:image' || name === 'twitter:image') {
    if (!isAbsoluteUrl(content)) {
      return { 
        valid: false, 
        message: 'Image URL should be absolute' 
      };
    }
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      content.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return {
        valid: false,
        message: `Image URL should end with ${validExtensions.join(', ')}`
      };
    }
  }
  
  if ((name === 'og:url' || name === 'twitter:url') && !isAbsoluteUrl(content)) {
    return {
      valid: false,
      message: 'URL should be absolute'
    };
  }
  
  return { valid: true };
}

/**
 * Print a summary of the results
 */
function printSummary() {
  console.log('\n=== Meta Tags Verification Summary ===');
  console.log(`Checked ${results.summary.totalPages} pages`);
  console.log(`${colors.green}✓ ${results.summary.passed} pages passed${colors.reset}`);
  
  if (results.summary.warnings > 0) {
    console.log(`${colors.yellow}⚠  ${results.summary.warnings} warnings${colors.reset}`);
  }
  
  if (results.summary.errors > 0) {
    console.log(`${colors.red}✗ ${results.summary.errors} errors${colors.reset}`);
  }
  
  // Print missing tags summary
  const missingTags = Object.entries(results.summary.missingTags);
  if (missingTags.length > 0) {
    console.log('\nMissing tags:');
    missingTags.forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count} pages`);
    });
  }
  
  // Print invalid tags summary
  const invalidTags = Object.entries(results.summary.invalidTags);
  if (invalidTags.length > 0) {
    console.log('\nInvalid tags:');
    invalidTags.forEach(([tag, { count, messages }]) => {
      console.log(`  ${tag}: ${count} issues`);
      Object.entries(messages).forEach(([message, msgCount]) => {
        console.log(`    - ${message} (${msgCount} pages)`);
      });
    });
  }
  
  // Save detailed report
  fs.writeFileSync(CONFIG.reportFile, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${CONFIG.reportFile}`);
  
  // Exit with appropriate status code
  process.exit(results.summary.errors > 0 ? 1 : 0);
}

/**
 * Check meta tags for a single page
 */
async function checkPageMetaTags(pagePath) {
  const url = `${CONFIG.baseUrl}${pagePath}`;
  const pageResult = {
    url,
    tags: {},
    missingTags: [],
    invalidTags: {},
    hasErrors: false,
    hasWarnings: false
  };
  
  console.log(`\nChecking: ${url}`);
  
  try {
    // Fetch the page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FullMoonOddsMetaChecker/1.0)'
      },
      validateStatus: () => true // Don't throw on HTTP errors
    });
    
    if (response.status !== 200) {
      console.error(`${colors.red}  ✗ HTTP ${response.status}${colors.reset}`);
      pageResult.error = `HTTP ${response.status}`;
      return pageResult;
    }
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    
    // Extract meta tags
    const metaTags = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || '';
      const content = $(el).attr('content') || '';
      
      if (name && (name.startsWith('og:') || name.startsWith('twitter:'))) {
        metaTags[name] = content;
      }
    });
    
    // Check required tags
    const pageType = metaTags['og:type'] === 'article' ? 'article' : 'default';
    const requiredTags = [...CONFIG.requiredTags.default];
    
    if (pageType === 'article') {
      requiredTags.push(...CONFIG.requiredTags.article);
    }
    
    // Check for missing tags
    requiredTags.forEach(tag => {
      if (!(tag in metaTags)) {
        pageResult.missingTags.push(tag);
        
        // Update summary of missing tags
        results.summary.missingTags[tag] = (results.summary.missingTags[tag] || 0) + 1;
      }
    });
    
    // Validate tag values
    Object.entries(metaTags).forEach(([name, content]) => {
      const validation = validateTag(name, content);
      
      if (!validation.valid) {
        pageResult.invalidTags[name] = {
          value: content,
          message: validation.message
        };
        
        // Update summary of invalid tags
        if (!results.summary.invalidTags[name]) {
          results.summary.invalidTags[name] = {
            count: 0,
            messages: {}
          };
        }
        
        results.summary.invalidTags[name].count++;
        const msg = validation.message;
        results.summary.invalidTags[name].messages[msg] = 
          (results.summary.invalidTags[name].messages[msg] || 0) + 1;
      }
    });
    
    // Check for issues
    if (pageResult.missingTags.length > 0 || Object.keys(pageResult.invalidTags).length > 0) {
      pageResult.hasErrors = true;
      results.summary.errors++;
    } else {
      pageResult.hasWarnings = false;
      results.summary.passed++;
    }
    
    // Log results
    if (pageResult.missingTags.length > 0) {
      console.log(`${colors.red}  ✗ Missing tags: ${pageResult.missingTags.join(', ')}${colors.reset}`);
    }
    
    if (Object.keys(pageResult.invalidTags).length > 0) {
      console.log(`${colors.yellow}  ⚠  Invalid tags:${colors.reset}`);
      Object.entries(pageResult.invalidTags).forEach(([name, { message }]) => {
        console.log(`    ${name}: ${message}`);
      });
    }
    
    if (!pageResult.hasErrors && !pageResult.hasWarnings) {
      console.log(`${colors.green}  ✓ All meta tags are valid${colors.reset}`);
    }
    
    pageResult.tags = metaTags;
    return pageResult;
    
  } catch (error) {
    console.error(`${colors.red}  ✗ Error: ${error.message}${colors.reset}`);
    pageResult.error = error.message;
    pageResult.hasErrors = true;
    results.summary.errors++;
    return pageResult;
  }
}

/**
 * Main function
 */
async function main() {
  program
    .option('--url <url>', 'Check a specific URL')
    .option('--base-url <url>', 'Override base URL')
    .parse(process.argv);
  
  const options = program.opts();
  
  if (options.baseUrl) {
    CONFIG.baseUrl = options.baseUrl.replace(/\/$/, '');
  }
  
  console.log(`\n${colors.blue}=== Meta Tags Verification ===${colors.reset}`);
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  
  const pagesToCheck = options.url 
    ? [new URL(options.url).pathname || '/']
    : CONFIG.pages;
  
  results.summary.totalPages = pagesToCheck.length;
  
  // Check each page
  for (const page of pagesToCheck) {
    const result = await checkPageMetaTags(page);
    results.pages[page] = result;
  }
  
  // Print summary
  printSummary();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

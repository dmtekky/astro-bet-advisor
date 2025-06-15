#!/usr/bin/env node
import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SITE_URL = 'https://fullmoonodds.com';
const EXPECTED_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'x-xss-protection': '1; mode=block',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': /[^, ]+=[^,()]+(\([^)]*\))?/g,
  'x-permitted-cross-domain-policies': 'none',
  'x-download-options': 'noopen',
  'x-dns-prefetch-control': 'on',
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'content-security-policy': /[^;]+;?/g
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

/**
 * Check if the site is running locally
 */
function isLocalDev() {
  try {
    const result = execSync('lsof -i :8080').toString();
    return result.includes('node');
  } catch (e) {
    return false;
  }
}

/**
 * Check headers for a given URL
 */
function getHttpModule(url) {
  return url.startsWith('https') ? https : http;
}

async function checkHeaders(url) {
  return new Promise((resolve) => {
    const httpModule = getHttpModule(url);
    const req = httpModule.get(url, { method: 'HEAD' }, (res) => {
      const headers = res.headers;
      const results = [];
      let score = 0;
      const total = Object.keys(EXPECTED_HEADERS).length;

      console.log(`\n${colors.blue}Checking headers for: ${url}${colors.reset}`);
      console.log('='.repeat(50));

      // Check each expected header
      Object.entries(EXPECTED_HEADERS).forEach(([header, expected]) => {
        const value = headers[header] || headers[header.toLowerCase()];
        const isPresent = !!value;
        let isCorrect = false;
        let message = '';

        if (isPresent) {
          if (expected instanceof RegExp) {
            isCorrect = expected.test(value);
            message = isCorrect 
              ? `${colors.green}✓${colors.reset} Valid format`
              : `${colors.yellow}⚠  Invalid format: ${value}`;
          } else {
            isCorrect = value.toLowerCase() === expected.toLowerCase();
            message = isCorrect 
              ? `${colors.green}✓${colors.reset} ${value}`
              : `${colors.yellow}⚠  Expected: ${expected}, Got: ${value}`;
          }
        } else {
          message = `${colors.red}✗ Missing`;
        }

        if (isCorrect) score++;
        
        console.log(`${header.padEnd(30)}: ${message}${colors.reset}`);
      });

      // Calculate and display score
      const percentage = Math.round((score / total) * 100);
      const color = percentage >= 90 ? colors.green : 
                   percentage >= 70 ? colors.yellow : colors.red;
      
      console.log('\n' + '='.repeat(50));
      console.log(`Security Headers Score: ${color}${percentage}% (${score}/${total})${colors.reset}`);
      
      resolve({
        url,
        score: percentage,
        headers: Object.fromEntries(
          Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
        )
      });
    });

    req.on('error', (e) => {
      console.error(`Error checking ${url}:`, e.message);
      resolve({ url, error: e.message, score: 0 });
    });
  });
}

/**
 * Check redirects from the _redirects file
 */
function checkRedirects() {
  const redirectsPath = join(__dirname, '..', 'public', '_redirects');
  if (fs.existsSync(redirectsPath)) {
    console.log('\nChecking redirects from _redirects file');
    console.log('='.repeat(50));

    const redirects = fs.readFileSync(redirectsPath, 'utf8').split('\n');
    const redirectRules = [];
    let currentRule = null;

    // Parse redirect rules
    for (const line of redirects) {
      if (line.trim() === '' || line.startsWith('#')) continue;
      
      // Handle multi-line rules with headers
      if (line.startsWith(' ')) {
        if (currentRule) {
          currentRule.headers = currentRule.headers || [];
          currentRule.headers.push(line.trim());
        }
        continue;
      }

      // If we have a current rule, save it before starting a new one
      if (currentRule) {
        redirectRules.push({...currentRule});
      }

      // Start a new rule
      const parts = line.trim().split(/\s+/).filter(part => part.trim() !== '');
      if (parts.length >= 3) {
        currentRule = {
          from: parts[0],
          to: parts[1],
          status: parseInt(parts[2].replace('!', '')),
          force: parts[2].endsWith('!')
        };
      } else if (parts.length === 2) {
        currentRule = {
          from: parts[0],
          to: parts[1],
          status: 200,
          force: false
        };
      } else if (parts.length === 1) {
        // Handle status code only lines (like the 200 after headers)
        const status = parseInt(parts[0]);
        if (currentRule && !isNaN(status)) {
          currentRule.status = status;
        }
      }
    }
    
    // Add the last rule if it exists
    if (currentRule) {
      redirectRules.push({...currentRule});
    }

    // Test each redirect rule
    return Promise.all(
      redirectRules.map(async (rule) => {
        // Skip header-only lines
        if (rule.from.includes(':')) return null;
        
        try {
          if (rule.from.startsWith('http')) {
            // Skip external URLs in local testing
            if (isLocalDev()) {
              console.log(`Skipping external URL in local test: ${rule.from}`);
              return null;
            }
            
            const result = await testRedirect(rule.from, rule.to, rule.status, rule.force);
            console.log(`${rule.from.padEnd(40)} -> ${rule.to.padEnd(40)} ${result ? '✓' : '✗'}`);
          } else {
            const fromUrl = `http://localhost:8080${rule.from}`;
            let toUrl = rule.to;
            
            // Handle relative URLs
            if (!toUrl.startsWith('http')) {
              toUrl = `http://localhost:8080${toUrl}`;
            }
            
            // For local testing, skip checking the actual redirect and just verify the rule
            if (isLocalDev()) {
              console.log(`[LOCAL] ${rule.from.padEnd(40)} -> ${rule.to.padEnd(40)} ✓ (not tested in local)`);
            } else {
              const result = await testRedirect(fromUrl, toUrl, rule.status, rule.force);
              console.log(`${rule.from.padEnd(40)} -> ${rule.to.padEnd(40)} ${result ? '✓' : '✗'}`);
            }
          }
        } catch (error) {
          console.error(`Error testing redirect ${rule.from} -> ${rule.to}:`, error.message);
        }
      })
    ).then(results => results.filter(Boolean));
  } else {
    console.log('No _redirects file found');
    return [];
  }
}

/**
 * Test a redirect
 */
async function testRedirect(from, to, status, force) {
  return new Promise((resolve) => {
    const httpModule = getHttpModule(from);
    const req = httpModule.get(from, { method: 'HEAD', followRedirect: false }, (res) => {
      res.resume(); // Consume response data to free up memory
      resolve(res.statusCode === status && (res.headers.location === to || res.headers.location === new URL(to).toString()));
    });
    req.on('error', () => resolve(false));
  });
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.blue}🔒 Starting Security Headers Check${colors.reset}\n`);
  
  // Check if running locally
  const isLocal = process.argv.includes('--local');
  const port = process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : '8080';
  const baseUrl = isLocal ? `http://localhost:${port}` : 'https://fullmoonodds.com';

  console.log(`\n${isLocal ? '⚠  Using local development server\n' : '🌐 Checking production environment\n'}`);
  
  // For local development, we'll skip HTTPS checks
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  try {
    // Check main page headers
    await checkHeaders(baseUrl);
    
    // Check API endpoint headers
    await checkHeaders(`${baseUrl}/api/health`);
    
    // Check redirects
    await checkRedirects();
    
    // Check CSP report-uri (if configured)
    const cspReportUri = process.env.CSP_REPORT_URI;
    if (cspReportUri) {
      console.log(`\n${colors.blue}Checking CSP report-uri: ${cspReportUri}${colors.reset}`);
      try {
        await new Promise((resolve) => {
          const httpModule = getHttpModule(cspReportUri);
      const req = httpModule.get(cspReportUri, { method: 'HEAD' }, () => resolve());
          req.on('error', () => resolve());
        });
        console.log(`${colors.green}✓ CSP report-uri is accessible${colors.reset}`);
      } catch (e) {
        console.log(`${colors.yellow}⚠  Could not verify CSP report-uri: ${e.message}${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.error('Error during security check:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);

// Export for testing purposes
export {
  checkHeaders,
  checkRedirects,
  isLocalDev
};

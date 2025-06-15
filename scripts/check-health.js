#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');
const config = require('../../uptimerobot.config');

const PORT = process.env.PORT || 8080;
const HOST = 'localhost';
const HEALTH_CHECK_URL = `http://${HOST}:${PORT}${config.healthCheckPath}`;
const PRODUCTION_URL = `${config.websiteUrl}${config.healthCheckPath}`;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function to make HTTP requests
function checkHealth(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          resolve({
            status: 'success',
            statusCode: res.statusCode,
            responseTime,
            data: json,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: 'error',
            error: 'Invalid JSON response',
            response: data,
            statusCode: res.statusCode,
            responseTime
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 'timeout',
        error: 'Request timed out after 10 seconds',
        responseTime: 10000
      });
    });
  });
}

// Format response time with color based on threshold
function formatResponseTime(ms) {
  if (ms < 500) return `${colors.green}${ms}ms${colors.reset}`;
  if (ms < 2000) return `${colors.yellow}${ms}ms${colors.reset}`;
  return `${colors.red}${ms}ms (slow)${colors.reset}`;
}

// Display check results
function displayResults(result, isLocal = false) {
  const prefix = isLocal ? 'Local' : 'Production';
  console.log(`\n${colors.blue}=== ${prefix} Health Check ===${colors.reset}`);
  
  if (result.status === 'success') {
    console.log(`✅ ${colors.green}Status: ${result.statusCode}${colors.reset}`);
    console.log(`⏱  Response Time: ${formatResponseTime(result.responseTime)}`);
    console.log('📊 Response Data:', JSON.stringify(result.data, null, 2));
    
    // Check security headers
    console.log('\n🔒 Security Headers:');
    const securityHeaders = {
      'content-security-policy': result.headers['content-security-policy'] ? '✅' : '❌',
      'x-content-type-options': result.headers['x-content-type-options'] ? '✅' : '❌',
      'x-frame-options': result.headers['x-frame-options'] ? '✅' : '❌',
      'x-xss-protection': result.headers['x-xss-protection'] ? '✅' : '❌',
      'strict-transport-security': result.headers['strict-transport-security'] ? '✅' : '❌'
    };
    
    Object.entries(securityHeaders).forEach(([header, status]) => {
      console.log(`  ${header}: ${status}`);
    });
  } else {
    console.error(`❌ ${colors.red}Error: ${result.error || 'Unknown error'}${colors.reset}`);
    if (result.statusCode) {
      console.error(`Status Code: ${result.statusCode}`);
    }
    if (result.response) {
      console.error('Response:', result.response);
    }
  }
}

// Main function
async function main() {
  try {
    // Check local health
    console.log(`${colors.blue}Checking local health...${colors.reset}`);
    const localResult = await checkHealth(HEALTH_CHECK_URL);
    displayResults(localResult, true);
    
    // Check production health if URL is configured
    if (config.websiteUrl && config.websiteUrl.startsWith('http')) {
      console.log(`\n${colors.blue}Checking production health...${colors.reset}`);
      const prodResult = await checkHealth(PRODUCTION_URL);
      displayResults(prodResult, false);
    }
    
  } catch (error) {
    console.error('Error during health check:', error);
    process.exit(1);
  }
}

// Run the health check
main();

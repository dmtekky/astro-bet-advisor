#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8080;
const HOST = 'localhost';
const URL = `http://${HOST}:${PORT}`;

// Start the development server if not already running
function startServer() {
  try {
    // Check if server is already running
    execSync(`lsof -i:${PORT}`, { stdio: 'ignore' });
    console.log(`Server already running on port ${PORT}`);
  } catch (error) {
    console.log('Starting development server...');
    // Start the server in the background
    execSync('npm run dev &', { stdio: 'ignore' });
    // Give the server some time to start
    execSync('sleep 5');
  }
}

// Check security headers
function checkHeaders(url) {
  return new Promise((resolve) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      console.log('\n=== Security Headers ===');
      
      const requiredHeaders = [
        'content-security-policy',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'strict-transport-security'
      ];

      const headers = {};
      let missingHeaders = [...requiredHeaders];

      // Check each header
      Object.entries(res.headers).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        headers[lowerKey] = value;
        
        // Remove from missing if found
        const index = missingHeaders.indexOf(lowerKey);
        if (index > -1) {
          missingHeaders.splice(index, 1);
        }
      });

      // Display results
      console.log('\nFound Headers:');
      Object.entries(headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      if (missingHeaders.length > 0) {
        console.log('\n❌ Missing Headers:');
        missingHeaders.forEach(header => {
          console.log(`  - ${header}`);
        });
      } else {
        console.log('\n✅ All security headers are present');
      }

      resolve();
    }).on('error', (error) => {
      console.error('Error checking headers:', error.message);
      process.exit(1);
    });
  });
}

// Run the checks
async function main() {
  try {
    startServer();
    await checkHeaders(URL);
    console.log('\nSecurity header check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

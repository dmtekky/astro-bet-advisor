// Scraper for ESPN MLB Team Stats Table (Arizona Diamondbacks)
// Usage: node scrape-espn-team-stats.js [url]

import puppeteer from 'puppeteer';

const DEFAULT_URL = 'https://www.espn.com/mlb/team/stats/_/name/ari/arizona-diamondbacks/season/2025';

async function scrapeTeamStats(url = DEFAULT_URL) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set a user agent to avoid detection as a bot
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  
  console.log(`Navigating to: ${url}`);
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 60000 // 60 seconds timeout for page load
  });

  // Wait for at least one stats table to appear (try multiple selectors)
  let selector = 'table', // Start with a very generic selector
      tablesFound = false,
      attempts = 0,
      maxAttempts = 3,
      delay = 5000; // 5 seconds between attempts

  while (!tablesFound && attempts < maxAttempts) {
    console.log(`Attempt ${attempts + 1}/${maxAttempts}: Looking for stats tables...`);
    
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      const tableCount = await page.$$eval(selector, tables => tables.length);
      console.log(`Found ${tableCount} tables on the page`);
      
      if (tableCount > 0) {
        tablesFound = true;
        break;
      }
    } catch (err) {
      console.log(`Attempt ${attempts + 1} failed: ${err.message}`);
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (!tablesFound) {
    const html = await page.content();
    const fs = await import('fs');
    fs.writeFileSync('debug-espn.html', html);
    await browser.close();
    throw new Error(`No stats tables found after ${maxAttempts} attempts. Saved page HTML to debug-espn.html`);
  }
  try {
    await page.waitForSelector(selector, { timeout: 15000 });
  } catch (err) {
    // Save HTML for debugging
    const html = await page.content();
    const fs = await import('fs');
    fs.writeFileSync('debug-espn.html', html);
    await browser.close();
    throw new Error(`Selector '${selector}' not found! Saved HTML to debug-espn.html. Inspect this file to update your selector.`);
  }

  // Extract all stats tables (batting, pitching, etc.)
  console.log('Extracting table data...');
  const tables = await page.$$eval(selector, (tables) => {
    return tables.map(table => {
      // Extract headers
      const headers = Array.from(table.querySelectorAll('thead tr th')).map(th => th.innerText.trim());
      // Extract rows
      const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        // Map to header if possible
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = cells[i] || '';
        });
        return obj;
      });
      return { headers, rows };
    });
  });

  await browser.close();

  // Print output as JSON
  console.log(JSON.stringify({ url, tables }, null, 2));
}

// Allow URL override from command line
const url = process.argv[2] || DEFAULT_URL;
scrapeTeamStats(url).catch(err => {
  console.error('Error scraping ESPN stats:', err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Script to schedule regular updates of odds data
 * This script will fetch data for multiple sports on a staggered schedule
 * to ensure we stay within the 500 requests per month limit
 * 
 * Usage: node update_odds_schedule.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Sports to fetch data for
const SPORTS = [
  'soccer',  // Default to EPL
  'nba',
  'nfl',
  'mlb',
  'uefa',    // UEFA Euro Championship
];

// Schedule configuration
const CONFIG = {
  // How often to update each sport (in hours)
  updateInterval: {
    soccer: 24,   // Once per day
    nba: 24,      // Once per day
    nfl: 48,      // Every 2 days
    mlb: 24,      // Once per day
    uefa: 24,     // Once per day
  },
  
  // Stagger updates to avoid hitting API limits
  staggerMinutes: 30,
};

// Path to the fetch script
const scriptPath = path.join(__dirname, 'fetch_odds_data.js');

// Create a log directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Function to run the fetch script for a sport
function fetchOddsForSport(sport) {
  const logFile = path.join(logDir, `${sport}_odds_update.log`);
  
  console.log(`Fetching odds data for ${sport}...`);
  
  exec(`node ${scriptPath} ${sport} >> ${logFile} 2>&1`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching odds for ${sport}:`, error);
      return;
    }
    
    console.log(`Successfully updated odds for ${sport}`);
    
    // Schedule the next update
    const nextUpdateHours = CONFIG.updateInterval[sport] || 24;
    const nextUpdateMs = nextUpdateHours * 60 * 60 * 1000;
    
    console.log(`Next update for ${sport} scheduled in ${nextUpdateHours} hours`);
    
    setTimeout(() => fetchOddsForSport(sport), nextUpdateMs);
  });
}

// Schedule initial fetches with staggering
SPORTS.forEach((sport, index) => {
  const delayMinutes = index * CONFIG.staggerMinutes;
  const delayMs = delayMinutes * 60 * 1000;
  
  console.log(`Scheduling initial fetch for ${sport} in ${delayMinutes} minutes`);
  
  setTimeout(() => fetchOddsForSport(sport), delayMs);
});

console.log('Odds update scheduler started');
console.log(`Monitoring ${SPORTS.length} sports with staggered updates`);
console.log('Press Ctrl+C to stop');

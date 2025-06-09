#!/usr/bin/env node

const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY
);

async function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`);
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error during ${description.toLowerCase()}:`, error.message);
    return false;
  }
}

async function updateNbaPipeline() {
  console.log('🏀 Starting NBA Data Update Pipeline\n');
  
  // 1. Fetch and update NBA data (teams, players, games, stats)
  const fetchSuccess = await runCommand(
    'node scripts/fetch_nba_data.js',
    'Fetching NBA data from MySportsFeeds'
  );
  
  if (!fetchSuccess) {
    console.error('❌ Failed to fetch NBA data. Aborting pipeline.');
    process.exit(1);
  }
  
  // 2. Update player impact scores
  const scoresSuccess = await runCommand(
    'node scripts/update-player-scores.js',
    'Updating player impact scores'
  );
  
  if (!scoresSuccess) {
    console.error('⚠️ Warning: Failed to update player impact scores');
  }
  
  // 3. Update astro scores
  const astroSuccess = await runCommand(
    'node scripts/update-nba-astro-scores-fixed.cjs',
    'Updating astrological influence scores'
  );
  
  if (!astroSuccess) {
    console.error('⚠️ Warning: Failed to update astrological influence scores');
  }
  
  console.log('\n🎉 NBA Data Update Pipeline completed!');
  return fetchSuccess && scoresSuccess && astroSuccess;
}

// Run the pipeline
updateNbaPipeline()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error in NBA pipeline:', error);
    process.exit(1);
  });

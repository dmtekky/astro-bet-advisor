#!/usr/bin/env node

/**
 * Baseball Player Data Update Script
 * 
 * This script updates all baseball player data in the correct sequence:
 * 1. Updates basic player stats (update-player-scores.ts)
 * 2. Recalculates impact scores (recalculate_impact_scores.js)
 * 3. Updates astrological scores (astroScore_2025-06-07.cjs)
 * 
 * Usage: node scripts/update-baseball-scores.js
 */

require('ts-node/register'); // Enable TypeScript execution
const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPTS = [
  {
    name: 'Player Stats Update',
    path: path.join(__dirname, 'update-player-scores.ts'),
    type: 'ts'
  },
  {
    name: 'Impact Scores',
    path: path.join(__dirname, 'recalculate_impact_scores.js'),
    type: 'js'
  },
  {
    name: 'Astrological Scores',
    path: path.join(__dirname, 'astroScore_2025-06-07.cjs'),
    type: 'js'
  }
];

function runScript(script) {
  console.log(`\n🚀 Starting ${script.name}...`);
  console.log('='.repeat(50));
  
  try {
    let command, args;
    if (script.type === 'ts') {
      command = 'npx';
      args = ['ts-node', script.path];
    } else {
      command = 'node';
      args = [script.path];
    }
    
    const result = spawnSync(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });
    
    if (result.status !== 0) {
      throw new Error(`Script failed with code ${result.status}`);
    }
    
    console.log(`✅ ${script.name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${script.name}:`, error.message);
    return false;
  }
}

function runAllScripts() {
  console.log('⚾ Starting Baseball Player Data Update Process');
  console.log('='.repeat(50));
  
  for (const script of SCRIPTS) {
    const success = runScript(script);
    if (!success) {
      console.error(`❌ Aborting due to failure in ${script.name}`);
      process.exit(1);
    }
    
    // Add a small delay between scripts
    if (script !== SCRIPTS[SCRIPTS.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds before next step...\n');
      require('child_process').execSync('sleep 2');
    }
  }
  
  console.log('\n🎉 All updates completed successfully!');
}

// Run the script
runAllScripts();

#!/usr/bin/env node

/**
 * Database Restoration Script for Full Moon Odds
 * 
 * This script restores a Supabase database from a backup file.
 * Use with caution as this will overwrite existing data.
 * 
 * Usage: node scripts/restore-db.js [backup-file]
 * If no backup file is specified, it will use the most recent backup.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration (should match backup script)
const CONFIG = {
  backupDir: path.join(process.env.HOME, 'backups', 'full-moon-odds'),
  databaseUrl: process.env.SUPABASE_DB_URL || 'postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres'
};

// Helper function to get the most recent backup file
function getMostRecentBackup() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    console.error(`Backup directory does not exist: ${CONFIG.backupDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse();
    
  if (files.length === 0) {
    console.error('No backup files found');
    process.exit(1);
  }
  
  return path.join(CONFIG.backupDir, files[0]);
}

// Ask for confirmation
function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question + ' (y/N) ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Main function
async function main() {
  try {
    // Get backup file path from command line or use most recent
    let backupFile = process.argv[2];
    
    if (!backupFile) {
      backupFile = getMostRecentBackup();
      console.log(`Using most recent backup: ${backupFile}`);
    }
    
    // Verify backup file exists
    if (!fs.existsSync(backupFile)) {
      console.error(`Backup file not found: ${backupFile}`);
      process.exit(1);
    }
    
    // Show warning and get confirmation
    console.log('\n⚠️  WARNING: This will overwrite your database with the backup!');
    console.log(`Database: ${CONFIG.databaseUrl}`);
    console.log(`Backup:   ${backupFile}\n`);
    
    const proceed = await confirm('Are you sure you want to continue?');
    if (!proceed) {
      console.log('Restore cancelled');
      process.exit(0);
    }
    
    console.log('Starting database restoration...');
    
    // Drop and recreate the database (requires superuser)
    // Note: This is a simplified example. In production, you might want to:
    // 1. Create a new database
    // 2. Restore to the new database
    // 3. Verify the restore
    // 4. Switch the application to use the new database
    
    console.log('Restoring database (this may take a while)...');
    const restoreCmd = `psql ${CONFIG.databaseUrl} < ${backupFile}`;
    execSync(restoreCmd, { stdio: 'inherit' });
    
    console.log('✅ Database restoration completed successfully');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

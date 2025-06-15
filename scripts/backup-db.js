#!/usr/bin/env node

/**
 * Database Backup Script for Full Moon Odds
 * 
 * This script creates a backup of the Supabase database and stores it in a specified location.
 * It can be run manually or scheduled via cron job.
 * 
 * Prerequisites:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login to Supabase: supabase login
 * 3. Set up Supabase project: supabase link --project-ref your-project-ref
 * 4. Create a backup directory: mkdir -p ~/backups/full-moon-odds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Configuration
const CONFIG = {
  // Backup directory (should be outside of version control)
  backupDir: path.join(process.env.HOME, 'backups', 'full-moon-odds'),
  
  // Number of backups to keep
  keepBackups: 30, // 30 days of daily backups
  
  // Supabase project reference (get from project settings)
  projectRef: process.env.SUPABASE_PROJECT_REF || 'your-project-ref',
  
  // Database URL (for verification)
  databaseUrl: process.env.SUPABASE_DB_URL || 'postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres'
};

// Create backup directory if it doesn't exist
if (!fs.existsSync(CONFIG.backupDir)) {
  console.log(`Creating backup directory: ${CONFIG.backupDir}`);
  fs.mkdirSync(CONFIG.backupDir, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
const backupFile = path.join(CONFIG.backupDir, `backup-${timestamp}.sql`);

console.log('Starting database backup...');
console.log(`Project: ${CONFIG.projectRef}`);
console.log(`Backup file: ${backupFile}`);

// Create backup using Supabase CLI
try {
  // 1. Create backup using pg_dump
  console.log('Creating database dump...');
  const dumpCmd = `pg_dump ${CONFIG.databaseUrl} > ${backupFile}`;
  execSync(dumpCmd, { stdio: 'inherit' });
  
  // 2. Verify backup file was created
  if (!fs.existsSync(backupFile)) {
    throw new Error('Backup file was not created');
  }
  
  const stats = fs.statSync(backupFile);
  if (stats.size === 0) {
    throw new Error('Backup file is empty');
  }
  
  console.log(`✅ Backup created successfully: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  // 3. Clean up old backups
  console.log('Cleaning up old backups...');
  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length > CONFIG.keepBackups) {
    const oldBackups = files.slice(CONFIG.keepBackups);
    console.log(`Removing ${oldBackups.length} old backup(s)...`);
    
    oldBackups.forEach(file => {
      const filePath = path.join(CONFIG.backupDir, file);
      console.log(`Removing old backup: ${filePath}`);
      fs.unlinkSync(filePath);
    });
  }
  
  console.log('✅ Backup process completed successfully');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  
  // Clean up failed backup file if it exists
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
  }
  
  process.exit(1);
}

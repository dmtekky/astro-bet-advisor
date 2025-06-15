#!/usr/bin/env node

/**
 * Backup Verification Script for Full Moon Odds
 * 
 * This script verifies the integrity of database backups by:
 * 1. Checking file existence and size
 * 2. Verifying the SQL header
 * 3. Optionally checking the structure of the SQL dump
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration (should match backup script)
const CONFIG = {
  backupDir: path.join(process.env.HOME, 'backups', 'full-moon-odds')
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function to list all backup files
function listBackupFiles() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    console.error(`${colors.red}Backup directory does not exist: ${CONFIG.backupDir}${colors.reset}`);
    return [];
  }
  
  return fs.readdirSync(CONFIG.backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse()
    .map(file => ({
      name: file,
      path: path.join(CONFIG.backupDir, file),
      size: fs.statSync(path.join(CONFIG.backupDir, file)).size
    }));
}

// Check if a file is a valid SQL dump
function isValidSqlDump(filePath) {
  try {
    // Check file header (first 200 bytes should be enough)
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(200);
    fs.readSync(fd, buffer, 0, 200, 0);
    fs.closeSync(fd);
    
    const header = buffer.toString('utf8');
    
    // Check for common SQL dump headers
    return header.includes('PostgreSQL database dump') || 
           header.includes('-- Dump created by PostgreSQL') ||
           header.startsWith('--')
  } catch (error) {
    console.error(`${colors.red}Error reading file: ${error.message}${colors.reset}`);
    return false;
  }
}

// Get basic file information
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isValid: isValidSqlDump(filePath)
    };
  } catch (error) {
    console.error(`${colors.red}Error getting file info: ${error.message}${colors.reset}`);
    return null;
  }
}

// Display verification results
function displayResults(backupFile) {
  console.log(`\n${colors.blue}=== Backup Verification ===${colors.reset}`);
  console.log(`File: ${backupFile.path}`);
  
  const fileInfo = getFileInfo(backupFile.path);
  if (!fileInfo) {
    console.log(`${colors.red}❌ Could not read file${colors.reset}`);
    return false;
  }
  
  console.log(`Size: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Created: ${fileInfo.created}`);
  console.log(`Modified: ${fileInfo.modified}`);
  
  if (fileInfo.isValid) {
    console.log(`${colors.green}✅ Valid SQL dump file${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.yellow}⚠️  File exists but may not be a valid SQL dump${colors.reset}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log(`${colors.blue}=== Full Moon Odds Backup Verification ===${colors.reset}`);
    
    // List all backup files
    const backupFiles = listBackupFiles();
    
    if (backupFiles.length === 0) {
      console.log(`${colors.yellow}No backup files found in ${CONFIG.backupDir}${colors.reset}`);
      return;
    }
    
    console.log(`\nFound ${backupFiles.length} backup(s):`);
    backupFiles.forEach((file, index) => {
      console.log(`[${index + 1}] ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Ask which backup to verify
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nEnter backup number to verify (or press Enter for most recent): ', async (answer) => {
      let selectedIndex = 0; // Default to most recent
      
      if (answer && !isNaN(answer)) {
        const num = parseInt(answer, 10) - 1;
        if (num >= 0 && num < backupFiles.length) {
          selectedIndex = num;
        }
      }
      
      const selectedBackup = backupFiles[selectedIndex];
      console.log(`\nVerifying: ${selectedBackup.name}`);
      
      // Verify the selected backup
      const isValid = displayResults(selectedBackup);
      
      if (isValid) {
        console.log(`\n${colors.green}✅ Backup appears to be valid${colors.reset}`);
      } else {
        console.log(`\n${colors.yellow}⚠️  Backup verification failed${colors.reset}`);
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error(`${colors.red}Verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

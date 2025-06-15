# Full Moon Odds - Database Backup System

This document outlines the database backup and recovery procedures for the Full Moon Odds application.

## Overview

The backup system consists of three main components:

1. **Backup Creation**: Creates compressed SQL dumps of the database
2. **Verification**: Validates the integrity of backup files
3. **Restoration**: Restores the database from a backup when needed

## Prerequisites

1. **Supabase CLI**: Required for database access
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-ref
   ```

2. **Environment Variables**: Set these in your `.env` file:
   ```env
   SUPABASE_DB_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   SUPABASE_PROJECT_REF=your-project-ref
   ```

## Available Commands

### Create a Backup
```bash
npm run db:backup
```

### Verify a Backup
```bash
npm run db:verify
```

### Restore from Backup
```bash
npm run db:restore [backup-file.sql]
```

## Backup Locations

- **Local Backups**: `~/backups/full-moon-odds/`
- **Retention**: 30 most recent backups are kept
- **Naming Convention**: `backup-YYYY-MM-DD-HHMMSS.sql`

## Automated Backups

### Linux/macOS (cron)

Add this to your crontab to run daily at 2 AM:

```bash
0 2 * * * cd /path/to/full-moon-odds && /usr/bin/npm run db:backup >> ~/backup.log 2>&1
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Set trigger to "Daily" at 2:00 AM
4. Action: Start a program
   - Program/script: `npm.cmd`
   - Arguments: `run db:backup`
   - Start in: `C:\path\to\full-moon-odds`

## Recovery Procedures

### Full Database Restore
1. Stop the application
2. Run: `npm run db:restore`
3. Select the backup to restore
4. Confirm the operation
5. Restart the application

### Partial Restore
For partial data recovery, you can:

1. Restore to a temporary database
2. Extract needed data using pg_dump with table selection
3. Import the extracted data to the production database

## Best Practices

1. **Regular Testing**: Periodically test restoration from backups
2. **Offsite Storage**: Copy backups to a different location
3. **Monitor Disk Space**: Ensure enough space for backups
4. **Secure Backups**: Encrypt sensitive backup files
5. **Documentation**: Keep this document updated with any changes

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure the backup directory is writable
   - Check database user permissions

2. **Backup Fails**
   - Verify database connection string
   - Check available disk space
   - Ensure pg_dump is in your PATH

3. **Restore Fails**
   - Verify backup file integrity
   - Check database user permissions
   - Ensure no active connections to the database

## Support

For assistance with the backup system, contact the development team at support@fullmoonodds.com.

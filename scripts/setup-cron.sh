#!/bin/bash

# Get the full path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Define the cron job command
CRON_JOB="0 2 * * * cd $PROJECT_DIR && node scripts/update-all-astro-scores.cjs >> $PROJECT_DIR/logs/astro_score_updates.log 2>&1"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Check if the cron job already exists
if ! (crontab -l 2>/dev/null | grep -q "update-all-astro-scores"); then
    # Add the cron job
    (crontab -l 2>/dev/null; echo "# Astro score daily update"; echo "$CRON_JOB") | crontab -
    echo "✅ Daily astro score update cron job has been set up."
    echo "   It will run daily at 2 AM."
    echo "   Logs will be saved to: $PROJECT_DIR/logs/astro_score_updates.log"
else
    echo "ℹ️  Cron job for astro score updates already exists."
fi

echo "\nCurrent crontab:"
crontab -l 2>/dev/null | grep -A 2 "update-all-astro-scores" || echo "No astro score cron jobs found."

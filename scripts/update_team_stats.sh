#!/bin/bash
set -e

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Apply the migration to add wins, losses, and win_pct columns
echo "Applying database migration..."
ts-node scripts/apply_migration.ts

# Run the team scraper to update team stats
echo "Running team scraper..."
ts-node scripts/update_team_stats.ts

echo "Team stats update complete!"

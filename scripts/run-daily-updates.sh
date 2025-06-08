#!/bin/bash

# Set the working directory to the project root
cd "$(dirname "$0")/.."

# Log file for the update process
LOG_FILE="logs/player-score-updates-$(date +%Y%m%d).log"
mkdir -p logs

# Start the update process
echo "🚀 Starting daily player score update at $(date)" | tee -a "$LOG_FILE"

# Ensure Node.js and required dependencies are available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # Load nvm

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..." | tee -a "$LOG_FILE"
  npm install @supabase/supabase-js dotenv | tee -a "$LOG_FILE"
fi

# Run the update script
node scripts/update-player-scores.js 2>&1 | tee -a "$LOG_FILE"

# Check the result of the update
UPDATE_RESULT=${PIPESTATUS[0]}

if [ $UPDATE_RESULT -eq 0 ]; then
  echo "✅ Player score update completed successfully at $(date)" | tee -a "$LOG_FILE"
  # You can add notification here (e.g., send email, Slack notification, etc.)
else
  echo "❌ Player score update failed with code $UPDATE_RESULT at $(date)" | tee -a "$LOG_FILE"
  # You can add error notification here
fi

exit $UPDATE_RESULT

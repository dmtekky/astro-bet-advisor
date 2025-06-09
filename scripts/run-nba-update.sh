#!/bin/bash

# Set the working directory to the project root
cd "$(dirname "$0")/.."

# Create logs directory if it doesn't exist
mkdir -p logs

# Log file with today's date
LOG_FILE="logs/nba-update-$(date +%Y%m%d).log"

# Function to log messages
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start the update process
log "🚀 Starting NBA update process"
log "Working directory: $(pwd)"

# Load environment variables
if [ -f .env ]; then
  log "Loading environment variables from .env"
  export $(grep -v '^#' .env | xargs)
else
  log "Error: .env file not found"
  exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
  log "Error: Node.js is not installed or not in PATH"
  exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
  log "Error: npm is not installed or not in PATH"
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  log "Installing Node.js dependencies..."
  npm install >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    log "Error: Failed to install dependencies"
    exit 1
  fi
fi

# Run the NBA update pipeline
log "Running NBA update pipeline..."
node scripts/update_nba_pipeline.js 2>&1 | tee -a "$LOG_FILE"

# Check the result
PIPELINE_RESULT=${PIPESTATUS[0]}

if [ $PIPELINE_RESULT -eq 0 ]; then
  log "✅ NBA update completed successfully"
else
  log "❌ NBA update failed with code $PIPELINE_RESULT"
  # You can add notification here (e.g., send email, Slack, etc.)
fi

exit $PIPELINE_RESULT

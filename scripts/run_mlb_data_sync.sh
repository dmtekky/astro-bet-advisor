#!/bin/bash

# Set the working directory to the project root
cd "$(dirname "$0")/.."

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the script with full path to ensure it's found
/usr/bin/env python3 "$PWD/scripts/fetch_mlb_data.py" >> "$PWD/logs/mlb_data_sync_$(date +%Y%m%d_%H%M%S).log" 2>&1

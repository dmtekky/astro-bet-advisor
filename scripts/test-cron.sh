#!/bin/bash

# This script is just for testing cron setup
# It will create a test file with the current timestamp

TEST_FILE="logs/cron-test-$(date +%Y%m%d).log"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cron job test successful" > "$TEST_FILE"

# Also log the environment for debugging
env >> "logs/cron-env-$(date +%Y%m%d).log"

echo "Cron test completed. Check $TEST_FILE"

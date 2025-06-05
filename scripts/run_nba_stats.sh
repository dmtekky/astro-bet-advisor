#!/bin/bash

# Set environment variables
export SUPABASE_URL="https://awoxkynorbspcrrggbca.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w"
export MY_SPORTS_FEEDS_API_KEY="8844c949-54d6-4e72-ba93-203dfd"

# Run the script
node scripts/fetch_nba_stats_fixed.js

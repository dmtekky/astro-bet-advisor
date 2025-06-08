#!/bin/bash

echo "Please enter your Supabase URL:"
read -r SUPABASE_URL

echo "Please enter your Supabase service role key (or anon key if service role isn't available):"
read -r SUPABASE_KEY

# Export the environment variables
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_KEY"

# Run the cleanup script
echo "Running cleanup..."
npx ts-node --esm scripts/cleanupPlaceholderGames.ts

echo "Cleanup complete!"

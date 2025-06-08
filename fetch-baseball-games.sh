#!/bin/bash

# Script to fetch today's MLB games from API-Sports Baseball API
API_KEY="1eb29b16c5113e13ece74def4792dbca"
SEASON=2025
LEAGUE_ID=1  # MLB
TODAY=$(date +%Y-%m-%d)

echo "Fetching MLB games for today (${TODAY})..."

# Create directory for responses if it doesn't exist
mkdir -p api-responses

# Fetch games for today
curl -s --request GET \
  --url "https://v1.baseball.api-sports.io/games?league=${LEAGUE_ID}&season=${SEASON}&date=${TODAY}" \
  --header "x-rapidapi-host: v1.baseball.api-sports.io" \
  --header "x-rapidapi-key: ${API_KEY}" \
  > api-responses/todays-games.json

echo "Saved today's games to api-responses/todays-games.json"

# Check API response
if grep -q "errors" api-responses/todays-games.json; then
  echo "API Error detected. Response:"
  cat api-responses/todays-games.json
  echo ""
  echo "Let's try a different endpoint structure..."
  
  # Try alternative endpoint format
  curl -s --request GET \
    --url "https://baseball.api-sports.io/games?league=${LEAGUE_ID}&season=${SEASON}&date=${TODAY}" \
    --header "x-rapidapi-key: ${API_KEY}" \
    > api-responses/todays-games-alt.json
  
  echo "Saved alternative response to api-responses/todays-games-alt.json"
  
  if grep -q "errors" api-responses/todays-games-alt.json; then
    echo "Alternative endpoint also returned errors:"
    cat api-responses/todays-games-alt.json
  else
    echo "Alternative endpoint worked! Check api-responses/todays-games-alt.json"
  fi
fi

# Try a search for the exact API documentation
echo ""
echo "Checking API status and available endpoints..."
curl -s --request GET \
  --url "https://v1.baseball.api-sports.io/status" \
  --header "x-rapidapi-host: v1.baseball.api-sports.io" \
  --header "x-rapidapi-key: ${API_KEY}" \
  > api-responses/api-status.json

echo "Saved API status to api-responses/api-status.json"
cat api-responses/api-status.json

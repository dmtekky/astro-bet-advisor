#!/bin/bash

# Script to fetch player data from API-Sports Baseball API using curl
API_KEY="1eb29b16c5113e13ece74def4792dbca"
TEAM_ID=29  # Arizona Diamondbacks (assuming this is their ID)
SEASON=2025
LEAGUE_ID=1  # MLB

echo "Fetching player data from API-Sports..."

# Create directory for responses if it doesn't exist
mkdir -p api-responses

# Fetch team players
echo "Fetching team players..."
curl -s --request GET \
  --url "https://v1.baseball.api-sports.io/players?team=${TEAM_ID}&season=${SEASON}" \
  --header "x-rapidapi-host: v1.baseball.api-sports.io" \
  --header "x-rapidapi-key: ${API_KEY}" \
  > api-responses/players-response.json

echo "Saved players response to api-responses/players-response.json"

# Get the first player ID from the response
PLAYER_ID=$(cat api-responses/players-response.json | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PLAYER_ID" ]; then
  echo "Error: Could not extract player ID from response"
  exit 1
fi

echo "Using player ID: ${PLAYER_ID}"

# Fetch player statistics
echo "Fetching player statistics..."
curl -s --request GET \
  --url "https://v1.baseball.api-sports.io/players/statistics?league=${LEAGUE_ID}&season=${SEASON}&player=${PLAYER_ID}" \
  --header "x-rapidapi-host: v1.baseball.api-sports.io" \
  --header "x-rapidapi-key: ${API_KEY}" \
  > api-responses/player-stats-response.json

echo "Saved player stats to api-responses/player-stats-response.json"

# Fetch team statistics (also useful for table structure)
echo "Fetching team statistics..."
curl -s --request GET \
  --url "https://v1.baseball.api-sports.io/teams/statistics?league=${LEAGUE_ID}&season=${SEASON}&team=${TEAM_ID}" \
  --header "x-rapidapi-host: v1.baseball.api-sports.io" \
  --header "x-rapidapi-key: ${API_KEY}" \
  > api-responses/team-stats-response.json

echo "Saved team stats to api-responses/team-stats-response.json"

# Fetch games for today's date
TODAY=$(date +%Y-%m-%d)
echo "Fetching games for today (${TODAY})..."
curl -s --request GET \
  --url "https://v1.baseball.api-sports.io/games?league=${LEAGUE_ID}&season=${SEASON}&date=${TODAY}" \
  --header "x-rapidapi-host: v1.baseball.api-sports.io" \
  --header "x-rapidapi-key: ${API_KEY}" \
  > api-responses/games-response.json

echo "Saved games to api-responses/games-response.json"

echo "Done! Please check the files in the api-responses directory."

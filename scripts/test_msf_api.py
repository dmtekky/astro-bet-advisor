import requests
import os
import base64
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# MySportsFeeds API credentials
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')

if not all([MSF_API_KEY, MSF_PASSWORD]):
    raise ValueError("Missing required environment variables")

# Test different API versions and formats
api_versions = [
    "v1.2",
    "v2.0",
    "v2.1",
    "v2.2"
]

season_formats = [
    "2025",
    "2025-regular",
    "2025-regular-season",
    "2025-REGULAR",
    "2025-Regular-Season"
]

# Prepare authentication headers
auth_headers = {
    "Authorization": f"Basic {base64.b64encode(f'{MSF_API_KEY}:MYSPORTSFEEDS'.encode()).decode()}"
}

# Test different endpoints
endpoints = [
    "team_profile",
    "team_roster",
    "team_schedule",
    "team_stats",
    "team_standings",
    "schedule",
    "game_schedule",
    "daily_schedule",
    "weekly_schedule",
    "game_boxscore",
    "game_playbyplay",
    "game_summary",
    "game_lineups",
    "game_injuries",
    "game_odds",
    "player_profile",
    "player_stats",
    "player_injuries",
    "player_odds"
]

print("Testing MySportsFeeds API configurations...")

for version in api_versions:
    for season in season_formats:
        print(f"\nTesting API version: {version}, Season: {season}")
        
        for endpoint in endpoints[:3]:  # Test only first 3 endpoints to avoid excessive API calls
            url = f"https://api.mysportsfeeds.com/{version}/pull/mlb/{season}/{endpoint}.json"
            print(f"\nTesting endpoint: {endpoint}")
            print(f"URL: {url}")
            
            try:
                response = requests.get(url, headers=auth_headers)
                print(f"Status code: {response.status_code}")
                
                if response.status_code == 200:
                    print("\nResponse data:")
                    print(json.dumps(response.json(), indent=2))
                elif response.status_code == 404:
                    print("\nEndpoint not found")
                else:
                    print(f"\nError: {response.text}")
                    
            except Exception as e:
                print(f"Error testing endpoint {endpoint}: {str(e)}")

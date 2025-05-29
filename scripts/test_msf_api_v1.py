import requests
import os
from dotenv import load_dotenv
import json
import base64

# Load environment variables
load_dotenv()

# MySportsFeeds API credentials
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = "MYSPORTSFEEDS"

if not MSF_API_KEY:
    raise ValueError("Missing required environment variable MY_SPORTS_FEEDS_API_KEY")

# API details
api_version = "1.2"
league = "mlb"
api_format = "json"

# Prepare authentication header
auth_header = base64.b64encode(f"{MSF_API_KEY}:{MSF_PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {
    "Authorization": f"Basic {auth_header}",
    "Content-Type": "application/json"
}

# Test different endpoints
endpoints = [
    # Team endpoints
    "team_profile",
    "team_roster",
    "team_schedule",
    "team_stats",
    "team_standings",
    
    # Game endpoints
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
    
    # Player endpoints
    "player_profile",
    "player_stats",
    "player_injuries",
    "player_odds"
]

# Test different season formats
season_formats = [
    "2024",
    "2024-regular",
    "2024-regular-season",
    "2024-REGULAR",
    "2024-Regular-Season"
]

print("Testing MySportsFeeds API v1.2...")

for season in season_formats:
    print(f"\nTesting season format: {season}")
    
    for endpoint in endpoints:
        # Try both with and without team ID
        urls = [
            f"https://api.mysportsfeeds.com/{api_version}/pull/{league}/{season}/{endpoint}.{api_format}",
            f"https://api.mysportsfeeds.com/{api_version}/pull/{league}/{season}/team/{endpoint}.{api_format}"
        ]
        
        for url in urls:
            print(f"\nTesting URL: {url}")
            
            try:
                response = requests.get(url, headers=headers)
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

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

# Test different endpoints
endpoints = [
    "team_roster",
    "team_profile",
    "team_schedule",
    "team_stats",
    "team_standings"
]

# API details
season_string = "2025-regular"
league = "mlb"
api_format = "json"

# Prepare authentication header
auth_header = base64.b64encode(f"{MSF_API_KEY}:{MSF_PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {
    "Authorization": f"Basic {auth_header}"
}

for endpoint in endpoints:
    url = f"https://api.mysportsfeeds.com/v2.1/pull/{league}/{season_string}/{endpoint}.{api_format}"
    print(f"\nTesting endpoint: {endpoint}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("\nResponse data:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error testing endpoint {endpoint}: {str(e)}")

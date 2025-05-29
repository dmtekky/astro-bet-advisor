import requests
import json
import base64
from datetime import datetime
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MySportsFeeds API credentials
MSF_API_KEY = "8844c949-54d6-4e72-ba93-203dfd"
MSF_PASSWORD = "MYSPORTSFEEDS"

# Supabase credentials
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

# API details
api_version = "v2.1"
league = "mlb"
season_string = "2025-regular"  # Current season
api_format = "json"

# Teams to test
teams_to_test = ["nyy", "bos", "atl", "phi", "mil"]

print("Fetching team data from player stats endpoint...")

# Function to make API request with rate limiting
def make_api_request(url, headers):
    while True:
        try:
            response = requests.get(url, headers=headers)
            print(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print("Rate limit hit, waiting 60 seconds...")
                time.sleep(60)
                continue
            else:
                print(f"Error: {response.text}")
                return None
        except Exception as e:
            print(f"Error making request: {str(e)}")
            return None

# Function to insert team data into Supabase
def insert_team_data(team_data):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return False
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/baseball_teams", 
            headers=headers,
            json=team_data
        )
        response.raise_for_status()
        print(f"Successfully inserted team: {team_data['abbreviation']}")
        return True
    except Exception as e:
        print(f"Error inserting team data: {str(e)}")
        return False

# Prepare headers once
auth_header = base64.b64encode(f"{MSF_API_KEY}:{MSF_PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {
    "Authorization": f"Basic {auth_header}",
    "Content-Type": "application/json"
}

# Dictionary to store unique team data
teams_data = {}

for team in teams_to_test:
    print(f"\nFetching data for team: {team}")
    url = f"https://api.mysportsfeeds.com/{api_version}/pull/{league}/{season_string}/player_stats_totals.{api_format}?team={team}"
    print(f"URL: {url}")
    
    # Get data with rate limiting
    data = make_api_request(url, headers)
    
    if data and 'playerStatsTotals' in data:
        # Process team data from player stats
        for player_stats in data['playerStatsTotals']:
            team_data = player_stats.get('team', {})
            team_id = team_data.get('id')
            
            if team_id and team_id not in teams_data:
                teams_data[team_id] = {
                    'id': team_id,
                    'abbreviation': team_data.get('abbreviation'),
                    'updated_at': datetime.now().isoformat()
                }
                print(f"\nFound team: {team_data.get('abbreviation')}")
                print(json.dumps(teams_data[team_id], indent=2))
                
                # Insert team data into Supabase
                insert_team_data(teams_data[team_id])
                
            # Add a small delay between requests
            time.sleep(1)

# Print all unique teams found
print("\nAll unique teams found:")
for team_id, team_data in teams_data.items():
    print(f"\nTeam ID: {team_id}")
    print(json.dumps(team_data, indent=2))

if __name__ == "__main__":
    pass

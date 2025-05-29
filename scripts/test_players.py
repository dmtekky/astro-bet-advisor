import os
from dotenv import load_dotenv
import requests
import json
import base64
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

# Test team abbreviation
TEST_TEAM_ABBR = "NYY"  # New York Yankees

print(f"Testing player fetch for team: {TEST_TEAM_ABBR}")

# Prepare headers
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# Query players by team abbreviation
url = f"{SUPABASE_URL}/rest/v1/baseball_players"
params = {
    'select': '*',
    'eq': f'player_current_team_abbreviation.eq.{TEST_TEAM_ABBR}'
}

response = requests.get(url, headers=headers, params=params)

if response.status_code == 200:
    players = response.json()
    print(f"\nFound {len(players)} players for team {TEST_TEAM_ABBR}")
    for player in players:
        print(f"\nPlayer: {player.get('full_name', 'Unknown')}")
        print(f"Position: {player.get('position', 'Unknown')}")
        print(f"Number: {player.get('number', 'Unknown')}")
        print(f"Team ID: {player.get('team_id', 'Unknown')}")
        print(f"Team Name: {player.get('team_name', 'Unknown')}")
        print(f"Current Team Abbr: {player.get('player_current_team_abbreviation', 'Unknown')}")
        print("-" * 40)
else:
    print(f"Error: {response.status_code}")
    print(response.text)

import os
import json
import base64
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Get MySportsFeeds API credentials
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')

if not MSF_API_KEY or not MSF_PASSWORD:
    print("Error: MY_SPORTS_FEEDS_API_KEY and MY_SPORTS_FEEDS_PASSWORD must be set in .env file")
    exit(1)

# Determine the current season string (e.g., "2025-regular")
# MySportsFeeds typically uses YYYY-regular or YYYY-playoff
current_year = datetime.now().year
season_string = f"{current_year}-regular" # Adjust if you need playoffs or a different year

# API endpoint details
league = 'mlb'
feed = 'player_stats_totals' # This corresponds to seasonal_player_stats in ohmysportsfeedspy
team_filter = 'nyy' # Test with one team to limit output, e.g., New York Yankees
api_format = 'json'

url = f"https://api.mysportsfeeds.com/v2.1/pull/{league}/{season_string}/{feed}.{api_format}?team={team_filter}"

print(f"Requesting URL: {url}")

# Prepare authentication header
auth_header = base64.b64encode(f"{MSF_API_KEY}:{MSF_PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {
    "Authorization": f"Basic {auth_header}"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)

    api_data = response.json()
    print("\nSuccessfully fetched data!")

    if api_data.get('playerStatsTotals') and len(api_data['playerStatsTotals']) > 0:
        print("\n--- First Player's Data --- (from playerStatsTotals list)")
        first_player_data = api_data['playerStatsTotals'][0]
        print(json.dumps(first_player_data, indent=2))

        # Specifically check for player name, team, and position fields
        player_info = first_player_data.get('player', {})
        print("\n--- Extracted Player Details --- (from the 'player' object)")
        print(f"  ID: {player_info.get('id')}")
        print(f"  First Name: {player_info.get('firstName')}")
        print(f"  Last Name: {player_info.get('lastName')}")
        print(f"  Primary Position: {player_info.get('primaryPosition')}")
        current_team_info = player_info.get('currentTeam', {})
        print(f"  Team ID: {current_team_info.get('id')}")
        print(f"  Team Abbreviation: {current_team_info.get('abbreviation')}")
    else:
        print("\nNo player statistics found in the response for the specified team/season.")
        print("Full API Response:")
        print(json.dumps(api_data, indent=2))

except requests.exceptions.HTTPError as http_err:
    print(f"\nHTTP error occurred: {http_err}")
    print(f"Response content: {response.text}")
except requests.exceptions.RequestException as req_err:
    print(f"\nRequest error occurred: {req_err}")
except json.JSONDecodeError:
    print("\nFailed to decode JSON from response.")
    print(f"Response content: {response.text}")
except Exception as e:
    print(f"\nAn unexpected error occurred: {e}")

import requests
import os
import base64
from dotenv import load_dotenv

load_dotenv()
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')

season_string = "2025-regular"
league = "mlb"
feed = "player_stats_totals"
url = f"https://api.mysportsfeeds.com/v2.1/pull/{league}/{season_string}/{feed}.json"
auth_header = base64.b64encode(f"{MSF_API_KEY}:{MSF_PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {"Authorization": f"Basic {auth_header}"}

def flatten(d, parent_key='', sep='_'):
    items = []
    for k, v in d.items():
        new_key = f'{parent_key}{sep}{k}' if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

try:
    print("Fetching player data...")
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    api_data = response.json()

    if api_data.get('playerStatsTotals'):
        first_player = api_data['playerStatsTotals'][0]
        flat = flatten(first_player)
        print("\nAll fields (flattened):")
        for key in sorted(flat.keys()):
            print(f"- {key}")
        
        # Print the first player's full data for reference
        print("\nSample player data:")
        print("------------------")
        print("player_id:", first_player.get('player', {}).get('id'))
        print("player_name:", first_player.get('player', {}).get('fullName'))
        print("\nRaw player data (first 500 chars):")
        print("--------------------------------")
        print(str(first_player)[:500] + "...")
        
        # Save the full data to a file for reference
        with open('player_sample.json', 'w') as f:
            import json
            json.dump(first_player, f, indent=2)
        print("\nSaved sample player data to player_sample.json")
        
    else:
        print("No player data found in the response!")

except Exception as e:
    print(f"An error occurred: {e}")

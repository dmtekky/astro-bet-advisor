import os
import json
import asyncio
import base64
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configuration
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')
SEASON = 'current'

async def main():
    """Check the API response for players."""
    auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
    auth_bytes = auth_string.encode('ascii')
    base64_auth = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        "Authorization": f"Basic {base64_auth}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # First, get the list of players
        players_url = "https://api.mysportsfeeds.com/v2.1/pull/nba/players.json"
        params = {
            "season": SEASON,
            "limit": 5  # Just get a few players for testing
        }
        
        try:
            print("Fetching players...")
            response = await client.get(players_url, params=params, headers=headers)
            response.raise_for_status()
            players_data = response.json()
            
            print("\nPlayers API Response:")
            print(json.dumps(players_data, indent=2)[:1000] + "...")  # Print first 1000 chars
            
            # If we have players, try to get stats for the first one
            if players_data.get('players'):
                player = players_data['players'][0]
                player_data = player.get('player', {})
                player_id = player_data.get('id')
                
                print("\nPlayer data:")
                print(f"Name: {player_data.get('firstName')} {player_data.get('lastName')}")
                print(f"ID: {player_id}")
                print("External Mappings:")
                for mapping in player_data.get('externalMappings', []):
                    print(f"  {mapping.get('source')}: {mapping.get('id')}")
                
                # Try different ID formats
                for id_format in [
                    player_id,  # Original ID
                    f"nba/player-{player_id}",  # Possible format with prefix
                    player_data.get('externalMappings', [{}])[0].get('id')  # First external mapping ID
                ]:
                    if not id_format:
                        continue
                        
                    print(f"\nTrying player ID format: {id_format}")
                    stats_url = f"https://api.mysportsfeeds.com/v2.1/pull/nba/players/{id_format}/statistics.json"
                    stats_params = {
                        "season": SEASON,
                        "stats": "pts,reb,ast"
                    }
                    
                    stats_response = await client.get(stats_url, params=stats_params, headers=headers)
                    stats_response.raise_for_status()
                    stats_data = stats_response.json()
                    
                    print("\nStats API Response:")
                    print(json.dumps(stats_data, indent=2)[:1000] + "...")
            
        except Exception as e:
            print(f"Error: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

if __name__ == "__main__":
    asyncio.run(main())

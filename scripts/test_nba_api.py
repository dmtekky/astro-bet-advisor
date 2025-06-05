import os
import json
import asyncio
import httpx
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
MSF_BASE_URL = "https://api.mysportsfeeds.com/v2.1/pull/nba"
MSF_API_KEY = os.getenv("MY_SPORTS_FEEDS_API_KEY")
MSF_PASSWORD = os.getenv("MY_SPORTS_FEEDS_PASSWORD")
SEASON = "2024-2025-regular"

async def test_players_endpoint():
    """Test the players endpoint to see all available fields."""
    url = f"{MSF_BASE_URL}/players.json?season={SEASON}&limit=1"
    
    async with httpx.AsyncClient(auth=(MSF_API_KEY, MSF_PASSWORD), timeout=30.0) as client:
        print(f"\n=== Testing Players Endpoint ===")
        print(f"URL: {url}")
        
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            if 'players' in data and data['players']:
                player = data['players'][0]['player']
                print("\nPlayer Fields:")
                print(json.dumps(player, indent=2, default=str))
                
                # Print available stats if any
                if 'currentTeam' in data['players'][0]:
                    print("\nCurrent Team Fields:")
                    print(json.dumps(data['players'][0]['currentTeam'], indent=2, default=str))
                
                return player
            
        except Exception as e:
            print(f"Error fetching player data: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
        return None

async def test_player_stats(player_id: str):
    """Test the player stats endpoint for a specific player."""
    url = f"{MSF_BASE_URL}/players/{player_id}/player_gamelogs.json?season={SEASON}"
    
    async with httpx.AsyncClient(auth=(MSF_API_KEY, MSF_PASSWORD), timeout=30.0) as client:
        print(f"\n=== Testing Player Stats for Player ID: {player_id} ===")
        print(f"URL: {url}")
        
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            if 'gamelogs' in data and data['gamelogs']:
                print(f"\nFound {len(data['gamelogs'])} game logs")
                
                # Print available stats from the first game log
                if len(data['gamelogs']) > 0:
                    print("\nAvailable stats from first game log:")
                    stats = data['gamelogs'][0].get('stats', {})
                    print(json.dumps(stats, indent=2, default=str))
                
                return data['gamelogs']
            
        except Exception as e:
            print(f"Error fetching player stats: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
        return None

async def test_teams_endpoint():
    """Test the teams endpoint to see all available fields."""
    url = f"{MSF_BASE_URL}/teams.json"
    
    async with httpx.AsyncClient(auth=(MSF_API_KEY, MSF_PASSWORD), timeout=30.0) as client:
        print(f"\n=== Testing Teams Endpoint ===")
        print(f"URL: {url}")
        
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            if 'teams' in data and data['teams']:
                print(f"\nFound {len(data['teams'])} teams")
                
                # Print fields from the first team
                team = data['teams'][0]
                print("\nTeam Fields:")
                print(json.dumps(team, indent=2, default=str))
                
                return team
            
        except Exception as e:
            print(f"Error fetching team data: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
        return None

async def main():
    print("=== Starting NBA API Tests ===")
    
    # Test teams endpoint
    team = await test_teams_endpoint()
    
    # Test players endpoint
    player = await test_players_endpoint()
    
    # If we got a player, test their stats
    if player and 'id' in player:
        await test_player_stats(player['id'])
    
    print("\n=== Tests Complete ===")

if __name__ == "__main__":
    asyncio.run(main())

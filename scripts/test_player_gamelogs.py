"""
This script tests the player_gamelogs endpoint in the MySportsFeeds API.
"""

import os
import sys
import asyncio
import base64
import json
import logging
from typing import Dict, Optional, List, Any
from dotenv import load_dotenv
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_player_gamelogs.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Get environment variables
MSF_API_KEY = os.environ.get('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.environ.get('MY_SPORTS_FEEDS_PASSWORD')
SEASON = 'current'

async def test_player_gamelogs():
    """Test the player_gamelogs endpoint."""
    if not all([MSF_API_KEY, MSF_PASSWORD]):
        logger.error("Missing required environment variables. Please check your .env file.")
        return
    
    # Add authentication headers
    auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
    auth_bytes = auth_string.encode('ascii')
    base64_auth = base64.b64encode(auth_bytes).decode('ascii')
    headers = {
        "Authorization": f"Basic {base64_auth}",
        "Accept": "application/json"
    }
    
    base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
    
    # First, get a player ID to test with
    players_url = f"{base_url}/players.json"
    params = {
        "season": SEASON,
        "limit": 1
    }
    
    try:
        async with httpx.AsyncClient() as client:
            # Get a player ID first
            logger.info(f"Fetching a player ID from {players_url}")
            response = await client.get(players_url, params=params, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Error fetching players: {response.status_code} - {response.text}")
                return
            
            data = response.json()
            if not data.get('players'):
                logger.error("No players found in the response")
                return
            
            player = data['players'][0]['player']
            player_id = player['id']
            player_name = f"{player['firstName']} {player['lastName']}"
            logger.info(f"Using player: {player_name} (ID: {player_id})")
            
            # Now try to get the player's gamelogs
            gamelogs_url = f"{base_url}/player_gamelogs.json"
            params = {
                "season": SEASON,
                "player": player_id,
                "limit": 5  # Limit to 5 most recent games
            }
            
            logger.info(f"Fetching gamelogs for player {player_id} from {gamelogs_url}")
            response = await client.get(gamelogs_url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Save the full response to a file
                with open('player_gamelogs_response.json', 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info("Full response saved to player_gamelogs_response.json")
                
                # Print the structure of the response
                logger.info(f"Response keys: {list(data.keys())}")
                
                # Try to find gamelogs in the response
                if 'gamelogs' in data and data['gamelogs']:
                    logger.info(f"Found {len(data['gamelogs'])} gamelogs in the response")
                    logger.info("First gamelog structure:")
                    logger.info(json.dumps(data['gamelogs'][0], indent=2)[:500] + "...")
                else:
                    logger.warning("No gamelogs found in the response")
                    logger.info("Full response structure:")
                    logger.info(json.dumps(data, indent=2)[:1000] + "...")
            else:
                logger.error(f"Error fetching gamelogs: {response.status_code} - {response.text}")
    
    except Exception as e:
        logger.error(f"Error testing player gamelogs: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"Response: {e.response.text[:500]}...")

if __name__ == "__main__":
    asyncio.run(test_player_gamelogs())

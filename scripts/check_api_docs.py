"""
This script checks the MySportsFeeds API documentation to understand the correct
endpoint structure for fetching player statistics.

Based on the documentation at:
https://www.mysportsfeeds.com/data-feeds/api-docs/

According to the documentation, the correct endpoint for player statistics is:
/players/player-{player_id}/statistics.json

Where {player_id} should be in the format 'player-{id}'.
"""

import os
import sys
import asyncio
import base64
import json
import logging
from dotenv import load_dotenv
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('check_api_docs.log')
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

async def test_player_stats_endpoint():
    """Test the player statistics endpoint with different formats."""
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
    
    # First, get a player ID from the players endpoint
    try:
        logger.info("Fetching a player from the API...")
        players_url = "https://api.mysportsfeeds.com/v2.1/pull/nba/players.json"
        params = {"season": SEASON, "limit": 1}
        
        async with httpx.AsyncClient() as client:
            # Get a player
            response = await client.get(players_url, params=params, headers=headers)
            response.raise_for_status()
            players_data = response.json()
            
            if not players_data or 'players' not in players_data or not players_data['players']:
                logger.error("No players found in the API response")
                return
            
            player_data = players_data['players'][0]['player']
            player_name = f"{player_data.get('firstName')} {player_data.get('lastName')}"
            player_id = str(player_data['id'])
            
            # Try to get NBA.com ID from external mappings
            nba_com_id = None
            for mapping in player_data.get('externalMappings', []):
                if mapping.get('source') == 'NBA.com':
                    nba_com_id = str(mapping.get('id'))
                    break
            
            logger.info(f"Found player: {player_name}")
            logger.info(f"MSF Player ID: {player_id}")
            logger.info(f"NBA.com Player ID: {nba_com_id if nba_com_id else 'Not found'}")
            
            # Test different endpoint formats
            test_cases = [
                f"players/player-{player_id}/statistics.json",  # Format from docs
                f"players/{player_id}/statistics.json",          # Without player- prefix
                f"players/player-{nba_com_id}/statistics.json" if nba_com_id else None,  # With NBA.com ID
            ]
            
            for endpoint in test_cases:
                if not endpoint:
                    continue
                    
                url = f"https://api.mysportsfeeds.com/v2.1/pull/nba/{endpoint}"
                params = {"season": SEASON, "stats": "pts,reb,ast"}
                
                logger.info(f"\nTesting endpoint: {endpoint}")
                try:
                    response = await client.get(url, params=params, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    logger.info(f"Success! Response: {json.dumps(data, indent=2)[:500]}...")
                except Exception as e:
                    logger.error(f"Error: {str(e)}")
                    if hasattr(e, 'response') and hasattr(e.response, 'text'):
                        logger.error(f"Response: {e.response.text[:500]}...")
    
    except Exception as e:
        logger.error(f"Error testing player stats endpoint: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"Response: {e.response.text[:500]}...")

if __name__ == "__main__":
    asyncio.run(test_player_stats_endpoint())

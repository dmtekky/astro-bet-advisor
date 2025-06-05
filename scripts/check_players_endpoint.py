"""
This script checks the players endpoint in the MySportsFeeds API v2.1.
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
        logging.FileHandler('check_players_endpoint.log')
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

async def check_players_endpoint():
    """Check the players endpoint in the API v2.1."""
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
    
    # First, get a list of players with more details
    url = f"{base_url}/players.json"
    params = {
        "season": SEASON,
        "limit": 10,  # Get 10 players for testing
        "offset": 0,
        "include": "player.stats"  # Try to include player stats
    }
    
    logger.info(f"Fetching players from: {url}")
    logger.info(f"With params: {params}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Save the full response to a file for inspection
                with open('players_response.json', 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info("Full response saved to players_response.json")
                
                # Print the structure of the response
                logger.info("Response keys: %s", list(data.keys()))
                
                # Check if we have players in the response
                if 'players' in data and data['players']:
                    logger.info(f"Found {len(data['players'])} players in the response")
                    
                    # Print the first player's structure
                    first_player = data['players'][0]
                    logger.info("First player structure:")
                    logger.info(json.dumps(first_player, indent=2)[:1000] + "...")
                    
                    # Check if the player has stats
                    if 'player' in first_player and 'stats' in first_player['player']:
                        logger.info("Player has stats in the response!")
                        logger.info("Stats structure:")
                        logger.info(json.dumps(first_player['player']['stats'], indent=2)[:1000] + "...")
                    else:
                        logger.warning("No stats found in the player object")
                        
                        # Check if there are any stats in references
                        if 'references' in data and 'playerSeasonStats' in data['references']:
                            logger.info("Found playerSeasonStats in references")
                            logger.info("First playerSeasonStats entry:")
                            first_stat = data['references']['playerSeasonStats'][0]
                            logger.info(json.dumps(first_stat, indent=2)[:1000] + "...")
                        else:
                            logger.warning("No playerSeasonStats found in references")
                else:
                    logger.warning("No players found in the response")
            else:
                logger.error(f"Error: {response.status_code} - {response.text[:500]}...")
    
    except Exception as e:
        logger.error(f"Error checking players endpoint: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"Response: {e.response.text[:500]}...")

if __name__ == "__main__":
    asyncio.run(check_players_endpoint())

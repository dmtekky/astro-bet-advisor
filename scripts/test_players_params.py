"""
This script tests different query parameters with the players endpoint.
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
        logging.FileHandler('test_players_params.log')
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

async def test_players_params():
    """Test different query parameters with the players endpoint."""
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
    
    # List of parameter sets to test
    param_sets = [
        {"name": "Default", "params": {"season": SEASON, "limit": 1}},
        {"name": "With stats", "params": {"season": SEASON, "limit": 1, "include": "player.stats"}},
        {"name": "With game logs", "params": {"season": SEASON, "limit": 1, "include": "player.gamelogs"}},
        {"name": "With season stats", "params": {"season": SEASON, "limit": 1, "include": "player.seasonStats"}},
        {"name": "With current season stats", "params": {"season": SEASON, "limit": 1, "include": "player.currentSeasonStats"}},
        {"name": "With player stats", "params": {"season": SEASON, "limit": 1, "stats": "pts,reb,ast"}},
    ]
    
    for param_set in param_sets:
        name = param_set["name"]
        params = param_set["params"]
        
        logger.info(f"\nTesting parameter set: {name}")
        logger.info(f"Params: {params}")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/players.json", params=params, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Save the response to a file
                    filename = f"players_{name.lower().replace(' ', '_')}.json"
                    with open(filename, 'w') as f:
                        json.dump(data, f, indent=2)
                    logger.info(f"Response saved to {filename}")
                    
                    # Log the structure of the response
                    logger.info(f"Response keys: {list(data.keys())}")
                    
                    if 'players' in data and data['players']:
                        logger.info(f"Found {len(data['players'])} players in the response")
                        
                        # Check if the player has any additional data
                        player = data['players'][0]['player']
                        additional_data = [k for k in player.keys() if k not in ['id', 'firstName', 'lastName', 'primaryPosition']]
                        logger.info(f"Player has additional data: {additional_data}")
                        
                        # Check if there are any references
                        if 'references' in data:
                            logger.info(f"References: {list(data['references'].keys())}")
                    
                else:
                    logger.error(f"Error: {response.status_code} - {response.text[:500]}...")
        
        except Exception as e:
            logger.error(f"Error testing parameter set {name}: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text[:500]}...")

if __name__ == "__main__":
    asyncio.run(test_players_params())

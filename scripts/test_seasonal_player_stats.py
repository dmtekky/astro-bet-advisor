"""
This script tests the seasonal_player_stats endpoint in the MySportsFeeds API.
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
        logging.FileHandler('test_seasonal_player_stats.log')
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

async def test_seasonal_player_stats():
    """Test the seasonal_player_stats endpoint."""
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
    
    # Try to get seasonal player stats
    stats_url = f"{base_url}/seasonal_player_stats.json"
    params = {
        "season": SEASON,
        "limit": 5  # Limit to 5 players
    }
    
    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Fetching seasonal player stats from {stats_url}")
            response = await client.get(stats_url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Save the full response to a file
                with open('seasonal_player_stats_response.json', 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info("Full response saved to seasonal_player_stats_response.json")
                
                # Print the structure of the response
                logger.info(f"Response keys: {list(data.keys())}")
                
                # Try to find player stats in the response
                if 'playerStats' in data and data['playerStats']:
                    logger.info(f"Found {len(data['playerStats'])} player stats in the response")
                    logger.info("First player stats structure:")
                    logger.info(json.dumps(data['playerStats'][0], indent=2)[:500] + "...")
                else:
                    logger.warning("No player stats found in the response")
                    logger.info("Full response structure:")
                    logger.info(json.dumps(data, indent=2)[:1000] + "...")
            else:
                logger.error(f"Error fetching seasonal player stats: {response.status_code} - {response.text}")
    
    except Exception as e:
        logger.error(f"Error testing seasonal player stats: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"Response: {e.response.text[:500]}...")

if __name__ == "__main__":
    asyncio.run(test_seasonal_player_stats())

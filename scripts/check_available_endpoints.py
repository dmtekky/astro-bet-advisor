"""
This script checks the available endpoints in the MySportsFeeds API.
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
        logging.FileHandler('check_endpoints.log')
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

async def check_endpoints():
    """Check available endpoints in the API."""
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
    
    # List of endpoints to check
    endpoints = [
        "",  # Root endpoint
        "players.json",
        "players/player-17408.json",  # Specific player
        "players/player-17408/statistics.json",
        "player_stats_totals.json",
        "cumulative_player_stats.json",
        "daily_player_stats.json",
        "player_gamelogs.json"
    ]
    
    async with httpx.AsyncClient() as client:
        for endpoint in endpoints:
            url = f"{base_url}/{endpoint}" if endpoint else base_url
            params = {"season": SEASON}
            
            # For some endpoints, we might need different parameters
            if "stat" in endpoint:
                params["stats"] = "pts,reb,ast"
            
            logger.info(f"\nChecking endpoint: {url}")
            try:
                response = await client.get(url, params=params, headers=headers)
                logger.info(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Response keys: {list(data.keys())}")
                    
                    # If we have players, show the first one's structure
                    if 'players' in data and data['players']:
                        logger.info(f"First player: {json.dumps(data['players'][0], indent=2)[:500]}...")
                    # If we have player stats, show the first one's structure
                    elif 'playerStatsTotals' in data and data['playerStatsTotals']:
                        logger.info(f"First player stats: {json.dumps(data['playerStatsTotals'][0], indent=2)[:500]}...")
                else:
                    logger.error(f"Error: {response.status_code} - {response.text[:500]}...")
                    
            except Exception as e:
                logger.error(f"Error checking endpoint {url}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_endpoints())

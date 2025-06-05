"""
This script fetches player statistics from the MySportsFeeds API using the v2.0 API.
"""

import os
import sys
import asyncio
import base64
import json
import logging
from typing import Dict, Optional, List, Any
from datetime import datetime
from dotenv import load_dotenv
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('player_stats_sync_v2.log')
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

class PlayerStatsFetcherV2:
    """Fetches player statistics from the MySportsFeeds API v2.0."""
    
    def __init__(self):
        """Initialize the fetcher with API credentials."""
        self.base_url = "https://api.mysportsfeeds.com/v2.0/pull/nba"
        self.headers = self._get_auth_headers()
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for API requests."""
        auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        return {
            "Authorization": f"Basic {base64_auth}",
            "Accept": "application/json"
        }
    
    async def fetch_players(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch a list of players from the API."""
        url = f"{self.base_url}/players"
        params = {
            "season": SEASON,
            "limit": limit,
            "offset": 0
        }
        
        logger.info(f"Fetching {limit} players from the API...")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                players = data.get('players', [])
                logger.info(f"Fetched {len(players)} players from the API")
                return players
                
        except Exception as e:
            logger.error(f"Error fetching players: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"API Response: {e.response.text[:500]}...")
            return []
    
    async def fetch_player_stats(self, player_id: int) -> Optional[Dict[str, Any]]:
        """Fetch statistics for a specific player using the seasonal_player_gamelogs feed."""
        url = f"{self.base_url}/seasonal_player_gamelogs"
        
        params = {
            "season": SEASON,
            "player": f"player-{player_id}",
            "limit": 100  # Adjust based on expected number of games
        }
        
        logger.info(f"Fetching stats for player ID: {player_id}")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=self.headers)
                
                if response.status_code == 200:
                    stats_data = response.json()
                    logger.info(f"Successfully fetched stats for player {player_id}")
                    return stats_data
                else:
                    logger.error(f"Error fetching stats for player {player_id}: {response.status_code}")
                    logger.error(f"Response: {response.text[:500]}...")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching stats for player {player_id}: {str(e)}")
            return None
    
    async def run(self):
        """Run the player stats fetcher."""
        # First, get a list of players
        players = await self.fetch_players(limit=3)
        
        if not players:
            logger.error("No players found. Cannot continue.")
            return
        
        # For each player, try to fetch their stats
        for player_info in players:
            player = player_info.get('player', {})
            player_id = player.get('id')
            player_name = f"{player.get('firstName', '')} {player.get('lastName', '')}"
            
            if not player_id:
                logger.warning(f"Skipping player with no ID: {player_name}")
                continue
            
            logger.info(f"\nProcessing player: {player_name} (ID: {player_id})")
            
            # Try to get player stats
            stats_data = await self.fetch_player_stats(player_id)
            
            if stats_data:
                # Log the stats data structure
                logger.info(f"Successfully fetched stats for {player_name}")
                logger.info(f"Stats data structure: {json.dumps(stats_data, indent=2)[:500]}...")
                
                # Save the full response to a file for inspection
                filename = f"player_{player_id}_stats.json"
                with open(filename, 'w') as f:
                    json.dump(stats_data, f, indent=2)
                logger.info(f"Full stats data saved to {filename}")
            else:
                logger.warning(f"Could not fetch stats for player {player_name} (ID: {player_id})")


async def main():
    """Main function to run the player stats fetcher."""
    if not all([MSF_API_KEY, MSF_PASSWORD]):
        logger.error("Missing required environment variables. Please check your .env file.")
        return
    
    fetcher = PlayerStatsFetcherV2()
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main())

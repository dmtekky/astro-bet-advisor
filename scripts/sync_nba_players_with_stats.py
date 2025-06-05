#!/usr/bin/env python3
"""
NBA Player and Stats Synchronization Script

This script fetches NBA player information and their statistics from MySportsFeeds API
and syncs them to the database.
"""

import os
import sys
import json
import logging
import asyncio
import aiohttp
import base64
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class NBADataSync:
    """Class to handle NBA player and stats synchronization."""
    
    def __init__(self):
        """Initialize the NBA data sync with configuration."""
        self.base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
        self.season = "current"  # Use 'current' for the current season
        self.api_key = os.getenv("MY_SPORTS_FEEDS_API_KEY")
        self.password = os.getenv("MY_SPORTS_FEEDS_PASSWORD")
        
        if not self.api_key or not self.password:
            raise ValueError("MY_SPORTS_FEEDS_API_KEY and MY_SPORTS_FEEDS_PASSWORD must be set in .env")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Generate authentication headers for API requests."""
        auth_str = f"{self.api_key}:{self.password}"
        auth_bytes = auth_str.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        return {
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        }
    
    async def fetch_players(self, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """Fetch a batch of NBA players."""
        url = f"{self.base_url}/players.json"
        params = {
            "limit": limit,
            "offset": offset
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=self._get_auth_headers(),
                params=params,
                timeout=30
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def fetch_player_stats(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Fetch player statistics for the current season."""
        url = f"{self.base_url}/{self.season}/player_stats_totals.json"
        params = {
            "limit": limit,
            "offset": offset
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=self._get_auth_headers(),
                params=params,
                timeout=30
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def get_all_players(self) -> List[Dict[str, Any]]:
        """Fetch all NBA players with pagination."""
        all_players = []
        offset = 0
        limit = 50
        
        while True:
            try:
                logger.info(f"Fetching players batch at offset {offset}")
                data = await self.fetch_players(limit=limit, offset=offset)
                
                if not data.get("players"):
                    break
                    
                batch = data["players"]
                all_players.extend(batch)
                
                if len(batch) < limit:
                    break
                    
                offset += limit
                await asyncio.sleep(1)  # Be nice to the API
                
            except Exception as e:
                logger.error(f"Error fetching players: {str(e)}")
                break
                
        return all_players
    
    async def get_all_player_stats(self) -> List[Dict[str, Any]]:
        """Fetch all player statistics with pagination and rate limiting."""
        all_stats = []
        offset = 0
        limit = 50
        
        while True:
            try:
                logger.info(f"Fetching stats batch at offset {offset}")
                data = await self.fetch_player_stats(limit=limit, offset=offset)
                
                if not data.get("playerStatsTotals"):
                    break
                    
                batch = data["playerStatsTotals"]
                all_stats.extend(batch)
                
                if len(batch) < limit:
                    break
                    
                offset += limit
                await asyncio.sleep(2)  # Add delay to avoid rate limiting
                
            except Exception as e:
                logger.error(f"Error fetching stats: {str(e)}")
                break
                
        return all_stats
    
    def save_to_file(self, data: Any, filename: str) -> None:
        """Save data to a JSON file."""
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Data saved to {filename}")
    
    async def sync_players_and_stats(self) -> None:
        """Sync player information and statistics."""
        logger.info("Starting NBA player and stats synchronization...")
        
        # Create a timestamp for the output files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Fetch all players
        logger.info("Fetching all NBA players...")
        players = await self.get_all_players()
        logger.info(f"Fetched {len(players)} players")
        
        # Save players to file
        players_file = f"nba_players_{timestamp}.json"
        self.save_to_file(players, players_file)
        
        # Fetch all player stats
        logger.info("Fetching player statistics...")
        player_stats = await self.get_all_player_stats()
        logger.info(f"Fetched stats for {len(player_stats)} players")
        
        # Save stats to file
        stats_file = f"nba_player_stats_{timestamp}.json"
        self.save_to_file(player_stats, stats_file)
        
        # Here you would typically sync to the database
        # For now, we'll just log what we would do
        logger.info("Skipping database sync (not implemented)")
        
        logger.info("Synchronization complete!")


async def main():
    """Main function to run the sync."""
    try:
        sync = NBADataSync()
        await sync.sync_players_and_stats()
    except Exception as e:
        logger.error(f"Error in main: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

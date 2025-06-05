#!/usr/bin/env python3
"""
NBA Team Statistics Fetcher

This script fetches NBA team statistics from the MySportsFeeds API.
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

class NBATeamStatsFetcher:
    """Class to fetch NBA team statistics."""
    
    def __init__(self):
        """Initialize the team stats fetcher with configuration."""
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
    
    async def fetch_teams(self) -> List[Dict[str, Any]]:
        """Fetch all NBA teams."""
        url = f"{self.base_url}/teams.json"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers=self._get_auth_headers(),
                timeout=30
            ) as response:
                response.raise_for_status()
                data = await response.json()
                return data.get("teams", [])
    
    async def fetch_team_stats(self, team_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Fetch team statistics for the current season."""
        url = f"{self.base_url}/{self.season}/team_stats_totals.json"
        params = {}
        
        if team_id:
            params["team"] = team_id
        
        all_stats = []
        offset = 0
        limit = 30  # Should be enough for all teams
        
        while True:
            try:
                params["offset"] = offset
                params["limit"] = limit
                
                async with aiohttp.ClientSession() as session:
                    logger.info(f"Fetching team stats for team ID: {team_id or 'all'}, offset: {offset}")
                    async with session.get(
                        url,
                        headers=self._get_auth_headers(),
                        params=params,
                        timeout=30
                    ) as response:
                        # Handle rate limiting
                        if response.status == 429:
                            retry_after = int(response.headers.get('Retry-After', 5))
                            logger.warning(f"Rate limited. Waiting {retry_after} seconds...")
                            await asyncio.sleep(retry_after)
                            continue
                            
                        response.raise_for_status()
                        data = await response.json()
                        
                        if not data.get("teamStatsTotals"):
                            break
                            
                        batch = data["teamStatsTotals"]
                        all_stats.extend(batch)
                        
                        if len(batch) < limit:
                            break
                            
                        offset += len(batch)
                        await asyncio.sleep(2)  # Be nice to the API
                        
            except aiohttp.ClientError as e:
                logger.error(f"Error fetching team stats: {str(e)}")
                break
                
        return all_stats
    
    def save_to_file(self, data: Any, filename: str) -> None:
        """Save data to a JSON file."""
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Data saved to {filename}")
    
    async def sync_team_stats(self) -> None:
        """Sync team information and statistics."""
        logger.info("Starting NBA team stats synchronization...")
        
        # Create a timestamp for the output files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Fetch all teams
        logger.info("Fetching NBA teams...")
        teams = await self.fetch_teams()
        logger.info(f"Fetched {len(teams)} teams")
        
        # Save teams to file
        teams_file = f"nba_teams_{timestamp}.json"
        self.save_to_file(teams, teams_file)
        
        # Fetch team stats
        logger.info("Fetching team statistics...")
        team_stats = await self.fetch_team_stats()
        logger.info(f"Fetched stats for {len(team_stats)} teams")
        
        # Save team stats to file
        stats_file = f"nba_team_stats_{timestamp}.json"
        self.save_to_file(team_stats, stats_file)
        
        logger.info("Team stats synchronization complete!")


async def main():
    """Main function to run the team stats sync."""
    try:
        fetcher = NBATeamStatsFetcher()
        await fetcher.sync_team_stats()
    except Exception as e:
        logger.error(f"Error in main: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

"""
This script tests the player statistics endpoint with the correct format.
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
        logging.FileHandler('test_player_stats.log')
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
    """Test the player statistics endpoint with the correct format."""
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
    
    # Base URL for the API
    base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
    
    # First, get a list of players to find a valid player ID
    try:
        logger.info("Fetching a list of players...")
        players_url = f"{base_url}/players.json"
        params = {
            "season": SEASON,
            "limit": 1
        }
        
        async with httpx.AsyncClient() as client:
            # Get a player
            response = await client.get(players_url, params=params, headers=headers)
            response.raise_for_status()
            players_data = response.json()
            
            if not players_data or 'players' not in players_data or not players_data['players']:
                logger.error("No players found in the API response")
                return
            
            player_data = players_data['players'][0]['player']
            player_id = player_data['id']
            player_name = f"{player_data.get('firstName', '')} {player_data.get('lastName', '')}"
            
            logger.info(f"Found player: {player_name} (ID: {player_id})")
            
            # Now try to get the player stats using the player ID
            # According to the API documentation, the endpoint should be:
            # /players/player-{player_id}/statistics.json
            stats_url = f"{base_url}/players/player-{player_id}/statistics.json"
            stats_params = {
                "season": SEASON,
                "stats": "pts,reb,ast,stl,blk,fgp,ftp,tpp,gp,min,fgm,fga,fta,ftm,tpa,tpm,offReb,defReb,turnover,pf,plusMinus"
            }
            
            logger.info(f"Fetching stats from: {stats_url}")
            logger.info(f"With params: {stats_params}")
            
            response = await client.get(stats_url, params=stats_params, headers=headers)
            
            if response.status_code == 200:
                stats_data = response.json()
                logger.info(f"Successfully fetched stats for {player_name}:")
                logger.info(json.dumps(stats_data, indent=2)[:500] + "...")
            else:
                logger.error(f"Error fetching stats: {response.status_code}")
                logger.error(f"Response: {response.text[:500]}...")
                
                # Try a different endpoint format
                logger.info("Trying alternative endpoint format...")
                
                # Try the cumulative player stats endpoint
                cum_stats_url = f"{base_url}/cumulative_player_stats.json"
                cum_params = {
                    "player": f"player-{player_id}",
                    "season": SEASON
                }
                
                logger.info(f"Trying cumulative stats endpoint: {cum_stats_url}")
                response = await client.get(cum_stats_url, params=cum_params, headers=headers)
                
                if response.status_code == 200:
                    stats_data = response.json()
                    logger.info(f"Successfully fetched cumulative stats for {player_name}:")
                    logger.info(json.dumps(stats_data, indent=2)[:500] + "...")
                else:
                    logger.error(f"Error fetching cumulative stats: {response.status_code}")
                    logger.error(f"Response: {response.text[:500]}...")
    
    except Exception as e:
        logger.error(f"Error testing player stats endpoint: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"Response: {e.response.text[:500]}...")

if __name__ == "__main__":
    asyncio.run(test_player_stats_endpoint())

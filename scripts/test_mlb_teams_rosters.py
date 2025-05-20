#!/usr/bin/env python3
"""
Script to test fetching MLB teams and specific team rosters from API-SPORTS.
This script will:
1. Fetch all MLB teams
2. Find Miami Marlins and Chicago Cubs
3. Fetch and display their rosters
"""
import os
import sys
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
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

# Constants
API_SPORTS_KEY = os.getenv('API_SPORTS_KEY')

if not API_SPORTS_KEY:
    logger.error("API_SPORTS_KEY not found in .env file")
    sys.exit(1)

class APISportsClient:
    """Client for interacting with the API-SPORTS API."""
    
    BASE_URL = "https://v1.baseball.api-sports.io"
    
    def __init__(self, api_key: str):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'x-rapidapi-key': str(api_key),
                'x-rapidapi-host': 'v1.baseball.api-sports.io',
                'x-apisports-key': str(api_key)  # Some endpoints might use this header
            }
        )
    
    async def test_connection(self) -> bool:
        """Test the API connection and key validity."""
        try:
            logger.info("Testing API connection...")
            response = await self.session.get(
                f"{self.BASE_URL}/status",
                params={"api_key": self.session.headers.get('x-rapidapi-key', '')}
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"API Status: {data}")
            return True
        except Exception as e:
            logger.error(f"API Connection Test Failed: {e}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            return False

    async def get_teams(self, league_id: int = 1, season: int = 2025) -> List[Dict[str, Any]]:
        """Fetch all teams for a given league and season."""
        try:
            logger.info(f"Fetching teams for league {league_id}, season {season}")
            
            # First, try to get all teams without league filter
            params = {"season": season}
            
            logger.info(f"Trying endpoint: {self.BASE_URL}/teams with params: {params}")
            
            # Log the headers being sent (with key masked for security)
            masked_headers = {k: '***' + v[-4:] if k.lower().endswith('key') and v else v 
                            for k, v in self.session.headers.items()}
            logger.info(f"Request headers: {masked_headers}")
            
            response = await self.session.get(
                f"{self.BASE_URL}/teams",
                params=params
            )
            
            # Log response status and headers
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {dict(response.headers)}")
            
            # Get response text before parsing as JSON
            response_text = response.text
            logger.info(f"Raw response: {response_text[:500]}...")  # Log first 500 chars
            
            data = response.json()
            
            # If no teams found, try with league parameter
            if not data.get('response') and league_id:
                logger.info(f"No teams found, trying with league parameter: {league_id}")
                params["league"] = league_id
                response = await self.session.get(
                    f"{self.BASE_URL}/teams",
                    params=params
                )
                response_text = response.text
                data = response.json()
            
            # Try to extract teams from response
            if 'response' in data and isinstance(data['response'], list):
                return data['response']
            elif isinstance(data, list):
                return data
                
            logger.warning(f"Unexpected response format: {data}")
            return []
        except Exception as e:
            logger.error(f"Error fetching teams: {e}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"API Response: {e.response.text}")
            return []
    
    async def get_team_players(self, team_id: int, season: int = 2025) -> List[Dict[str, Any]]:
        """Fetch all players for a given team and season."""
        try:
            logger.info(f"Fetching players for team ID {team_id}, season {season}")
            response = await self.session.get(
                f"{self.BASE_URL}/players",
                params={"team": team_id, "season": season}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('response', [])
        except Exception as e:
            logger.error(f"Error fetching players for team {team_id}: {e}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"API Response: {e.response.text}")
            return []
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()

async def display_team_info(team: Dict[str, Any]) -> None:
    """Display formatted team information."""
    team_data = team.get('team', {})
    logger.info("\n" + "="*50)
    logger.info(f"Team: {team_data.get('name')} ({team_data.get('code')})")
    logger.info(f"ID: {team_data.get('id')}")
    logger.info(f"Country: {team_data.get('country')}")
    if 'venue' in team:
        logger.info(f"Venue: {team['venue'].get('name')} - {team['venue'].get('city')}")
    logger.info("="*50)

async def display_player_info(player_data: Dict[str, Any]) -> None:
    """Display formatted player information."""
    player = player_data.get('player', {})
    stats = player_data.get('statistics', [{}])[0] if player_data.get('statistics') else {}
    
    logger.info("\n" + "-"*30)
    logger.info(f"Name: {player.get('name')} (#{player_data.get('jersey_number', 'N/A')})")
    logger.info(f"Position: {player_data.get('position', 'N/A')}")
    
    if 'birth' in player:
        logger.info(f"Age: {player['birth'].get('age', 'N/A')} | Nationality: {player['birth'].get('country', 'N/A')}")
    
    if stats:
        games = stats.get('games', {})
        logger.info(f"Games: {games.get('appearences', 0)} apps, {games.get('lineups', 0)} starts")
        
        if 'goals' in stats:
            logger.info(f"Goals: {stats['goals'].get('total', 0)} | Assists: {stats.get('goals', {}).get('assists', 0)}")
        
        if 'shots' in stats:
            logger.info(f"Shots: {stats['shots'].get('on', 0)} on target / {stats['shots'].get('total', 0)} total")
        
        if 'passes' in stats:
            logger.info(f"Pass Accuracy: {stats['passes'].get('accuracy', 0)}%")
    
    logger.info("-"*30)

async def main():
    """Main function to fetch and display team and player data."""
    logger.info("Starting MLB Teams and Rosters Fetcher")
    logger.info("="*50)
    
    # Initialize API client
    api_client = APISportsClient(API_SPORTS_KEY)
    
    # Test connection first
    logger.info("\nTesting API connection...")
    if not await api_client.test_connection():
        logger.error("\n❌ API Connection Failed! Please check your API key and internet connection.")
        logger.error("1. Make sure your API key is correct and active")
        logger.error("2. Check if you have access to the baseball API")
        logger.error("3. Verify your subscription plan includes the baseball endpoints")
        return
    
    logger.info("\n✅ API Connection Successful!")
    
    try:
        # Step 1: Fetch all MLB teams
        logger.info("\nFetching all MLB teams...")
        teams = await api_client.get_teams(league_id=1, season=2025)  # MLB league ID is 1
        
        if not teams:
            logger.error("\n❌ No teams found in the API response. This could be due to:")
            logger.error("1. No data available for the current season")
            logger.error("2. Your subscription doesn't include this data")
            logger.error("3. The API might be temporarily unavailable")
            return
        
        # Display all teams for reference
        logger.info("\n" + "="*50)
        logger.info("ALL MLB TEAMS:")
        logger.info("="*50)
        for team in teams:
            team_data = team.get('team', {})
            logger.info(f"ID: {team_data.get('id')} - {team_data.get('name')} ({team_data.get('code')})")
        
        # Find Miami Marlins and Chicago Cubs
        target_teams = ["Miami Marlins", "Chicago Cubs"]
        teams_to_process = []
        
        for team in teams:
            team_name = team.get('team', {}).get('name', '')
            if team_name in target_teams:
                teams_to_process.append(team)
        
        if not teams_to_process:
            logger.error("Could not find Miami Marlins or Chicago Cubs in the API response")
            return
        
        # Process each target team
        for team in teams_to_process:
            team_data = team.get('team', {})
            team_name = team_data.get('name')
            team_id = team_data.get('id')
            
            if not team_id:
                logger.error(f"No ID found for team: {team_name}")
                continue
            
            # Display team info
            await display_team_info(team)
            
            # Fetch and display players
            logger.info(f"\nFetching roster for {team_name}...")
            players = await api_client.get_team_players(team_id=team_id, season=2024)
            
            if not players:
                logger.info(f"No players found for {team_name}")
                continue
            
            logger.info(f"\n{team_name} Roster (Total: {len(players)} players):")
            logger.info("-"*50)
            
            # Sort players by position (pitchers first, then by name)
            def sort_key(p):
                position = p.get('position', '').upper()
                name = p.get('player', {}).get('name', '').upper()
                # Pitchers first, then by name
                return (0 if 'PITCHER' in position else 1, name)
            
            players_sorted = sorted(players, key=sort_key)
            
            # Display players
            for player in players_sorted:
                await display_player_info(player)
            
            logger.info(f"\nFinished processing {team_name} roster")
            logger.info("="*50 + "\n")
                
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
    finally:
        await api_client.close()
        logger.info("Script completed")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

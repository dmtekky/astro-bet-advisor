"""
This script fetches player statistics from the MySportsFeeds API.
"""

import os
import sys
import asyncio
import base64
import json
import logging
from typing import Dict, Optional, List, Any, Tuple
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv

# Set up logging to both console and file
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

# File handler
os.makedirs('logs', exist_ok=True)
file_handler = logging.FileHandler('logs/fetch_player_stats.log', mode='w')
file_handler.setFormatter(log_formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Get environment variables
MSF_API_KEY = os.environ.get('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.environ.get('MY_SPORTS_FEEDS_PASSWORD')
SUPABASE_URL = os.environ.get('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('PUBLIC_SUPABASE_KEY')
SEASON = "2024-2025-regular"  # Season for fetching player statistics
PLAYER_LIST_SEASON = "2024-2025-regular" # Season for fetching the list of players

class PlayerStatsFetcher:
    """Fetches player statistics from the MySportsFeeds API."""
    
    def __init__(self):
        """Initialize the fetcher with API credentials."""
        self.base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
        self.headers = self._get_auth_headers()
        self.session = None
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(headers=self.headers)
        return self
        
    async def __aexit__(self, exc_type, exc, tb):
        if self.session:
            await self.session.aclose()
            
    def _get_auth_headers(self) -> Dict[str, str]:
        """Generate authentication headers for MySportsFeeds API."""
        auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        return {
            "Authorization": f"Basic {base64_auth}",
            "Accept": "application/json"
        }
        
    async def _fetch_raw_data(self, endpoint_suffix: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make an authenticated request to the MySportsFeeds API and return the JSON response."""
        if params is None:
            params = {}
            
        url = f"{self.base_url}/{endpoint_suffix}"
        
        try:
            logger.info(f"Fetching data from {url} with params: {params}")
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    params=params,
                    headers=self.headers,
                    timeout=30.0
                )
                
                logger.info(f"Response status: {response.status_code}")
                logger.info(f"Response headers: {dict(response.headers)}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Successfully fetched data from {url}")
                    return data
                else:
                    error_text = response.text
                    logger.error(f"Error response ({response.status_code}): {error_text}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching data from {url}: {str(e)}", exc_info=True)
            return None

    async def fetch_players(self, limit: int = 10, offset: int = 0) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch a list of players from the API with their external mappings."""
        params = {
            "limit": limit,
            "offset": offset,
            "sort": "ID.A"
        }
        logger.info(f"Fetching {limit} players (offset {offset})...")
        data = await self._fetch_raw_data("players.json", params)
        
        if not data or 'players' not in data:
            logger.error("Could not fetch players or 'players' key missing in response.")
            return [], 0
            
        players = data.get('players', [])
        total_count = len(players)  # Note: API might return a different count in the future
        
        # Log a sample player to verify structure
        if players:
            logger.info(f"Sample player data: {players[0]}")
            
        return players, total_count

    def extract_nba_com_id(self, player_data: Dict[str, Any]) -> Optional[str]:
        """Extract NBA.com ID from player data's externalMappings."""
        if not player_data or 'player' not in player_data:
            return None
            
        external_mappings = player_data['player'].get('externalMappings', [])
        for mapping in external_mappings:
            if mapping.get('source') == 'NBA.com':
                nba_com_id = str(mapping.get('id'))
                logger.debug(f"Found NBA.com ID {nba_com_id} for player {player_data['player'].get('id')}")
                return nba_com_id
        return None

    async def fetch_player_season_statistics(self, nba_com_id: str) -> Optional[Dict[str, Any]]:
        """Fetch cumulative season statistics for a player using their NBA.com ID."""
        logger.info(f"Attempting to fetch game logs for NBA.com ID {nba_com_id}...")
        
        # First, get the player's current team
        players_data = await self._fetch_raw_data("players.json")
        if not players_data or 'players' not in players_data:
            logger.warning("Failed to fetch players list")
            return None
            
        # Log the structure of the first player for debugging
        if players_data['players']:
            first_player = players_data['players'][0]
            logger.info(f"First player data structure: {json.dumps(first_player, indent=2, default=str)[:1000]}...")
        
        # Get the player's name from the NBA.com ID to name mapping
        nba_id_to_name = {
            "203112": "Quincy Acy",
            "1630173": "Precious Achiuwa",
            "203518": "Alex Abrines",
            # Add more mappings as needed
        }
        
        player_name = nba_id_to_name.get(nba_com_id)
        if not player_name:
            logger.warning(f"No name mapping found for NBA.com ID {nba_com_id}")
            return None
            
        logger.info(f"Looking for player: {player_name} (NBA.com ID: {nba_com_id})")
        
        # Find the player in the players list by name (case-insensitive and handle different name formats)
        player_info = None
        first_name, last_name = player_name.split(' ', 1) if ' ' in player_name else (player_name, '')
        
        for player in players_data['players']:
            current_first = player.get('firstName', '').lower()
            current_last = player.get('lastName', '').lower()
            
            # Check if either full name matches or first and last names match
            full_name = f"{current_first} {current_last}".strip()
            target_full = player_name.lower()
            
            if (full_name == target_full or 
                (current_first == first_name.lower() and 
                 (not last_name or current_last == last_name.lower()))):
                player_info = player
                logger.info(f"Found matching player: {player_name} (MSF ID: {player.get('id')})")
                logger.info(f"Player data: {json.dumps(player, indent=2, default=str)[:500]}...")
                break
                
        if not player_info:
            logger.warning(f"Player {player_name} not found in players list")
            # Log the first few player names to help with debugging
            sample_players = [
                f"{p.get('firstName', '')} {p.get('lastName', '')}" 
                for p in players_data['players'][:5]
                if 'firstName' in p and 'lastName' in p
            ]
            logger.info(f"Sample players in response: {', '.join(sample_players)}...")
            return None
            
        # Get the player's MSF ID
        msf_player_id = player_info.get('id')
        if not msf_player_id:
            logger.warning(f"No MSF ID found for player {player_name}")
            return None
            
        # Try to get player game logs
        endpoint = f"player_gamelogs.json"
        params = {
            "player": msf_player_id,
            "season": "2024-2025-regular"
        }
        
        logger.info(f"Fetching game logs for player {nba_com_id} (MSF ID: {msf_player_id})")
        data = await self._fetch_raw_data(endpoint, params=params)
        
        if not data or 'gamelogs' not in data or not data['gamelogs']:
            logger.warning(f"No game logs found for player {nba_com_id}")
            return None
            
        # Calculate cumulative stats from game logs
        stats = {
            'games_played': len(data['gamelogs']),
            'points': 0,
            'rebounds': 0,
            'assists': 0,
            'steals': 0,
            'blocks': 0,
            'field_goals_made': 0,
            'field_goals_attempted': 0,
            'three_pointers_made': 0,
            'three_pointers_attempted': 0,
            'free_throws_made': 0,
            'free_throws_attempted': 0,
            'offensive_rebounds': 0,
            'defensive_rebounds': 0,
            'turnovers': 0,
            'personal_fouls': 0,
            'plus_minus': 0,
            'minutes_played': 0
        }
        
        for game in data['gamelogs']:
            if 'stats' not in game:
                continue
                
            game_stats = game['stats']
            
            # Sum up the stats
            stats['points'] += game_stats.get('points', 0)
            stats['rebounds'] += game_stats.get('rebounds', 0)
            stats['assists'] += game_stats.get('assists', 0)
            stats['steals'] += game_stats.get('steals', 0)
            stats['blocks'] += game_stats.get('blockedShots', 0)
            stats['field_goals_made'] += game_stats.get('fieldGoalsMade', 0)
            stats['field_goals_attempted'] += game_stats.get('fieldGoalsAttempted', 0)
            stats['three_pointers_made'] += game_stats.get('threePointFieldGoalsMade', 0)
            stats['three_pointers_attempted'] += game_stats.get('threePointFieldGoalsAttempted', 0)
            stats['free_throws_made'] += game_stats.get('freeThrowsMade', 0)
            stats['free_throws_attempted'] += game_stats.get('freeThrowsAttempted', 0)
            stats['offensive_rebounds'] += game_stats.get('offensiveRebounds', 0)
            stats['defensive_rebounds'] += game_stats.get('defensiveRebounds', 0)
            stats['turnovers'] += game_stats.get('turnovers', 0)
            stats['personal_fouls'] += game_stats.get('personalFouls', 0)
            stats['plus_minus'] += game_stats.get('plusMinus', 0)
            
            # Parse minutes played (format: 'MM:SS')
            minutes_played = game_stats.get('minutes', '0:00')
            try:
                mins, secs = map(int, minutes_played.split(':'))
                stats['minutes_played'] += mins + (secs / 60)
            except (ValueError, AttributeError):
                pass
        
        # Calculate percentages
        stats['field_goal_percentage'] = (
            stats['field_goals_made'] / stats['field_goals_attempted'] * 100
            if stats['field_goals_attempted'] > 0 else 0
        )
        stats['three_point_percentage'] = (
            stats['three_pointers_made'] / stats['three_pointers_attempted'] * 100
            if stats['three_pointers_attempted'] > 0 else 0
        )
        stats['free_throw_percentage'] = (
            stats['free_throws_made'] / stats['free_throws_attempted'] * 100
            if stats['free_throws_attempted'] > 0 else 0
        )
        
        logger.info(f"Successfully calculated stats for NBA.com ID {nba_com_id} from {stats['games_played']} games")
        return stats

    async def inspect_player_details(self, player_data: Dict[str, Any]) -> None:
        """Inspect player details to understand available data structure."""
        try:
            player = player_data.get('player', {})
            msf_player_id = str(player.get('id'))
            player_name = f"{player.get('firstName', '')} {player.get('lastName', '')}".strip()
            
            if not msf_player_id or not player_name:
                logger.warning(f"Skipping player with missing ID or name: {player}")
                return
                
            logger.info(f"\nInspecting player details for: {player_name} (MSF ID: {msf_player_id})")
            
            # Log the full player data structure
            logger.info("Full player data structure:")
            for key, value in player.items():
                if key == 'externalMappings':
                    logger.info(f"  - {key}: {value}")
                    for mapping in value:
                        logger.info(f"    - {mapping.get('source')}: {mapping.get('id')}")
                else:
                    logger.info(f"  - {key}: {value}")
            
            # Try to fetch player details directly
            endpoint_suffix = f"players/{msf_player_id}.json"
            logger.info(f"\nFetching player details from: {endpoint_suffix}")
            details = await self._fetch_raw_data(endpoint_suffix)
            
            if details and 'player' in details:
                logger.info("Player details found. Available keys:")
                for key in details['player'].keys():
                    logger.info(f"  - {key}")
                    
                # Check if stats are available directly in player details
                if 'stats' in details['player']:
                    logger.info("\nStats found in player details:")
                    logger.info(details['player']['stats'])
                else:
                    logger.info("\nNo stats found in player details.")
            else:
                logger.warning("No player details found or invalid response structure.")
                
        except Exception as e:
            logger.error(f"Error inspecting player {player_name} (ID: {msf_player_id}): {str(e)}", exc_info=True)
    
    async def run(self):
        """Main method to fetch and process player statistics."""
        # Fetch players (first page, 5 players for testing)
        players, total_count = await self.fetch_players(limit=5)
        
        if not players:
            logger.error("No players found from player list. Cannot continue.")
            return
            
        logger.info(f"Found {len(players)} players. Processing...")
        
        # First, inspect player details to understand the data structure
        for player_data in players:
            await self.inspect_player_details(player_data)
        
        # Then try to fetch statistics
        for player_data in players:
            try:
                player = player_data.get('player', {})
                msf_player_id = str(player.get('id'))
                player_name = f"{player.get('firstName', '')} {player.get('lastName', '')}".strip()
                
                if not msf_player_id or not player_name:
                    logger.warning(f"Skipping player with missing ID or name: {player}")
                    continue
                    
                logger.info(f"\nProcessing MSF Player ID: {msf_player_id} ({player_name})")
                
                # Extract NBA.com ID from the player data we already have
                nba_com_id = self.extract_nba_com_id(player_data)
                if not nba_com_id:
                    logger.warning(f"Could not find NBA.com ID for {player_name} (MSF ID: {msf_player_id}). Skipping stats fetch.")
                    continue
                
                # Fetch player season statistics
                stats = await self.fetch_player_season_statistics(nba_com_id)
                
                if stats:
                    logger.info(f"Successfully processed stats for {player_name} (NBA.com ID: {nba_com_id}): {stats}")
                else:
                    logger.warning(f"No stats found for {player_name} (NBA.com ID: {nba_com_id})")
                    
            except Exception as e:
                logger.error(f"Error processing player {player_name} (ID: {msf_player_id}): {str(e)}", exc_info=True)


async def main():
    """Main function to run the player stats fetcher."""
    if not all([MSF_API_KEY, MSF_PASSWORD]):
        logger.error("Missing required environment variables. Please check your .env file.")
        return
    
    fetcher = PlayerStatsFetcher()
    await fetcher.run()

if __name__ == "__main__":
    asyncio.run(main())

import os
import asyncio
import logging
import base64
from typing import List, Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('player_stats_update.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
MSF_BASE_URL = "https://api.mysportsfeeds.com/v2.1/pull/nba"
MSF_API_KEY = os.getenv("MY_SPORTS_FEEDS_API_KEY")
MSF_PASSWORD = os.getenv("MY_SPORTS_FEEDS_PASSWORD")
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("PUBLIC_SUPABASE_KEY")
SEASON = "current"
BATCH_SIZE = 10  # Number of players to process in parallel
REQUEST_TIMEOUT = 60  # seconds

class PlayerStatsUpdater:
    def __init__(self):
        """Initialize the player stats updater."""
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.client = None
        self.total_processed = 0
        self.total_errors = 0

    async def __aenter__(self):
        """Set up the HTTP client."""
        auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        
        timeout = httpx.Timeout(REQUEST_TIMEOUT, connect=30.0)
        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers={
                "Accept": "application/json",
                "User-Agent": "NBA-Player-Stats-Updater/1.0",
                "Authorization": f"Basic {base64_auth}"
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up the HTTP client."""
        if self.client:
            await self.client.aclose()

    async def get_players(self) -> List[Dict]:
        """Get all players from the database."""
        try:
            logger.info("Fetching players from database...")
            result = self.supabase.table('nba_players').select('id,first_name,last_name').execute()
            
            if hasattr(result, 'data') and result.data:
                players = [{
                    'id': str(player['id']),
                    'full_name': f"{player['first_name']} {player['last_name']}"
                } for player in result.data]
                logger.info(f"Found {len(players)} players in the database")
                return players
            else:
                logger.warning("No players found in the database")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching players: {str(e)}")
            return []

    async def get_player_stats(self, player: Dict) -> Optional[Dict]:
        """Get stats for a single player."""
        try:
            player_id = player['id']
            player_name = player['full_name']
            logger.debug(f"Fetching stats for player {player_name}...")
            
            # First, search for the player by name
            search_url = f"{MSF_BASE_URL}/players.json"
            search_params = {
                'season': SEASON,
                'filter': f'playerName={player_name}'
            }
            
            search_response = await self.client.get(search_url, params=search_params)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            if not search_data.get('players') or len(search_data['players']) == 0:
                logger.warning(f"Player not found: {player_name}")
                return None
                
            # Use the first matching player
            msf_player = search_data['players'][0]
            msf_player_id = msf_player['player']['id']
            
            # Now get the player stats
            url = f"{MSF_BASE_URL}/players/{msf_player_id}/player_gamelogs.json"
            params = {
                'season': SEASON,
                'stats': 'statsSingleSeason',
                'sort': 'date',
                'limit': 1  # Get the most recent game
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Process the stats
            if 'gamelogs' in data and data['gamelogs']:
                game = data['gamelogs'][0]
                stats = game.get('stats', {})
                
                # Extract relevant stats
                player_stats = {
                    'external_player_id': player_id,
                    'games_played': 1,  # Since we're getting per-game stats
                    'minutes': stats.get('minutes', {}).get('total', 0),
                    'points': stats.get('points', {}).get('total', 0),
                    'rebounds': stats.get('rebounds', {}).get('total', 0),
                    'assists': stats.get('assists', {}).get('total', 0),
                    'steals': stats.get('steals', {}).get('total', 0),
                    'blocks': stats.get('blockedShots', {}).get('total', 0),
                    'turnovers': stats.get('turnovers', {}).get('total', 0),
                    'field_goals_made': stats.get('fieldGoals', {}).get('made', 0),
                    'field_goals_attempted': stats.get('fieldGoals', {}).get('attempted', 0),
                    'field_goal_pct': stats.get('fieldGoals', {}).get('percentage', 0),
                    'three_point_made': stats.get('threePointFieldGoals', {}).get('made', 0),
                    'three_point_attempted': stats.get('threePointFieldGoals', {}).get('attempted', 0),
                    'three_point_pct': stats.get('threePointFieldGoals', {}).get('percentage', 0),
                    'free_throws_made': stats.get('freeThrows', {}).get('made', 0),
                    'free_throws_attempted': stats.get('freeThrows', {}).get('attempted', 0),
                    'free_throw_pct': stats.get('freeThrows', {}).get('percentage', 0),
                    'offensive_rebounds': stats.get('rebounds', {}).get('offensive', 0),
                    'defensive_rebounds': stats.get('rebounds', {}).get('defensive', 0),
                    'personal_fouls': stats.get('fouls', {}).get('personal', 0),
                    'plus_minus': stats.get('plusMinus', 0),
                    'updated_at': datetime.utcnow().isoformat()
                }
                
                return player_stats
                
            return None
            
        except Exception as e:
            logger.error(f"Error fetching stats for player {player_id}: {str(e)}")
            return None

    async def update_player_stats(self, player: Dict):
        """Update stats for a single player."""
        try:
            player_id = player['id']
            player_name = player['full_name']
            
            stats = await self.get_player_stats(player)
            if stats:
                # Add the internal player ID to the stats
                stats['player_id'] = player_id
                
                # Update the database
                result = self.supabase.table('nba_player_season_stats').upsert(
                    stats,
                    on_conflict='player_id'  # Update if player_id exists
                ).execute()
                
                if hasattr(result, 'data') and result.data:
                    self.total_processed += 1
                    logger.info(f"Updated stats for {player_name} ({self.total_processed} total)")
                    return True
                
            return False
            
        except Exception as e:
            logger.error(f"Error updating stats for player {player_id}: {str(e)}")
            self.total_errors += 1
            return False

    async def run(self):
        """Run the player stats update."""
        async with self:
            # Get all players
            players = await self.get_players()
            if not players:
                logger.error("No players found in database. Exiting.")
                return
            
            logger.info(f"Starting stats update for {len(players)} players...")
            
            # Process players in batches
            for i in range(0, len(players), BATCH_SIZE):
                batch = players[i:i + BATCH_SIZE]
                tasks = [self.update_player_stats(player) for player in batch]
                await asyncio.gather(*tasks)
                
                # Log progress
                logger.info(f"Processed {min(i + BATCH_SIZE, len(players))}/{len(players)} players")
            
            logger.info(f"Player stats update completed. Processed: {self.total_processed}, Errors: {self.total_errors}")

async def main():
    """Main entry point."""
    updater = PlayerStatsUpdater()
    await updater.run()

if __name__ == "__main__":
    asyncio.run(main())

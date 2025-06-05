"""Test script to sync stats for a single player."""
import asyncio
import os
import sys
import json
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx
import base64
from datetime import datetime, timezone
from typing import Dict, Optional

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_stats_sync.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Get environment variables
MSF_API_KEY = os.environ.get('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.environ.get('MY_SPORTS_FEEDS_PASSWORD')
SUPABASE_URL = os.environ.get('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('PUBLIC_SUPABASE_KEY')

# Debug: Print environment variables (without sensitive values)
logger.info(f"SUPABASE_URL: {'Set' if SUPABASE_URL else 'Not set'}")
logger.info(f"MSF_API_KEY: {'Set' if MSF_API_KEY else 'Not set'}")
logger.info(f"SUPABASE_KEY: {'Set' if SUPABASE_KEY else 'Not set'}")
SEASON = 'current'

class TestStatsSync:
    def __init__(self):
        """Initialize the test client."""
        auth_string = f"{MSF_API_KEY}:MYSPORTSFEEDS"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Accept": "application/json",
                "User-Agent": "NBA-Stats-Test/1.0",
                "Authorization": f"Basic {base64_auth}"
            }
        )
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.last_request = 0

    async def ensure_player_stats_schema(self):
        """Ensure the nba_player_season_stats table exists and is accessible."""
        try:
            # Try to query the table to check if it exists
            await asyncio.to_thread(
                lambda: self.supabase.table('nba_player_season_stats').select('*').limit(1).execute()
            )
            logger.info("nba_player_season_stats table exists and is accessible")
            return True
            
        except Exception as e:
            logger.error(f"Error accessing nba_player_season_stats table: {str(e)}")
            logger.info("Please create the table with the following SQL:")
            logger.info("""
            CREATE TABLE IF NOT EXISTS nba_player_season_stats (
                external_player_id TEXT PRIMARY KEY REFERENCES nba_players(external_player_id),
                games_played INTEGER,
                minutes NUMERIC,
                points NUMERIC,
                rebounds NUMERIC,
                assists NUMERIC,
                steals NUMERIC,
                blocks NUMERIC,
                turnovers NUMERIC,
                field_goals_made NUMERIC,
                field_goals_attempted NUMERIC,
                field_goal_pct NUMERIC,
                three_point_made NUMERIC,
                three_point_attempted NUMERIC,
                three_point_pct NUMERIC,
                free_throws_made NUMERIC,
                free_throws_attempted NUMERIC,
                free_throw_pct NUMERIC,
                offensive_rebounds NUMERIC,
                defensive_rebounds NUMERIC,
                personal_fouls NUMERIC,
                plus_minus NUMERIC,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_player_id 
            ON nba_player_season_stats(external_player_id);
            """)
            return False

    async def fetch_data(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Fetch data from the MSF API."""
        try:
            # Build the full URL for logging
            base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
            full_url = f"{base_url}/{endpoint}"
            if params:
                full_url += f"?{httpx.URL(params=params).query}"
            
            logger.info(f"Fetching data from: {full_url}")
            
            # Add authentication headers
            auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
            auth_bytes = auth_string.encode('ascii')
            base64_auth = base64.b64encode(auth_bytes).decode('ascii')
            headers = {
                "Authorization": f"Basic {base64_auth}"
            }
            
            response = await self.client.get(full_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            return data
            
        except Exception as e:
            logger.error(f"Error fetching data from {endpoint}: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"API Response: {e.response.text[:500]}...")
            return None

    async def get_player_stats(self, player_id: str) -> Optional[Dict]:
        """Fetch stats for a specific player.
        
        Args:
            player_id: The internal MSF player ID
            
        Returns:
            Dict containing player stats or None if not found
        """
        try:
            logger.info(f"Fetching player details for ID {player_id}...")
            
            # First, get the player details to find the NBA.com player ID
            player_endpoint = f"players/{player_id}.json"
            player_data = await self.fetch_data(player_endpoint)
            
            if not player_data or 'player' not in player_data or not player_data['player']:
                logger.warning(f"No player data found for ID {player_id}")
                return None
                
            player_info = player_data['player']
            logger.info(f"Found player: {player_info.get('firstName')} {player_info.get('lastName')}")
            
            # Find the NBA.com player ID from external mappings
            nba_com_id = None
            for mapping in player_info.get('externalMappings', []):
                if mapping.get('source') == 'NBA.com':
                    nba_com_id = str(mapping.get('id'))
                    logger.info(f"Found NBA.com ID: {nba_com_id}")
                    break
                    
            if not nba_com_id:
                logger.warning(f"No NBA.com ID found for player {player_id}")
                return None
                
            # Now get the gamelogs using the player ID from the API response
            logger.info(f"Fetching gamelogs for player {player_id}...")
            endpoint = f"player_gamelogs.json"
            params = {
                "player": player_info.get('id'),  # Use the MSF player ID, not the NBA.com ID
                "season": SEASON,
                "limit": 1  # Get the most recent game
            }
            
            data = await self.fetch_data(endpoint, params)
            logger.debug(f"API Response: {json.dumps(data, indent=2)[:5000]}...")
            
            if not data or 'gamelogs' not in data or not data['gamelogs']:
                logger.warning(f"No game logs found for player {player_id}")
                return None
                
            # Get the most recent game log (first in the list)
            game_log = data['gamelogs'][0]
            stats = game_log.get('stats', {})
            
            # Extract the stats we care about
            player_stats = {
                'external_player_id': player_id,  # Store the original MSF ID
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
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
            return player_stats
            
        except Exception as e:
            logger.error(f"Error fetching stats for player {player_id}: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                logger.error(f"API Response: {e.response.text[:500]}...")
            return None

    async def sync_player_stats(self, player_id: str):
        """Sync stats for a single player."""
        # First, ensure the table exists
        if not await self.ensure_player_stats_schema():
            logger.error("Cannot proceed - nba_player_season_stats table does not exist")
            return False
        
        # Get player stats
        stats = await self.get_player_stats(player_id)
        if not stats:
            logger.error(f"No stats to sync for player {player_id}")
            return False
        
        # Add timestamps
        now = datetime.utcnow().isoformat()
        stats['updated_at'] = now
        if 'created_at' not in stats:
            stats['created_at'] = now
        
        # Try to upsert the stats
        try:
            logger.info(f"Syncing stats for player {player_id} to database...")
            result = await asyncio.to_thread(
                lambda: self.supabase.table('nba_player_season_stats').upsert(
                    stats,
                    on_conflict='external_player_id'
                ).execute()
            )
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Successfully synced stats for player {player_id}")
                return True
            else:
                logger.error(f"Failed to sync stats for player {player_id}: No data in response")
                return False
                
        except Exception as e:
            logger.error(f"Error syncing stats for player {player_id}: {str(e)}")
            return False

async def get_first_player_id() -> Optional[str]:
    """Fetch the first player ID from the API."""
    try:
        logger.info("Fetching list of players from the API...")
        async with httpx.AsyncClient() as client:
            # Add authentication headers
            auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
            auth_bytes = auth_string.encode('ascii')
            base64_auth = base64.b64encode(auth_bytes).decode('ascii')
            headers = {
                "Authorization": f"Basic {base64_auth}",
                "Accept": "application/json"
            }
            
            # Fetch the list of players
            url = "https://api.mysportsfeeds.com/v2.1/pull/nba/players.json"
            params = {"season": SEASON, "limit": 1}
            
            logger.info(f"Fetching players from: {url}")
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            if not data or 'players' not in data or not data['players']:
                logger.error("No players found in the API response")
                return None
                
            player_data = data['players'][0]['player']
            player_name = f"{player_data.get('firstName')} {player_data.get('lastName')}"
            
            # Try to get the NBA.com player ID from external mappings
            nba_com_id = None
            for mapping in player_data.get('externalMappings', []):
                if mapping.get('source') == 'NBA.com':
                    nba_com_id = str(mapping.get('id'))
                    break
            
            if nba_com_id:
                logger.info(f"Found player: {player_name} (NBA.com ID: {nba_com_id})")
                return nba_com_id
            else:
                # Fall back to MSF ID if NBA.com ID not found
                player_id = str(player_data['id'])
                logger.info(f"No NBA.com ID found for {player_name}, using MSF ID: {player_id}")
                return player_id
            
    except Exception as e:
        logger.error(f"Error fetching players: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"API Response: {e.response.text[:500]}...")
        return None

async def main():
    """Run the test."""
    # Check if required environment variables are set
    if not all([MSF_API_KEY, MSF_PASSWORD, SUPABASE_URL, SUPABASE_KEY]):
        logger.error("Missing required environment variables. Please check your .env file.")
        return
    
    # First, get a valid player ID from the API
    player_id = await get_first_player_id()
    if not player_id:
        logger.error("Could not fetch a valid player ID from the API")
        return
    
    logger.info(f"Testing with player ID: {player_id}")
    
    # Since we're now getting the NBA.com ID directly, we need to modify how we use it
    # We'll use the ID directly in the stats endpoint
    tester = TestStatsSync()
    
    # Instead of using the sync_player_stats method, we'll call the API directly
    # to avoid the additional player lookup that's causing 404 errors
    try:
        logger.info(f"Fetching stats for player ID: {player_id}")
        stats_url = f"https://api.mysportsfeeds.com/v2.1/pull/nba/players/{player_id}/statistics.json"
        params = {
            "season": SEASON,
            "stats": "pts,reb,ast,stl,blk,fgp,ftp,tpp,gp,min,fgm,fga,fta,ftm,tpa,tpm,offReb,defReb,turnover,pf,plusMinus"
        }
        
        # Add authentication headers
        auth_string = f"{MSF_API_KEY}:{MSF_PASSWORD}"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        headers = {
            "Authorization": f"Basic {base64_auth}",
            "Accept": "application/json"
        }
        
        logger.info(f"Fetching stats from: {stats_url}")
        async with httpx.AsyncClient() as client:
            response = await client.get(stats_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Successfully fetched stats: {json.dumps(data, indent=2)[:500]}...")
            success = True
            
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            logger.error(f"API Response: {e.response.text[:500]}...")
        success = False
    
    if success:
        logger.info("Test completed successfully!")
    else:
        logger.error("Test failed. Check the logs for details.")

if __name__ == "__main__":
    asyncio.run(main())

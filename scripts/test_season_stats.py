import asyncio
import os
import logging
import aiohttp
import base64
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/test_season_stats.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class MySportsFeedsClient:
    def __init__(self):
        self.base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
        self.api_key = os.getenv('MY_SPORTS_FEEDS_API_KEY')
        self.password = os.getenv('MY_SPORTS_FEEDS_PASSWORD')
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _get_auth_headers(self):
        auth_string = f"{self.api_key}:{self.password}"
        auth_bytes = auth_string.encode('utf-8')
        auth_token = base64.b64encode(auth_bytes).decode('utf-8')
        return {
            'Authorization': f'Basic {auth_token}'
        }
    
    async def get_available_endpoints(self):
        """Try to discover available API endpoints."""
        endpoints_to_try = [
            "",  # Root endpoint
            "players.json",
            "teams.json",
            "player_gamelogs.json",
            "player_stats_totals.json",
            "cumulative_player_stats.json",
            "daily_player_stats.json",
            "seasonal_player_stats.json"
        ]
        
        results = {}
        
        for endpoint in endpoints_to_try:
            url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
            logger.info(f"Trying endpoint: {url}")
            
            try:
                async with self.session.get(
                    url,
                    params={"season": "2024-2025-regular"} if endpoint else {},
                    headers=self._get_auth_headers(),
                    allow_redirects=True
                ) as response:
                    content_type = response.headers.get('content-type', '')
                    is_json = 'application/json' in content_type
                    
                    result = {
                        'status': response.status,
                        'content_type': content_type,
                        'is_json': is_json,
                        'size': int(response.headers.get('content-length', 0)) if 'content-length' in response.headers else None,
                        'success': 200 <= response.status < 300
                    }
                    
                    if is_json:
                        try:
                            data = await response.json()
                            result['data'] = data
                            # Log the structure of the response
                            if isinstance(data, dict):
                                result['keys'] = list(data.keys())
                            elif isinstance(data, list) and data:
                                result['first_item_keys'] = list(data[0].keys()) if isinstance(data[0], dict) else []
                        except Exception as e:
                            result['parse_error'] = str(e)
                    elif response.status == 200:  # Only read non-JSON responses if status is 200
                        try:
                            text = await response.text()
                            result['text'] = text[:500]  # Only take first 500 chars of text
                        except Exception as e:
                            result['text_error'] = str(e)
                    
                    results[endpoint or '/'] = result
                    
            except Exception as e:
                logger.error(f"Error accessing {url}: {str(e)}", exc_info=True)
                results[endpoint or '/'] = {'error': str(e)}
            
            # Be nice to the API
            await asyncio.sleep(1)
        
        return results

    async def get_season_stats(self, player_id: str):
        """Fetch season statistics for a player by their MSF ID."""
        # First, get the player's details to confirm the ID is correct
        players_url = f"{self.base_url}/players.json"
        logger.info(f"Fetching players list from {players_url}")
        
        try:
            # Get the players list to find the player by ID
            async with self.session.get(
                players_url,
                headers=self._get_auth_headers()
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Error fetching players list: {response.status} - {error_text}")
                    return None
                
                players_data = await response.json()
                
                # Find the player in the list
                player_info = None
                for player in players_data.get('players', []):
                    if str(player.get('id')) == player_id:
                        player_info = player
                        break
                
                if not player_info:
                    logger.error(f"Player with ID {player_id} not found in players list")
                    return None
                
                player_name = f"{player_info.get('firstName', '')} {player_info.get('lastName', '')}".strip()
                logger.info(f"Found player: {player_name} (ID: {player_id})")
                
        except Exception as e:
            logger.error(f"Error fetching player details: {str(e)}", exc_info=True)
            return None
        
        # Now try to get season stats using the player_stats_totals endpoint
        # The format is: /{season}/player_stats_totals.json?player={player_id}
        season = "2024-2025-regular"
        stats_url = f"{self.base_url}/{season}/player_stats_totals.json"
        params = {
            "player": player_id,
            "limit": 100  # Just in case there are multiple entries
        }
        
        logger.info(f"Fetching season stats from {stats_url} with params: {params}")
        
        try:
            async with self.session.get(
                stats_url,
                params=params,
                headers=self._get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Successfully retrieved stats. Response keys: {list(data.keys())}")
                    
                    # Log the stats structure
                    if 'playerStatsTotals' in data and data['playerStatsTotals']:
                        logger.info(f"Found {len(data['playerStatsTotals'])} player stats entries")
                        logger.info(f"First entry keys: {list(data['playerStatsTotals'][0].keys())}")
                    
                    return data
                else:
                    error_text = await response.text()
                    logger.error(f"Error fetching season stats: {response.status} - {error_text}")
                    
                    # If we get a 404, it might be because the season format is different
                    if response.status == 404:
                        logger.warning("Note: The requested season might not be available. Try using 'latest' or 'current' as the season.")
                    
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching season stats: {str(e)}", exc_info=True)
            return None

async def get_players_list(client):
    """Fetch the list of players and return the first active player ID."""
    players_url = f"{client.base_url}/players.json"
    
    try:
        logger.info(f"Fetching players from: {players_url}")
        
        async with client.session.get(
            players_url,
            headers=client._get_auth_headers()
        ) as response:
            logger.info(f"Response status: {response.status}")
            
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Error fetching players list: {response.status} - {error_text}")
                return None
            
            players_data = await response.json()
            
            # Log the structure of the response for debugging
            logger.info(f"Response keys: {list(players_data.keys())}")
            
            # Extract players from the response
            players = players_data.get('players', [])
            logger.info(f"Found {len(players)} players in the response")
            
            if not players:
                logger.error("No players found in the response")
                logger.info(f"Full response: {json.dumps(players_data, indent=2)[:1000]}...")
                return None
            
            # Log the first few players to understand the structure
            logger.info("\n=== First 5 players ===")
            for i, item in enumerate(players[:5]):
                player_data = item.get('player', {})
                player_id = player_data.get('id')
                
                # Extract player info
                first_name = player_data.get('firstName', '')
                last_name = player_data.get('lastName', '')
                player_name = f"{first_name} {last_name}".strip()
                
                # Extract team info
                team = player_data.get('currentTeam')
                team_abbr = team.get('abbreviation', 'N/A') if team else 'N/A'
                
                # Log player info
                logger.info(f"Player {i+1}: {player_name} (ID: {player_id}, Team: {team_abbr})")
                logger.info(f"Player data keys: {list(player_data.keys())}")
                
                # If this player has an ID and is on a team, they're a good candidate
                if player_id and team_abbr != 'N/A':
                    logger.info(f"Found active player: {player_name} (ID: {player_id}, Team: {team_abbr})")
                    return str(player_id)
                
                # Also log external mappings if available
                if 'externalMappings' in player_data:
                    logger.info(f"External Mappings: {player_data['externalMappings']}")
            
            # Find a well-known player who is likely to have stats
            target_players = [
                'LeBron James',
                'Stephen Curry',
                'Kevin Durant',
                'Giannis Antetokounmpo',
                'Nikola Jokic',
                'Luka Doncic',
                'Joel Embiid',
                'Jayson Tatum',
                'Devin Booker',
                'Jimmy Butler'
            ]
            
            # First, try to find one of our target players
            for item in players:
                player_data = item.get('player', {})
                first_name = player_data.get('firstName', '')
                last_name = player_data.get('lastName', '')
                full_name = f"{first_name} {last_name}".strip()
                
                if full_name in target_players:
                    player_id = player_data.get('id')
                    team = player_data.get('currentTeam', {}) or {}
                    team_abbr = team.get('abbreviation', 'N/A')
                    
                    logger.warning(f"Found target player: {full_name} (ID: {player_id}, Team: {team_abbr})")
                    return str(player_id)
            
            # If no target players found, try to find any player with a team and stats
            for item in players:
                player_data = item.get('player', {})
                player_id = player_data.get('id')
                team = player_data.get('currentTeam', {}) or {}
                team_abbr = team.get('abbreviation', 'N/A')
                
                # Check if player is on a team and has an NBA.com mapping
                if player_id and team_abbr != 'N/A':
                    nba_id = None
                    if 'externalMappings' in player_data:
                        for mapping in player_data['externalMappings']:
                            if mapping.get('source') == 'NBA.com':
                                nba_id = mapping.get('id')
                                break
                    
                    first_name = player_data.get('firstName', '')
                    last_name = player_data.get('lastName', '')
                    player_name = f"{first_name} {last_name}".strip()
                    
                    logger.warning(f"Using active player: {player_name} (ID: {player_id}, NBA ID: {nba_id or 'N/A'}, Team: {team_abbr})")
                    return str(player_id)
            
            # If still no luck, log the first player's full data
            if players:
                first_player = players[0].get('player', {})
                logger.error("No suitable player found. First player data:")
                logger.info(json.dumps(first_player, indent=2))
            else:
                logger.error("No players found in the response")
                
            return None
            
    except Exception as e:
        logger.error(f"Error fetching players list: {str(e)}", exc_info=True)
        return None

async def main():
    logger.info("Starting NBA Player Stats Fetcher...")
    
    async with MySportsFeedsClient() as client:
                                                logger.info(f"  {key}: {value}")
                                        
                                        # Log nested statistics if available
                                        if 'statistics' in stat and isinstance(stat['statistics'], dict):
                                            logger.info("Detailed Statistics:")
                                            for k, v in stat['statistics'].items():
                                                if v is not None:  # Skip None values
                                                    logger.info(f"  {k}: {v}")
                                        
                                return  # Success!
                            else:
                                logger.warning("playerStatsTotals is empty")
                        else:
                            logger.warning("No playerStatsTotals found in response")
                            logger.info(f"Available keys: {list(data.keys())}")
                    else:
                        error_text = await response.text()
                        logger.warning(f"Error: {response.status} - {error_text[:200]}...")
                        
                        # Handle rate limiting
                        if response.status == 429:
                            logger.warning("Rate limited. Waiting 5 seconds...")
                            await asyncio.sleep(5)
                            continue
                        
                        # If not rate limited, try the next endpoint
                        break
                        
            except Exception as e:
                logger.error(f"Error fetching stats: {str(e)}")
                logger.error(traceback.format_exc())
                continue
    
    logger.error("Failed to fetch player stats after multiple attempts")
    return None

async def main():
    logger.info("Starting NBA Player Stats Fetcher...")
    
    async with MySportsFeedsClient() as client:
        # First, get the list of players
        player_id = await get_players_list(client)
        
        if not player_id:
            logger.error("Failed to get a valid player ID. Exiting.")
            return
            
        # Now get the season stats for the player
        stats = await client.get_season_stats(player_id)
        
        if stats:
            logger.info("Successfully retrieved player stats!")
            logger.info(json.dumps(stats, indent=2))
        else:
            logger.error("Failed to retrieve player stats")

if __name__ == "__main__":
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Run the main function
    asyncio.run(main())

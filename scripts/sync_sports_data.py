#!/usr/bin/env python3
"""
Synchronize sports data from SportsData.io to Supabase
"""
import os
import sys
import json
import logging
import asyncio
import aiohttp
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from uuid import UUID
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client as SupabaseClient

class UUIDEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles UUID objects."""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)

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

# Configuration
SPORTSDATA_BASE_URL = "https://api.sportsdata.io/v3"

# Get Supabase credentials
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("PUBLIC_SUPABASE_KEY")

# Ensure the Supabase URL is properly formatted
if SUPABASE_URL:
    # Remove any trailing slashes and /rest/v1 if present
    SUPABASE_URL = SUPABASE_URL.rstrip('/')
    if SUPABASE_URL.endswith('/rest/v1'):
        SUPABASE_URL = SUPABASE_URL[:-8]  # Remove /rest/v1
    SUPABASE_URL = SUPABASE_URL.rstrip('/')  # Remove any trailing slashes again

# League to API key mapping
LEAGUE_KEYS = {
    "mlb": os.getenv("SPORTSDATA_MLB_KEY"),
    "nba": os.getenv("SPORTSDATA_NBA_KEY"),
    "nfl": os.getenv("SPORTSDATA_NFL_KEY"),
    "nhl": os.getenv("SPORTSDATA_NHL_KEY"),
    "mls": os.getenv("SPORTSDATA_MLS_KEY")
}

# Fallback to default key if available
DEFAULT_KEY = os.getenv("SPORTSDATA_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    logger.error("❌ Missing required Supabase environment variables. Check your .env file.")
    sys.exit(1)

# Check if we have at least one valid API key
if not any(LEAGUE_KEYS.values()) and not DEFAULT_KEY:
    logger.error("❌ No SportsData.io API keys found. Please set at least one league key in your .env file.")
    sys.exit(1)

# Constants
SPORTSDATA_API_KEY = os.getenv('SPORTSDATA_API_KEY')

# Validate environment variables
if not all([SPORTSDATA_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    logger.error("❌ Missing required environment variables. Check SPORTSDATA_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_KEY")
    sys.exit(1)

class League(Enum):
    NHL = "nhl"
    NBA = "nba"
    MLB = "mlb"
    NFL = "nfl"
    MLS = "mls"

class SportsDataClient:
    """Client for interacting with the SportsData.io API."""
    
    def __init__(self, api_key: str):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'Ocp-Apim-Subscription-Key': api_key,
                'User-Agent': 'AstroBetAdvisor/1.0',
                'Accept-Encoding': 'gzip'
            }
        )
    
    async def get_leagues(self) -> List[Dict[str, Any]]:
        """Get all supported leagues."""
        return [{"Key": league.value.upper(), "Name": league.name} for league in League]
    
    async def get_teams(self, league: League) -> List[Dict[str, Any]]:
        """Get all teams for a league."""
        url = f"{SPORTSDATA_BASE_URL}/{league.value}/scores/json/AllTeams"
        return await self._make_request(url)
    
    async def get_players(self, league: League, team_key: str = None) -> List[Dict[str, Any]]:
        """Get players for a league, optionally filtered by team."""
        if team_key:
            url = f"{SPORTSDATA_BASE_URL}/{league.value}/scores/json/Players/{team_key.upper()}"
        else:
            url = f"{SPORTSDATA_BASE_URL}/{league.value}/scores/json/Players"
        return await self._make_request(url)
    
    async def get_player_season_stats(self, league: League, season: int) -> List[Dict[str, Any]]:
        """Get season stats for all players in a league."""
        url = f"{SPORTSDATA_BASE_URL}/{league.value}/stats/json/PlayerSeasonStats/{season}"
        return await self._make_request(url)
    
    async def get_games(self, league: League, season: int, date: str = None) -> List[Dict[str, Any]]:
        """Get games for a league and season, optionally filtered by date."""
        if date:
            url = f"{SPORTSDATA_BASE_URL}/{league.value}/scores/GamesByDate/{date}"
        else:
            url = f"{SPORTSDATA_BASE_URL}/{league.value}/scores/Games/{season}"
        return await self._make_request(url)
    
    async def get_standings(self, league: League, season: int) -> List[Dict[str, Any]]:
        """Get standings for a league and season."""
        url = f"{SPORTSDATA_BASE_URL}/{league.value}/scores/json/Standings/{season}"
        return await self._make_request(url)
    
    async def get_game_odds(self, league: League, date: str) -> List[Dict[str, Any]]:
        """Get betting odds for all games on a given date for a league."""
        url = f"{SPORTSDATA_BASE_URL}/{league.value}/odds/json/GameOddsByDate/{date}"
        return await self._make_request(url)
    
    async def _make_request(self, url: str) -> Any:
        """Make an HTTP request and handle errors."""
        try:
            logger.debug(f"Fetching {url}")
            response = await self.session.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error for {url}: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 401:
                logger.error("❌ Invalid API key. Check your SPORTSDATA_API_KEY")
            return None
        except Exception as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()

class SupabaseManager:
    """Manager for Supabase operations using raw HTTP requests."""
    
    def __init__(self, url: str, key: str):
        self.base_url = url.rstrip('/')
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        self.session = aiohttp.ClientSession(headers=self.headers)
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.close()
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make an HTTP request to the Supabase API."""
        url = f"{self.base_url}/rest/v1/{endpoint.lstrip('/')}"
        try:
            # Log the request details for debugging
            logger.debug(f"Making {method} request to {url}")
            
            # Use custom JSON encoder for UUID serialization
            if 'json' in kwargs:
                json_data = kwargs.pop('json')
                logger.debug(f"Request JSON data: {json.dumps(json_data, indent=2, cls=UUIDEncoder)[:500]}...")  # Log first 500 chars
                kwargs['data'] = json.dumps(json_data, cls=UUIDEncoder)
                if 'headers' not in kwargs:
                    kwargs['headers'] = {}
                kwargs['headers']['Content-Type'] = 'application/json'
            
            # Log headers (without sensitive data)
            headers = {k: v for k, v in kwargs.get('headers', {}).items() if k.lower() != 'authorization'}
            logger.debug(f"Request headers: {headers}")
                
            async with self.session.request(method, url, **kwargs) as response:
                try:
                    response.raise_for_status()
                    if response.status == 204:  # No content
                        return {}
                    return await response.json()
                except aiohttp.ClientResponseError as e:
                    # Log response details for errors
                    error_text = await response.text()
                    logger.error(f"Error response ({e.status}): {error_text}")
                    raise
                
        except aiohttp.ClientError as e:
            logger.error(f"Error making {method} request to {url}: {str(e)}")
            if hasattr(e, 'response') and e.response:
                try:
                    error_text = await e.response.text()
                    logger.error(f"Error response: {error_text}")
                except:
                    pass
            raise
    
    async def get_league_id(self, league_key: str) -> UUID:
        """Get the database ID for a league by its key, creating it if it doesn't exist."""
        try:
            # Try to get existing league
            endpoint = f"leagues?select=id&key=eq.{league_key.lower()}"
            result = await self._make_request('GET', endpoint)
            
            if isinstance(result, list) and result:
                return UUID(result[0]['id'])
            
            # League doesn't exist, create it
            league_info = {
                'mlb': {'name': 'Major League Baseball', 'external_id': 1},
                'nba': {'name': 'National Basketball Association', 'external_id': 2},
                'nfl': {'name': 'National Football League', 'external_id': 3},
                'nhl': {'name': 'National Hockey League', 'external_id': 4},
                'mls': {'name': 'Major League Soccer', 'external_id': 5}
            }.get(league_key.lower(), {'name': league_key.upper(), 'external_id': 0})
            
            league_data = {
                'external_id': league_info['external_id'],
                'name': league_info['name'],
                'key': league_key.lower(),
                'active': True
            }
            
            # Create the league
            result = await self._make_request(
                'POST', 
                'leagues',
                json=league_data
            )
            
            if not result:
                raise ValueError(f"Failed to create league {league_key}")
                
            return UUID(result[0]['id'] if isinstance(result, list) else result['id'])
            
        except Exception as e:
            logger.error(f"Error getting/creating league {league_key}: {str(e)}")
            raise
    
    async def upsert_teams(self, league_id: str, teams_data: List[Dict[str, Any]]) -> Dict[str, str]:
        """Upsert teams data and return a mapping of external_id to internal_id."""
        if not teams_data:
            logger.info("No team data provided for upsert")
            return {}
            
        logger.info(f"Preparing to upsert {len(teams_data)} teams for league_id: {league_id}")
        
        # Get league key for reference
        league_key = None
        try:
            league_result = await self._make_request(
                'GET',
                f'leagues?id=eq.{league_id}&select=key',
            )
            if league_result:
                league_key = league_result[0].get('key')
                logger.debug(f"Found league key: {league_key}")
        except Exception as e:
            logger.warning(f"Could not fetch league key: {str(e)}")
            
        # Prepare the data for upsert
        upsert_data = []
        for i, team in enumerate(teams_data[:5], 1):  # Log first 5 teams as sample
            logger.debug(f"Team {i}/{len(teams_data)} - ID: {team.get('TeamID')}, Name: {team.get('Name')}")
            
        for team in teams_data:
            try:
                # Handle team name and city - some teams might have city in name
                team_name = team.get('Name', '')
                team_city = team.get('City', '')
                
                # If city is not provided but name contains it, try to extract
                if not team_city and ' ' in team_name:
                    possible_city = team_name.split(' ')[0]
                    if len(possible_city) > 2:  # Simple check to avoid single letters
                        team_city = possible_city
                        team_name = ' '.join(team_name.split(' ')[1:]).strip()
                
                team_data = {
                    'external_id': team['TeamID'],
                    'league_id': str(league_id),  # Ensure UUID is converted to string
                    'city': team_city,
                    'name': team_name,
                    'abbreviation': team.get('Key', ''),
                    'primary_color': team.get('PrimaryColor', '000000'),  # Without # as it's added by UI
                    'secondary_color': team.get('SecondaryColor', 'FFFFFF'),  # Without # as it's added by UI
                    'logo_url': team.get('WikipediaLogoUrl'),
                    'venue_name': team.get('StadiumName'),
                    'venue_city': team.get('StadiumCity'),
                    'venue_state': team.get('StadiumState'),
                    'venue_capacity': team.get('StadiumCapacity'),
                    'venue_surface': team.get('StadiumSurface'),
                    'venue_address': team.get('StadiumAddress'),
                    'venue_zip': team.get('StadiumZip'),
                    'venue_country': team.get('StadiumCountry'),
                    'venue_latitude': team.get('StadiumLatitude'),
                    'venue_longitude': team.get('StadiumLongitude'),
                    'source_system': 'sportsdata.io',
                    'is_active': True
                }
                
                # Clean up None values
                team_data = {k: v for k, v in team_data.items() if v is not None}
                upsert_data.append(team_data)
                
            except KeyError as e:
                logger.error(f"Missing required field in team data: {e}")
                logger.debug(f"Team data: {team}")
                raise
        
        logger.info(f"Upserting {len(upsert_data)} teams...")
        
        try:
            # Perform the upsert in smaller batches to avoid request size limits
            batch_size = 20
            all_results = []
            
            for i in range(0, len(upsert_data), batch_size):
                batch = upsert_data[i:i + batch_size]
                logger.debug(f"Processing batch {i//batch_size + 1}/{(len(upsert_data)-1)//batch_size + 1} with {len(batch)} teams")
                
                # First try to insert with conflict on (external_id, league_id)
                try:
                    result = await self._make_request(
                        'POST',
                        'teams',
                        params={'on_conflict': 'external_id,league_id'},
                        json=batch
                    )
                    
                    if isinstance(result, list):
                        all_results.extend(result)
                    else:
                        all_results.append(result)
                        
                except Exception as e:
                    logger.error(f"Error upserting batch: {str(e)}")
                    # If batch upsert fails, try one by one
                    logger.info("Falling back to individual team upserts...")
                    for team in batch:
                        try:
                            result = await self._make_request(
                                'POST',
                                'teams',
                                params={'on_conflict': 'external_id,league_id'},
                                json=team
                            )
                            if isinstance(result, list):
                                all_results.extend(result)
                            else:
                                all_results.append(result)
                        except Exception as single_error:
                            logger.error(f"Failed to upsert team {team.get('external_id')}: {str(single_error)}")
            
            # Create a mapping of external_id to internal_id
            logger.info(f"Successfully processed {len(all_results)} teams")
            return {str(team['external_id']): str(team['id']) for team in all_results}
            
        except Exception as e:
            logger.error(f"Error upserting teams: {str(e)}")
            if len(upsert_data) > 0:
                logger.debug(f"First team in upsert data: {json.dumps(upsert_data[0], indent=2, cls=UUIDEncoder)}")
            raise
    
    async def upsert_players(self, players_data: List[Dict[str, Any]], team_id_map: Dict[str, str]) -> Dict[str, str]:
        """Upsert players data and return a mapping of external_id to internal_id.
        
        Args:
            players_data: List of player data dictionaries from the API
            team_id_map: Mapping of external team IDs to internal UUIDs
            
        Returns:
            Dict mapping external player IDs to internal UUIDs
        """
        if not players_data:
            logger.info("No player data provided for upsert")
            return {}
            
        logger.info(f"Preparing to upsert {len(players_data)} players")
        logger.debug(f"Team ID map: {json.dumps(team_id_map, indent=2)}")
        
        # If team_id_map is empty, try to fetch teams from the database
        if not team_id_map:
            logger.warning("No team ID map provided, trying to fetch teams from database")
            try:
                teams = await self._make_request('GET', 'teams?select=id,external_id')
                if teams and isinstance(teams, list):
                    team_id_map = {str(team['external_id']): str(team['id']) for team in teams}
                    logger.info(f"Fetched {len(team_id_map)} teams from database")
                else:
                    logger.error("Could not fetch teams from database")
                    return {}
            except Exception as e:
                logger.error(f"Error fetching teams: {str(e)}")
                return {}
        
        # Prepare the data for upsert
        upsert_data = []
        player_count = 0
        
        for player in players_data:
            try:
                # Get team ID - try multiple possible fields
                team_id = None
                team_ext_id = None
                
                # Try different possible team ID fields
                for field in ['CurrentTeamID', 'TeamID', 'CurrentTeam', 'Team']:
                    if field in player and player[field] is not None:
                        team_ext_id = str(player[field])
                        team_id = team_id_map.get(team_ext_id)
                        if team_id:
                            break
                
                # Skip players without a valid team reference
                if not team_id:
                    logger.debug(f"Skipping player {player.get('PlayerID')} - no valid team reference (tried: {team_ext_id})")
                    continue
                
                # Handle name - some APIs might only provide full name
                first_name = player.get('FirstName', '')
                last_name = player.get('LastName', '')
                
                # If no first/last name but we have a full name, try to split it
                if not first_name and not last_name and 'Name' in player and player['Name']:
                    name_parts = player['Name'].split(' ', 1)
                    if len(name_parts) == 2:
                        first_name, last_name = name_parts
                    else:
                        last_name = player['Name']
                
                # Clean up names
                first_name = first_name.strip() if first_name else ''
                last_name = last_name.strip() if last_name else ''
                
                # Skip players without a name
                if not first_name and not last_name:
                    logger.debug(f"Skipping player {player.get('PlayerID')} - no name information")
                    continue
                
                # Prepare player data according to our schema
                player_data = {
                    'external_id': player['PlayerID'],
                    'first_name': first_name,
                    'last_name': last_name,
                    'birth_date': player.get('BirthDate'),
                    'birth_city': player.get('BirthCity'),
                    'birth_country': player.get('BirthCountry'),
                    'nationality': player.get('BirthCountry'),  # Default to birth country if nationality not provided
                    'height': player.get('Height'),
                    'weight': player.get('Weight'),
                    'primary_position': player.get('Position'),
                    'primary_number': player.get('Jersey'),
                    'bat_side': player.get('BatHand'),
                    'throw_hand': player.get('ThrowHand'),
                    'headshot_url': player.get('PhotoUrl') or player.get('PhotoUrlHttps'),
                    'current_team_id': team_id,
                    'source_system': 'sportsdata.io',
                    'is_active': True
                }
                
                # Clean up None values and empty strings
                player_data = {k: v for k, v in player_data.items() 
                             if v is not None and v != '' and v != {}}
                upsert_data.append(player_data)
                player_count += 1
                
                # Log first few players for debugging
                if player_count <= 3:
                    logger.debug(f"Sample player data: {json.dumps(player_data, indent=2, cls=UUIDEncoder)}")
                
            except KeyError as e:
                logger.error(f"Missing required field in player data: {e}")
                logger.debug(f"Player data: {player}")
            except Exception as e:
                logger.error(f"Error processing player {player.get('PlayerID')}: {str(e)}")
                logger.debug(f"Player data: {player}")
        
        if not upsert_data:
            logger.warning("No valid player data to upsert")
            return {}
            
        logger.info(f"Upserting {len(upsert_data)} players...")
        
        try:
            # Perform the upsert in smaller batches to avoid request size limits
            batch_size = 50
            all_results = []
            total_upserted = 0
            
            for i in range(0, len(upsert_data), batch_size):
                batch = upsert_data[i:i + batch_size]
                logger.debug(f"Processing batch {i//batch_size + 1}/{(len(upsert_data)-1)//batch_size + 1} with {len(batch)} players")
                
                try:
                    result = await self._make_request(
                        'POST',
                        'players',
                        params={'on_conflict': 'external_id'},
                        json=batch
                    )
                    
                    if isinstance(result, list):
                        all_results.extend(result)
                        total_upserted += len(result)
                    else:
                        all_results.append(result)
                        total_upserted += 1
                        
                    logger.debug(f"Successfully processed batch {i//batch_size + 1}")
                    
                except Exception as batch_error:
                    logger.error(f"Error upserting batch of players: {str(batch_error)}")
                    logger.info("Falling back to individual player upserts...")
                    
                    # Try to upsert players one by one
                    for player in batch:
                        try:
                            single_result = await self._make_request(
                                'POST',
                                'players',
                                params={'on_conflict': 'external_id'},
                                json=player
                            )
                            if single_result:
                                if isinstance(single_result, list):
                                    all_results.extend(single_result)
                                    total_upserted += len(single_result)
                                else:
                                    all_results.append(single_result)
                                    total_upserted += 1
                        except Exception as single_error:
                            logger.error(f"Failed to upsert player {player.get('external_id')}: {str(single_error)}")
            
            logger.info(f"Successfully processed {total_upserted} players")
            
            # Create a mapping of external_id to internal_id
            id_map = {}
            for result in all_results:
                if isinstance(result, list):
                    for player in result:
                        if 'id' in player and 'external_id' in player:
                            id_map[str(player['external_id'])] = str(player['id'])
                elif isinstance(result, dict) and 'id' in result and 'external_id' in result:
                    id_map[str(result['external_id'])] = str(result['id'])
            
            return id_map
            
        except Exception as e:
            logger.error(f"Error upserting players: {str(e)}")
            if len(upsert_data) > 0:
                logger.debug(f"First player in upsert data: {json.dumps(upsert_data[0], indent=2, cls=UUIDEncoder)}")
            return {}
    
    async def upsert_games(self, games_data: List[Dict[str, Any]], 
                          league_id: str,
                          team_id_map: Dict[str, str]) -> Dict[str, str]:
        """Upsert games data and return a mapping of external_id to internal_id."""
        if not games_data:
            return {}
            
        # Prepare the data for upsert
        upsert_data = []
        for game in games_data:
            home_team_id = team_id_map.get(str(game.get('HomeTeamID')))
            away_team_id = team_id_map.get(str(game.get('AwayTeamID')))
            
            if not home_team_id or not away_team_id:
                logger.warning(f"Skipping game {game.get('GameID')} - team not found")
                continue
                
            game_time = game.get('DateTimeUTC')
            if game_time:
                try:
                    game_time = datetime.fromisoformat(game_time.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    game_time = None
            
            game_data = {
                'external_id': game.get('GameID'),
                'league_id': league_id,
                'season': game.get('Season'),
                'season_type': game.get('SeasonType', 'regular').lower(),
                'game_date': game.get('Day'),
                'game_time_utc': game_time.isoformat() if game_time else None,
                'game_time_local': game_time.isoformat() if game_time else None,  # Adjust with timezone if needed
                'status': game.get('Status', 'scheduled').lower(),
                'period': game.get('Period'),
                'period_time_remaining': game.get('TimeRemainingMinutes'),
                'home_team_id': home_team_id,
                'away_team_id': away_team_id,
                'venue_id': home_team_id,  # Assuming home team's venue
                'home_score': game.get('HomeTeamScore'),
                'away_score': game.get('AwayTeamScore'),
                'home_odds': game.get('HomeTeamMoneyLine'),
                'away_odds': game.get('AwayTeamMoneyLine'),
                'over_under': game.get('OverUnder'),
                'spread': game.get('PointSpread'),
                'attendance': game.get('Attendance'),
                'broadcasters': game.get('Broadcasters', []),
                'notes': game.get('Notes')
            }
            upsert_data.append(game_data)
        
        # Perform the upsert
        if upsert_data:  # Only make the request if we have data
            result = await self._make_request(
                'POST',
                'games',
                params={'on_conflict': 'external_id,league_id'},
                json=upsert_data
            )
            
            # Create a mapping of external_id to internal_id
            result_list = result if isinstance(result, list) else [result]
            return {str(game['external_id']): str(game['id']) for game in result_list}
        
        return {}
    
    async def upsert_player_seasons(self, stats_data: List[Dict[str, Any]], 
                                   player_id_map: Dict[str, str],
                                   team_id_map: Dict[str, str],
                                   league_id: str) -> None:
        """Upsert player season stats data."""
        if not stats_data:
            return
            
        # Prepare the data for upsert
        upsert_data = []
        for stats in stats_data:
            player_id = player_id_map.get(str(stats.get('PlayerID')))
            team_id = team_id_map.get(str(stats.get('TeamID')))
            
            if not player_id or not team_id:
                continue
                
            # Extract common stats
            season_data = {
                'player_id': player_id,
                'team_id': team_id,
                'league_id': league_id,
                'season': stats.get('Season'),
                'games_played': stats.get('Games', 0),
                'games_started': stats.get('GamesStarted', 0),
                'minutes_played': stats.get('Minutes', 0),
                'stats': {},
                'advanced_stats': {}
            }
            
            # Add sport-specific stats
            for key, value in stats.items():
                if key in ['PlayerID', 'TeamID', 'Season', 'Games', 'GamesStarted', 'Minutes']:
                    continue
                    
                # Add to appropriate stats dictionary
                if key in ['OPS', 'WAR', 'BABIP', 'wOBA', 'wRC+']:
                    season_data['advanced_stats'][key] = value
                else:
                    season_data['stats'][key] = value
            
            upsert_data.append(season_data)
        
        # Upsert in batches to avoid large payloads
        batch_size = 50
        for i in range(0, len(upsert_data), batch_size):
            batch = upsert_data[i:i + batch_size]
            await self._make_request(
                'POST',
                'player_seasons',
                params={'on_conflict': 'player_id,team_id,season,league_id'},
                json=batch
            )

class SportsDataSync:
    """Main class for syncing sports data."""
    
    def __init__(self):
        self.clients = {}
        self.supabase = SupabaseManager(SUPABASE_URL, SUPABASE_KEY)
        self.current_year = datetime.now().year
        
        # Initialize API clients for each league with valid keys
        for league_name, key in LEAGUE_KEYS.items():
            if key and key != 'your_'+league_name+'_api_key_here':  # Skip placeholder keys
                self.clients[league_name] = SportsDataClient(key)
        
        # If no league-specific keys, use default key if available
        if not self.clients and DEFAULT_KEY and DEFAULT_KEY != 'your_default_sportsdata_api_key_here':
            logger.warning("⚠️  Using default API key for all leagues")
            for league in League:
                self.clients[league.value] = SportsDataClient(DEFAULT_KEY)
        
        if not self.clients:
            raise ValueError("No valid API keys found for any league")
    
    async def sync_league(self, league: League) -> None:
        """Sync data for a specific league."""
        league_name = league.value.upper()
        logger.info(f"\n🔄 Starting sync for {league_name}")
        
        # Get the API client for this league
        client = self.clients.get(league.value)
        if not client:
            logger.warning(f"⚠️  No API key found for {league_name}. Skipping...")
            return
        
        try:
            # Get or create the league in the database
            league_id = await self.supabase.get_league_id(league_name)
            
            # Sync teams
            logger.info(f"  📋 Syncing {league_name} teams...")
            teams = await client.get_teams(league)
            team_id_map = await self.supabase.upsert_teams(league_id, teams)
            logger.info(f"  ✅ Synced {len(team_id_map)} teams")
            
            # Sync players
            logger.info(f"  👥 Syncing {league_name} players...")
            
            # First, try to get all players at once (more efficient if the API supports it)
            try:
                players = await client.get_players(league)
                logger.info(f"  Fetched {len(players)} players in one request")
            except Exception as e:
                logger.warning(f"  Could not fetch all players at once, falling back to per-team fetch: {str(e)}")
                players = []
                for team_ext_id in team_id_map.keys():
                    try:
                        team_players = await client.get_players(league, team_ext_id)
                        if team_players:
                            players.extend(team_players)
                            logger.debug(f"  Fetched {len(team_players)} players for team {team_ext_id}")
                    except Exception as team_error:
                        logger.error(f"  Error fetching players for team {team_ext_id}: {str(team_error)}")
            
            if not players:
                logger.warning("  No players found to sync")
                player_id_map = {}
            else:
                logger.info(f"  Upserting {len(players)} players...")
                player_id_map = await self.supabase.upsert_players(players, team_id_map)
                logger.info(f"  ✅ Synced {len(player_id_map)} players")
            
            # Sync player stats
            logger.info(f"  📊 Syncing {league_name} player stats...")
            current_year = datetime.now().year
            stats = await client.get_player_season_stats(league, current_year)
            await self.supabase.upsert_player_seasons(stats, player_id_map, team_id_map, league_id)
            logger.info(f"  ✅ Synced stats for {len(stats)} player seasons")
            
            # Sync games
            logger.info(f"  🏟️  Syncing {league_name} games...")
            games = await client.get_games(league, current_year)
            game_id_map = await self.supabase.upsert_games(games, league_id, team_id_map)
            logger.info(f"  ✅ Synced {len(game_id_map)} games")
            
            # Sync betting odds
            logger.info(f"  🎰 Syncing {league_name} betting odds...")
            await self.sync_betting_odds(league, games, client)
            
            logger.info(f"✅ Successfully synced {league_name} data")
            
        except Exception as e:
            logger.error(f"❌ Error syncing {league_name}: {str(e)}")
            logger.exception(e)  # Log full traceback for debugging

    async def sync_betting_odds(self, league: League, games_data: List[Dict[str, Any]], client) -> None:
        """Fetch and upsert betting odds for each game into game_odds table.
        
        Args:
            league: The league to sync odds for
            games_data: List of game data dictionaries from get_games
            client: The API client to use for fetching odds
        """
        if not games_data:
            logger.warning("No games data provided to sync_betting_odds")
            return
            
        # Get the league ID for foreign key reference
        league_id = await self.supabase.get_league_id(league.value.upper())
        if not league_id:
            logger.error(f"League {league.value} not found in database")
            return
            
        # Create a mapping of external game ID to our internal game ID
        game_id_map = {}
        for game in games_data:
            game_id = game.get('GameID')
            if not game_id:
                continue
                
            # Look up the game in our database to get the internal ID
            result = await self.supabase._make_request(
                'GET',
                'games',
                params={
                    'select': 'id',
                    'external_id': f'eq.{game_id}',
                    'league_id': f'eq.{league_id}'
                }
            )
            
            if result and isinstance(result, list) and len(result) > 0:
                game_id_map[str(game_id)] = result[0]['id']
        
        if not game_id_map:
            logger.warning("No valid game IDs found in the database to sync odds for")
            return
            
        # Fetch and upsert odds for each game
        logger.info(f"Fetching odds for {len(game_id_map)} games...")
        
        # Process in batches to avoid rate limits
        batch_size = 10
        game_ids = list(game_id_map.keys())
        total_games = len(game_ids)
        
        for i in range(0, total_games, batch_size):
            batch = game_ids[i:i + batch_size]
            logger.info(f"Processing games {i+1} to {min(i + batch_size, total_games)} of {total_games}")
            
            # Fetch odds for this batch
            odds_records = []
            for game_id in batch:
                try:
                    # Get the game details to extract the date for the API call
                    game_date = None
                    for game in games_data:
                        if str(game.get('GameID')) == game_id:
                            game_date = game.get('Day')
                            break
                    
                    if not game_date:
                        logger.warning(f"Could not find game date for game ID {game_id}")
                        continue
                    
                    # Format the date as YYYY-MM-DD
                    game_date = game_date.split('T')[0] if 'T' in game_date else game_date
                    
                    # Get odds for this game
                    odds = await client.get_game_odds(league, game_date)
                    if not odds or not isinstance(odds, list):
                        continue
                        
                    # Find odds for this specific game
                    game_odds = None
                    for odd in odds:
                        if str(odd.get('GameID')) == game_id:
                            game_odds = odd.get('PregameOdds', [])
                            break
                    
                    if not game_odds:
                        continue
                        
                    # Process each sportsbook's odds for this game
                    for book_odds in game_odds:
                        if not book_odds or not isinstance(book_odds, dict):
                            continue
                            
                        # Extract relevant data
                        sportsbook = book_odds.get('Sportsbook')
                        if not sportsbook:
                            continue
                            
                        # Process each market (moneyline, spread, total)
                        markets = book_odds.get('Markets', [])
                        if not isinstance(markets, list):
                            continue
                            
                        # Initialize record with common fields
                        record = {
                            'game_id': game_id_map[game_id],
                            'sportsbook': sportsbook,
                            'last_updated': datetime.utcnow().isoformat()
                        }
                        
                        # Process each market
                        for market in markets:
                            if not isinstance(market, dict):
                                continue
                                
                            market_type = market.get('MarketType')
                            outcomes = market.get('Outcomes', [])
                            
                            if market_type == 'Game':  # Moneyline
                                for outcome in outcomes:
                                    if outcome.get('Name') == 'Home':
                                        record['home_moneyline'] = outcome.get('Price')
                                    elif outcome.get('Name') == 'Away':
                                        record['away_moneyline'] = outcome.get('Price')
                                        
                            elif market_type == 'Spread':
                                for outcome in outcomes:
                                    if outcome.get('Name') == 'Home':
                                        record['home_spread'] = outcome.get('Point')
                                        record['home_spread_odds'] = outcome.get('Price')
                                    elif outcome.get('Name') == 'Away':
                                        record['away_spread'] = outcome.get('Point')
                                        record['away_spread_odds'] = outcome.get('Price')
                                        
                            elif market_type == 'Total':
                                for outcome in outcomes:
                                    if outcome.get('Name') == 'Over':
                                        record['over_under'] = outcome.get('Point')
                                        record['over_odds'] = outcome.get('Price')
                                    elif outcome.get('Name') == 'Under':
                                        record['under_odds'] = outcome.get('Price')
                        
                        # Add the record if we have any odds data
                        if any(k in record for k in ['home_moneyline', 'away_moneyline', 'home_spread', 'away_spread', 'over_under']):
                            odds_records.append(record)
                            
                except Exception as e:
                    logger.error(f"Error processing odds for game {game_id}: {e}")
            
            # Upsert the batch of odds records
            if odds_records:
                total = len(odds_records)
                logger.info(f"  Upserting {total} odds records...")
                
                # Process in smaller batches for upsert
                upsert_batch_size = 50
                for i in range(0, total, upsert_batch_size):
                    batch = odds_records[i:i + upsert_batch_size]
                    try:
                        await self.supabase._make_request(
                            'POST',
                            'game_odds',
                            params={'on_conflict': 'game_id,sportsbook'},
                            json=batch
                        )
                        logger.info(f"  ✅ Upserted batch {i//upsert_batch_size + 1}/{(total + upsert_batch_size - 1)//upsert_batch_size}")
                    except Exception as e:
                        logger.error(f"Error upserting batch {i//upsert_batch_size + 1}: {e}")
            else:
                logger.warning("No odds records to upsert for this batch")

    async def close(self):
        """Clean up resources."""
        # Close all client sessions
        for client in self.clients.values():
            await client.close()

async def main():
    """Main function to run the sync."""
    sync = None
    try:
        sync = SportsDataSync()
        
        # Sync all leagues or specify which ones to sync
        leagues_to_sync = [League.MLB]  # Start with MLB only for now
        
        for league in leagues_to_sync:
            await sync.sync_league(league)
            
    except KeyboardInterrupt:
        logger.info("\n🛑 Sync interrupted by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
    finally:
        if sync:
            await sync.close()
        logger.info("👋 Sync completed")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

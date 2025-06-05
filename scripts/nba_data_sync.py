"""NBA Data Synchronization Script

This script fetches NBA player and team data from the MySportsFeeds API and syncs it to Supabase.
"""

import os
import json
import asyncio
import logging
import base64
import time
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dotenv import load_dotenv
import httpx
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('nba_sync.log')
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
SEASON = "current"  # Automatically use current season

# API configuration
RATE_LIMIT = 3.0  # Increased from 2.0s to 3.0s between requests
MAX_RETRIES = 5  # Increased from 3 to 5 retries
INITIAL_RETRY_DELAY = 2  # Start with 2s delay, then exponential backoff
MAX_RETRY_DELAY = 30  # Max 30s delay between retries
BATCH_SIZE = 10  # Reduced from 20 to 10 players per batch
REQUEST_TIMEOUT = 120  # Increased from 30s to 120s timeout per request

class NBADataSync:
    def __init__(self):
        """Initialize the NBA data sync client with enhanced timeout settings."""
        auth_string = f"{MSF_API_KEY}:MYSPORTSFEEDS"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        
        timeout = httpx.Timeout(REQUEST_TIMEOUT, connect=30.0)
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        
        self.client = httpx.AsyncClient(
            timeout=timeout,
            limits=limits,
            headers={
                "Accept": "application/json",
                "User-Agent": "NBA-Data-Sync/1.0",
                "Authorization": f"Basic {base64_auth}"
            }
        )
        self.total_processed = 0
        self.total_errors = 0
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.last_request = 0
        
        # Enable player stats sync by default
        self.sync_player_stats = True
        
        # Ensure the database schema is up to date
        self.ensure_db_schema()
        
    def ensure_db_schema(self):
        """Ensure the database schema has all required columns and functions."""
        try:
            # Check if the table exists by trying to query it
            try:
                # This will fail if the table doesn't exist
                self.supabase.table('nba_players').select('*').limit(1).execute()
                logger.info("nba_players table exists, skipping schema setup")
            except Exception as e:
                logger.warning("nba_players table doesn't exist or is not accessible. "
                             "Please create the table with the correct schema manually.")
                logger.warning(f"Error: {str(e)}")
            
            # Note: We can't create or modify tables/columns directly due to permissions
            # The table and columns should be created manually in Supabase with the following schema:
            # - external_id: TEXT
            # - contract_year: INTEGER
            # - alternate_positions: TEXT[]
            # - current_injury: JSONB
            # - shoots_hand: CHAR(1)
            # - social_media_accounts: JSONB
            # - draft_pick_team_id: INTEGER
            # - draft_pick_team_abbr: VARCHAR(10)
            # - draft_round_pick: INTEGER
            # - draft_overall_pick: INTEGER
            # - external_mappings: JSONB
            # - photo_url: TEXT
            # - roster_status: TEXT
            # - is_active: BOOLEAN
            # - status: TEXT
            # - experience: INTEGER
            # - Plus all the standard player fields (id, first_name, last_name, etc.)
            
            logger.info("Database schema verification complete")
            
        except Exception as e:
            logger.error(f"Error ensuring database schema: {str(e)}")
            # Don't raise the exception, just log it and continue
            # The sync will still try to work with the existing schema
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def rate_limit(self):
        """Enforce rate limiting between API calls."""
        now = asyncio.get_event_loop().time()
        elapsed = now - self.last_request
        if elapsed < RATE_LIMIT:
            await asyncio.sleep(RATE_LIMIT - elapsed)
        self.last_request = asyncio.get_event_loop().time()
    
    async def fetch_data(self, endpoint: str, params: Optional[Dict] = None, retry_count: int = 0) -> Optional[Dict]:
        """Fetch data from the API with enhanced error handling, rate limiting, and retries."""
        if params is None:
            params = {}
            
        url = f"{MSF_BASE_URL}/{endpoint}"
        
        try:
            await self.rate_limit()
            logger.debug(f"Fetching {url} with params: {params}")
            
            # Add a unique request ID for tracking
            request_id = f"req_{int(time.time())}_{retry_count}"
            logger.debug(f"[{request_id}] Starting request to {endpoint}")
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            logger.debug(f"[{request_id}] Request successful")
            return response.json()
            
        except httpx.HTTPStatusError as e:
            self.total_errors += 1
            
            # Calculate backoff with jitter
            backoff = min(
                INITIAL_RETRY_DELAY * (2 ** retry_count) + (random.uniform(0, 1)),
                MAX_RETRY_DELAY
            )
            
            if e.response.status_code == 429:  # Rate limited
                if retry_count < MAX_RETRIES:
                    logger.warning(
                        f"[{request_id}] Rate limited. "
                        f"Retry {retry_count + 1}/{MAX_RETRIES} in {backoff:.1f}s. "
                        f"Response: {e.response.text[:200]}"
                    )
                    await asyncio.sleep(backoff)
                    return await self.fetch_data(endpoint, params, retry_count + 1)
                else:
                    logger.error(f"[{request_id}] Max retries reached for {url}")
            
            logger.error(
                f"[{request_id}] HTTP {e.response.status_code} for {url}. "
                f"Response: {e.response.text[:500]}"
            )
            
        except (httpx.RequestError, json.JSONDecodeError) as e:
            self.total_errors += 1
            
            if retry_count < MAX_RETRIES:
                backoff = min(INITIAL_RETRY_DELAY * (2 ** retry_count), MAX_RETRY_DELAY)
                logger.warning(
                    f"[{request_id}] Error: {str(e)[:200]}. "
                    f"Retry {retry_count + 1}/{MAX_RETRIES} in {backoff:.1f}s"
                )
                await asyncio.sleep(backoff)
                return await self.fetch_data(endpoint, params, retry_count + 1)
                
            logger.error(f"[{request_id}] Max retries reached. Error: {str(e)[:500]}")
            
        except Exception as e:
            self.total_errors += 1
            logger.error(f"[{request_id}] Unexpected error: {str(e)[:500]}", exc_info=True)
            
        return None
    
    async def get_players(self) -> List[Dict]:
        """Fetch all NBA players."""
        logger.info("Fetching NBA players...")
        players = []
        offset = 0
        limit = 100  # Max allowed by API
        
        while True:
            data = await self.fetch_data("players.json", {
                "season": SEASON,
                "limit": limit,
                "offset": offset
            })
            
            if not data or 'players' not in data or not data['players']:
                break
                
            players.extend(data['players'])
            logger.info(f"Fetched {len(players)} players so far...")
            
            if len(data['players']) < limit:
                break
                
            offset += limit
        
        logger.info(f"Total players fetched: {len(players)}")
        return players
    
    def process_player(self, player_data: Dict) -> Dict:
        """Process raw player data into our database format."""
        player = player_data.get('player', {})
        team = player_data.get('currentTeam', {}) or {}
        
        # Process height (convert from "6'4\"" to inches)
        height = None
        if 'height' in player and isinstance(player['height'], str):
            try:
                feet, inches = player['height'].replace('"', '').split("'")
                height = int(feet) * 12 + int(inches.strip() or 0)
            except (ValueError, AttributeError):
                height = None
        try:
            # Extract basic player info - ensure we have required fields
            player_id = player.get('id')
            first_name = player.get('firstName', '').strip()
            last_name = player.get('lastName', '').strip()

            if not player_id and not (first_name and last_name):
                logger.warning(f"Skipping player with missing ID and name: {player}")
                return None

            # Generate a stable ID if none exists
            if not player_id:
                # Create a hash of the player's name and birth date for a stable ID
                name_hash = hashlib.md5(f"{first_name}_{last_name}_{player.get('birthDate', '')}".encode()).hexdigest()
                player_id = f"gen_{name_hash[:12]}"

            # Process player data
            processed_player = {
                'id': str(player_id),  # Ensure ID is a string
                'external_player_id': str(player_id),  # Use the same ID as external_player_id
                'first_name': first_name,
                'last_name': last_name,
                'full_name': f"{first_name} {last_name}".strip(),
                'jersey_number': player.get('jerseyNumber'),
                'position': player.get('position'),
                'primary_position': player.get('primaryPosition'),
                'height': player.get('height'),
                'weight': player.get('weight'),
                'birth_date': player.get('birthDate'),
                'birth_country': player.get('birthCountry'),
                'birth_city': player.get('birthCity'),
                'birth_state': player.get('birthState'),
                'high_school': player.get('highSchool'),
                'college': player.get('college'),
                'draft_year': player.get('draftYear'),
                'draft_round': player.get('draftRound'),
                'draft_number': player.get('draftNumber'),
                'team_id': player.get('currentTeam', {}).get('id') if isinstance(player.get('currentTeam'), dict) else None,
                'team_abbreviation': player.get('currentTeam', {}).get('abbreviation') if isinstance(player.get('currentTeam'), dict) else None,
                'team_name': player.get('currentTeam', {}).get('name') if isinstance(player.get('currentTeam'), dict) else None,
                'photo_url': player.get('officialImageSrc'),
                'roster_status': player.get('rosterStatus'),
                'is_active': player.get('active'),
                'status': player.get('status'),
                'experience': player.get('experience'),
                'updated_at': datetime.utcnow().isoformat()
            }

            # Process height (convert from "6'4\"" to inches)
            height = None
            if 'height' in player and isinstance(player['height'], str):
                try:
                    feet, inches = player['height'].replace('"', '').split("'")
                    height = int(feet) * 12 + int(inches.strip() or 0)
                except (ValueError, AttributeError):
                    height = None
            processed_player['height'] = height

            # Process weight (remove 'lbs' if present)
            weight = player.get('weight')
            if isinstance(weight, str) and 'lbs' in weight:
                try:
                    weight = int(weight.replace('lbs', '').strip())
                except (ValueError, AttributeError):
                    weight = None
            processed_player['weight'] = weight

            # Handle contract info if available
            if 'contract' in player and isinstance(player['contract'], dict):
                processed_player.update({
                    'contract_year': player['contract'].get('year'),
                    'contract_salary': player['contract'].get('salary'),
                    'contract_guaranteed': player['contract'].get('guaranteed')
                })

            # Handle injury info if available
            if 'currentInjury' in player and isinstance(player['currentInjury'], dict):
                processed_player['current_injury'] = {
                    'description': player['currentInjury'].get('description'),
                    'status': player['currentInjury'].get('status'),
                    'start_date': player['currentInjury'].get('startDate'),
                    'return_date': player['currentInjury'].get('returnDate')
                }

            # Handle social media if available
            if 'socialMediaAccounts' in player and isinstance(player['socialMediaAccounts'], list):
                processed_player['social_media_accounts'] = {
                    account['mediaType']: account['value']
                    for account in player['socialMediaAccounts']
                    if isinstance(account, dict) and 'mediaType' in account and 'value' in account
                }

            # Handle draft info if available
            if 'draft' in player and isinstance(player['draft'], dict):
                processed_player.update({
                    'draft_year': player['draft'].get('year'),
                    'draft_round': player['draft'].get('round'),
                    'draft_number': player['draft'].get('pick'),
                    'draft_pick_team_id': player['draft'].get('team', {}).get('id') if isinstance(player['draft'].get('team'), dict) else None,
                    'draft_pick_team_abbr': player['draft'].get('team', {}).get('abbreviation') if isinstance(player['draft'].get('team'), dict) else None,
                    'draft_team_name': player['draft'].get('team', {}).get('name') if isinstance(player['draft'].get('team'), dict) else None
                })

            # Handle alternate positions if available
            if 'alternatePositions' in player and isinstance(player['alternatePositions'], list):
                processed_player['alternate_positions'] = [pos for pos in player['alternatePositions'] if pos]

            # Handle shooting hand if available
            if 'shoots' in player:
                processed_player['shoots_hand'] = str(player['shoots'])[0].upper() if player['shoots'] else None

            # Add external mappings if available
            if 'externalMappings' in player and isinstance(player['externalMappings'], dict):
                processed_player['external_mappings'] = player['externalMappings']

            # Ensure all values are JSON serializable
            for k, v in list(processed_player.items()):
                if v is not None and not isinstance(v, (str, int, float, bool, list, dict)):
                    processed_player[k] = str(v)

            return processed_player

        except Exception as e:
            self.total_errors += 1
            logger.error(f"Error processing player {player.get('id')} ({player.get('firstName')} {player.get('lastName')}): {str(e)}")
            if self.total_errors <= 3:  # Only log full error for first few
                logger.debug(f"Problematic player data: {json.dumps(player, default=str, indent=2)}")
            return None

    async def sync_players_to_db(self, players: List[Dict]) -> int:
        """Sync processed players to the database with improved error handling and progress tracking."""
        if not players:
            logger.warning("No players to sync")
            return 0

        total_players = len(players)
        logger.info(f"Starting sync of {total_players} players to database...")

        successful_upserts = 0
        start_time = time.time()

        # Get the current schema to check which columns exist
        try:
            # Try to get the table info to check columns
            table_info = self.supabase.table('nba_players').select('*').limit(1).execute()
            existing_columns = set(table_info.data[0].keys()) if table_info.data else set()
            logger.info(f"Found {len(existing_columns)} columns in nba_players table")
        except Exception as e:
            logger.warning(f"Could not get table schema, will try with minimal columns: {str(e)[:200]}")
            existing_columns = set()

        # If we don't have any columns, try to ensure the schema is created
        if not existing_columns:
            self.ensure_db_schema()
            # Try to get columns again
            try:
                table_info = self.supabase.table('nba_players').select('*').limit(1).execute()
                existing_columns = set(table_info.data[0].keys()) if table_info.data else set()
                logger.info(f"After schema update, found {len(existing_columns)} columns")
            except Exception as e:
                logger.error(f"Still could not get table schema: {str(e)[:200]}")
                existing_columns = set()

        # Process players in small batches
        for i in range(0, total_players, BATCH_SIZE):
            batch = players[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (total_players - 1) // BATCH_SIZE + 1

            # Calculate ETA
            elapsed = time.time() - start_time
            items_per_second = (i + 1) / (elapsed + 1e-6)  # Avoid division by zero
            remaining_items = total_players - i
            eta_seconds = remaining_items / items_per_second if items_per_second > 0 else 0

            logger.info(
                f"Processing batch {batch_num}/{total_batches} "
                f"(players {i + 1}-{min(i + BATCH_SIZE, total_players)} of {total_players}) "
                f"- ETA: {eta_seconds/60:.1f} min"
            )

            # Clean batch data and filter out non-existent columns
            clean_batch = []
            for player in batch:
                clean_player = {}
                for k, v in player.items():
                    # Skip None values and non-existent columns (if we have schema info)
                    if v is not None and (not existing_columns or k in existing_columns):
                        # Special handling for date fields
                        if k.endswith('_date') and isinstance(v, str):
                            try:
                                # Convert to ISO format if not already
                                datetime.fromisoformat(v.replace('Z', '+00:00'))
                                clean_player[k] = v
                            except (ValueError, TypeError):
                                logger.debug(f"Invalid date format for {k}: {v}")
                        else:
                            clean_player[k] = v

                # Remove age as it's calculated
                clean_player.pop('age', None)

                # Only add player if we have required fields
                if clean_player.get('id') or clean_player.get('external_id'):
                    clean_batch.append(clean_player)
                else:
                    logger.warning(f"Skipping player missing ID: {player.get('first_name')} {player.get('last_name')}")

            if not clean_batch:
                logger.warning(f"No valid players in batch {batch_num}")
                continue

            # Try batch upsert first (faster)
            batch_success = False
            try:
                # Use 'id' as fallback if 'external_player_id' doesn't exist
                conflict_column = 'external_player_id' if 'external_player_id' in clean_batch[0] else 'id'

                # Use the Supabase client's sync interface in a thread
                table = self.supabase.table('nba_players')
                query = table.upsert(
                    clean_batch,
                    on_conflict=conflict_column,
                    ignore_duplicates=False
                )
                result = await asyncio.to_thread(query.execute)

                successful_upserts += len(clean_batch)
                batch_success = True
                logger.debug(f"Batch {batch_num} upserted successfully using {conflict_column}")

            except Exception as e:
                error_msg = str(e)
                logger.warning(f"Batch upsert failed (will retry individually): {error_msg[:200]}")

                # If it's a column error, try to update the schema and retry
                if "column \"" in error_msg and "\" does not exist" in error_msg:
                    # Extract column name from error
                    col_start = error_msg.find('"') + 1
                    col_end = error_msg.find('"', col_start)
                    if col_start > 0 and col_end > col_start:
                        missing_col = error_msg[col_start:col_end]
                        logger.info(f"Attempting to add missing column: {missing_col}")
                        try:
                            # Try to add the column
                            rpc_call = self.supabase.rpc('add_column_if_not_exists', {
                                'table_name': 'nba_players',
                                'column_name': missing_col,
                                'column_type': 'TEXT'  # Default to TEXT, can be adjusted if needed
                            })
                            await asyncio.to_thread(rpc_call.execute)
                            logger.info(f"Added column: {missing_col}")
                            # Update existing columns set
                            existing_columns.add(missing_col)
                            # Retry the batch
                            i -= BATCH_SIZE  # Reset to retry this batch
                            break
                        except Exception as schema_error:
                            logger.error(f"Failed to add column {missing_col}: {str(schema_error)[:200]}")
                
                # If batch failed, try individual upserts
                if not batch_success:
                    for player in clean_batch:
                        player_id = player.get('external_player_id') or player.get('id', 'unknown')
                        try:
                            # Use 'id' as fallback if 'external_player_id' doesn't exist
                            conflict_column = 'external_player_id' if 'external_player_id' in player else 'id'
                            
                            # Use the Supabase client's async interface
                            table = self.supabase.table('nba_players')
                            query = table.upsert(player, on_conflict=conflict_column)
                            await asyncio.to_thread(query.execute)
                            successful_upserts += 1
                            logger.debug(f"Upserted player {player_id}")
                        except Exception as single_e:
                            self.total_errors += 1
                            logger.error(f"Failed to upsert player {player_id}: {str(single_e)[:200]}")
                            
                            # Log the problematic player data for debugging
                            if self.total_errors < 3:  # Only log first few errors to avoid spam
                                logger.debug(f"Problematic player data: {json.dumps(player, default=str, indent=2)}")
            
            # Add a small delay between batches to avoid rate limiting
            if i + BATCH_SIZE < total_players:
                await asyncio.sleep(1)  # 1s delay between batches
        
        # Log final results
        duration = time.time() - start_time
        logger.info(
            f"Sync completed: {successful_upserts}/{total_players} players processed "
            f"in {duration/60:.1f} minutes ({total_players/(duration+1e-6)*60:.1f} players/min)"
        )
        if self.total_errors > 0:
            logger.warning(f"Encountered {self.total_errors} errors during sync")
            
        return successful_upserts
    
    async def get_player_stats(self, player_id: str) -> Optional[Dict]:
        """Fetch stats for a specific player.
        
        Args:
            player_id: The internal MSF player ID
            
        Returns:
            Dict containing player stats or None if not found
        """
        try:
            # First, get the player details to find the NBA.com player ID
            player_endpoint = f"players/{player_id}.json"
            player_data = await self.fetch_data(player_endpoint)
            
            if not player_data or 'player' not in player_data or not player_data['player']:
                logger.warning(f"No player data found for ID {player_id}")
                return None
                
            # Find the NBA.com player ID from external mappings
            nba_com_id = None
            for mapping in player_data['player'].get('externalMappings', []):
                if mapping.get('source') == 'NBA.com':
                    nba_com_id = str(mapping.get('id'))
                    break
                    
            if not nba_com_id:
                logger.warning(f"No NBA.com ID found for player {player_id}")
                return None
                
            # Now get the stats using the NBA.com ID
            endpoint = f"players/{nba_com_id}/statistics.json"
            params = {
                "season": SEASON,
                "stats": "pts,reb,ast,stl,blk,fgp,ftp,tpp,gp,min,fgm,fga,fta,ftm,tpa,tpm,offReb,defReb,turnover,pf,plusMinus"
            }
            
            data = await self.fetch_data(endpoint, params)
            if not data or 'playerStatsTotals' not in data or not data['playerStatsTotals']:
                logger.warning(f"No stats found for player {player_id} (NBA.com ID: {nba_com_id})")
                return None
                
            # Get the most recent stats (usually the first item in the array)
            stats = data['playerStatsTotals'][0]
            
            # Extract the stats we care about
            player_stats = {
                'external_player_id': player_id,
                'games_played': stats.get('gamesPlayed'),
                'minutes': stats.get('minutes'),
                'points': stats.get('points'),
                'rebounds': stats.get('rebounds'),
                'assists': stats.get('assists'),
                'steals': stats.get('steals'),
                'blocks': stats.get('blockedShots'),
                'turnovers': stats.get('turnovers'),
                'field_goals_made': stats.get('fieldGoalsMade'),
                'field_goals_attempted': stats.get('fieldGoalsAttempted'),
                'field_goal_pct': stats.get('fieldGoalPercentage'),
                'three_point_made': stats.get('threePointFieldGoalsMade'),
                'three_point_attempted': stats.get('threePointFieldGoalsAttempted'),
                'three_point_pct': stats.get('threePointFieldGoalPercentage'),
                'free_throws_made': stats.get('freeThrowsMade'),
                'free_throws_attempted': stats.get('freeThrowsAttempted'),
                'free_throw_pct': stats.get('freeThrowPercentage'),
                'offensive_rebounds': stats.get('offensiveRebounds'),
                'defensive_rebounds': stats.get('defensiveRebounds'),
                'personal_fouls': stats.get('personalFouls'),
                'plus_minus': stats.get('plusMinus'),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
            return player_stats
            
        except Exception as e:
            logger.error(f"Error fetching stats for player {player_id}: {str(e)}")
            return None
    
    async def sync_player_stats_to_db(self, stats_list: List[Dict]) -> int:
        """Sync player statistics to the database.
        
        Args:
            stats_list: List of player stats dictionaries to sync
            
        Returns:
            int: Number of successfully synced player stats
        """
        if not stats_list:
            return 0
            
        logger.info(f"Preparing to sync {len(stats_list)} player stats to database...")
        
        # Ensure the schema is up to date and table exists
        table_ok = await self.ensure_player_stats_schema()
        if not table_ok:
            logger.error("Cannot sync player stats - nba_player_season_stats table does not exist or is not accessible")
            return 0
        
        # Prepare the data for upsert
        stats_to_upsert = []
        now = datetime.utcnow().isoformat()
        
        for stats in stats_list:
            if not stats or 'external_player_id' not in stats:
                logger.warning(f"Skipping invalid stats entry: {stats}")
                continue
                
            # Add timestamps
            stats['updated_at'] = now
            if 'created_at' not in stats:
                stats['created_at'] = now
                
            stats_to_upsert.append(stats)
        
        if not stats_to_upsert:
            logger.warning("No valid player stats to sync")
            return 0
            
        # Try to upsert in smaller batches first
        batch_size = 50  # Reduced batch size
        successful_upserts = 0
        
        for i in range(0, len(stats_to_upsert), batch_size):
            batch = stats_to_upsert[i:i + batch_size]
            logger.debug(f"Processing batch {i//batch_size + 1}/{(len(stats_to_upsert)-1)//batch_size + 1}")
            
            # Try batch upsert first
            try:
                result = await asyncio.to_thread(
                    lambda: self.supabase.table('nba_player_season_stats').upsert(
                        batch,
                        on_conflict='external_player_id'
                    ).execute()
                )
                
                if hasattr(result, 'data') and result.data:
                    successful_upserts += len(batch)
                    logger.debug(f"Upserted batch of {len(batch)} player stats")
                else:
                    raise Exception("No data returned from upsert")
                    
            except Exception as e:
                logger.warning(f"Batch upsert failed, falling back to individual upserts: {str(e)}")
                # Fall back to individual upserts
                for stat in batch:
                    try:
                        await asyncio.to_thread(
                            lambda s=stat: self.supabase.table('nba_player_season_stats').upsert(
                                s,
                                on_conflict='external_player_id'
                            ).execute()
                        )
                        successful_upserts += 1
                    except Exception as e2:
                        logger.error(f"Error upserting player stats for {stat.get('external_player_id')}: {str(e2)}")
                        
                        # If we get a column not found error, log it and continue
                        if "column \"" in str(e2).lower() and "\" does not exist" in str(e2).lower():
                            logger.warning(f"Schema mismatch. Please ensure the nba_player_season_stats table has all required columns.")
                            # Continue with the next record
        
        logger.info(f"Successfully synced {successful_upserts}/{len(stats_to_upsert)} player stats to database")
        return successful_upserts
    
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
            # If we get here, the table might not exist or we don't have permission
            logger.warning("nba_player_season_stats table doesn't exist. Attempting to create it...")
            
            try:
                # Create the table with the required schema
                create_table_sql = """
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
                CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_player_id ON nba_player_season_stats(external_player_id);
                """
                
                # Execute the SQL to create the table
                await asyncio.to_thread(
                    lambda: self.supabase.rpc('sql', {'query': create_table_sql}).execute()
                )
                
                logger.info("Successfully created nba_player_season_stats table")
                return True
                
            except Exception as create_error:
                logger.error(f"Failed to create nba_player_season_stats table: {str(create_error)}")
                logger.info("Please create the table manually with the following schema:")
                logger.info(
                    "CREATE TABLE IF NOT EXISTS nba_player_season_stats (\n"
                    "    external_player_id TEXT PRIMARY KEY REFERENCES nba_players(external_player_id),\n"
                    "    games_played INTEGER,\n"
                    "    minutes NUMERIC,\n"
                    "    points NUMERIC,\n"
                    "    rebounds NUMERIC,\n"
                    "    assists NUMERIC,\n"
                    "    steals NUMERIC,\n"
                    "    blocks NUMERIC,\n"
                    "    turnovers NUMERIC,\n"
                    "    field_goals_made NUMERIC,\n"
                    "    field_goals_attempted NUMERIC,\n"
                    "    field_goal_pct NUMERIC,\n"
                "    three_point_made NUMERIC,\n"
                "    three_point_attempted NUMERIC,\n"
                "    three_point_pct NUMERIC,\n"
                "    free_throws_made NUMERIC,\n"
                "    free_throws_attempted NUMERIC,\n"
                "    free_throw_pct NUMERIC,\n"
                "    offensive_rebounds NUMERIC,\n"
                "    defensive_rebounds NUMERIC,\n"
                "    personal_fouls NUMERIC,\n"
                "    plus_minus NUMERIC,\n"
                "    last_updated TIMESTAMPTZ DEFAULT NOW(),\n"
                "    created_at TIMESTAMPTZ DEFAULT NOW(),\n"
                "    updated_at TIMESTAMPTZ DEFAULT NOW()\n"
                ");\n"
                "CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_player_id ON nba_player_season_stats(external_player_id);"
            )
            logger.error(f"Error: {str(e)}")
            return False
    
    async def run(self):
        """Run the NBA data synchronization."""
        logger.info("Starting NBA data synchronization...")
        start_time = datetime.now()
        
        try:
            # Fetch all players
            logger.info("Fetching players...")
            players_data = await self.get_players()
            
            if not players_data:
                logger.error("No player data fetched")
                return
                
            logger.info(f"Successfully fetched {len(players_data)} players")
            
            # Process players
            processed_players = []
            for player_data in players_data:
                try:
                    processed = self.process_player(player_data)
                    if processed:
                        processed_players.append(processed)
                except Exception as e:
                    logger.error(f"Error processing player: {str(e)}")
                    continue
            
            logger.info(f"Processed {len(processed_players)} players")
            
            if not processed_players:
                logger.warning("No players to sync")
                return
            
            # Sync players to database
            await self.sync_players_to_db(processed_players)
            
            # Fetch and sync player stats if enabled
            if self.sync_player_stats:
                logger.info("Starting player stats synchronization...")
                stats_start_time = time.time()
                
                try:
                    # Get all player IDs from the database
                    result = await asyncio.to_thread(
                        lambda: self.supabase.table('nba_players')
                        .select('external_player_id')
                        .execute()
                    )
                    
                    player_ids = [player['external_player_id'] for player in result.data]
                    total_players = len(player_ids)
                    
                    if not player_ids:
                        logger.warning("No player IDs found in the database. Skipping stats sync.")
                        return
                    
                    logger.info(f"Fetching stats for {total_players} players...")
                    
                    # Check if we can access the nba_player_season_stats table
                    try:
                        await asyncio.to_thread(
                            lambda: self.supabase.table('nba_player_season_stats').select('*').limit(1).execute()
                        )
                    except Exception as e:
                        logger.error(f"Cannot access nba_player_season_stats table. Please create it first. Error: {str(e)}")
                        logger.info("Skipping player stats sync.")
                        return
                    
                    # Fetch and sync stats for each player with rate limiting
                    stats_list = []
                    processed = 0
                    
                    # Process players in batches to show progress
                    for i in range(0, total_players, 10):  # Process 10 players at a time for better progress tracking
                        batch = player_ids[i:i+10]
                        
                        # Process each player in the batch
                        for player_id in batch:
                            try:
                                stats = await self.get_player_stats(player_id)
                                if stats:
                                    stats_list.append(stats)
                                    
                                    # Sync in smaller batches to avoid timeouts
                                    if len(stats_list) >= 20:  # Smaller batch size
                                        await self.sync_player_stats_to_db(stats_list)
                                        stats_list = []
                                
                                processed += 1
                                
                                # Show progress every 10 players or at the end
                                if processed % 10 == 0 or processed == total_players:
                                    elapsed = time.time() - stats_start_time
                                    items_per_second = processed / (elapsed + 1e-6)
                                    remaining = total_players - processed
                                    eta_seconds = remaining / items_per_second if items_per_second > 0 else 0
                                    
                                    logger.info(
                                        f"Processed {processed}/{total_players} players "
                                        f"({processed/max(1, total_players)*100:.1f}%) - "
                                        f"ETA: {eta_seconds/60:.1f} min"
                                    )
                            
                            except Exception as e:
                                logger.error(f"Error processing player {player_id}: {str(e)}")
                                continue
                            
                            # Add delay to respect rate limits (1.1 seconds between requests)
                            await asyncio.sleep(1.1)
                    
                    # Sync any remaining stats
                    if stats_list:
                        await self.sync_player_stats_to_db(stats_list)
                    
                    total_time = (time.time() - stats_start_time) / 60
                    logger.info(
                        f"Player stats sync completed in {total_time:.1f} minutes. "
                        f"Processed {processed}/{total_players} players."
                    )
                
                except Exception as e:
                    logger.error(f"Error during player stats sync: {str(e)}")
                    import traceback
                    logger.error(traceback.format_exc())
                    logger.error("Player stats sync failed. Please check the logs and try again.")
        
        except Exception as e:
            logger.error(f"Error during NBA data sync: {str(e)}", exc_info=True)
            raise
                
        finally:
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"Sync completed in {duration/60:.1f} minutes")

async def fetch_data(self, url: str, params: Optional[Dict] = None, max_retries: int = 5) -> Optional[Dict]:
    """Fetch data from the API with retry logic and rate limiting."""
    retry_delay = 3  # Start with 3 seconds delay
        
    # Enforce minimum delay between requests
    if hasattr(self, '_last_request_time'):
        elapsed = time.time() - self._last_request_time
        if elapsed < 1.5:  # Enforce at least 1.5s between requests
            await asyncio.sleep(1.5 - elapsed)
        
    for attempt in range(max_retries):
        try:
            self._last_request_time = time.time()
                
            # Add timeout to the request
            response = await self.client.get(url, params=params, timeout=30.0)
            response.raise_for_status()
                
            # Add a small delay after each successful request
            await asyncio.sleep(0.5)
                
            return response.json()
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Too Many Requests
                retry_after = int(e.response.headers.get('Retry-After', retry_delay))
                retry_after = max(retry_after, 5)  # Minimum 5 second wait on rate limit
                logger.warning(f"Rate limited. Retry {attempt + 1}/{max_retries} in {retry_after}s. URL: {url}")
                await asyncio.sleep(retry_after)
                retry_delay = min(retry_delay * 2, 120)  # Exponential backoff, max 120s
            else:
                logger.error(f"HTTP error {e.response.status_code} for {url}: {e.response.text}")
                if attempt == max_retries - 1:
                    return None
                await asyncio.sleep(retry_delay)
                    
        except (httpx.RequestError, asyncio.TimeoutError) as e:
            logger.error(f"Request error for {url}: {str(e)}")
            if attempt == max_retries - 1:
                return None
            await asyncio.sleep(retry_delay)
                
        except Exception as e:
            logger.error(f"Unexpected error fetching {url}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            if attempt == max_retries - 1:
                return None
            await asyncio.sleep(retry_delay)

async def main():
    """Main entry point for the script."""
    try:
        async with NBADataSync() as sync:
            await sync.run()
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    asyncio.run(main())

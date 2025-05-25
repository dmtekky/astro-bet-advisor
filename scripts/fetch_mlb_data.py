#!/usr/bin/env python3
"""
Fetch MLB teams, player rosters, 2025 player stats, and 2025 game data (including odds)
from SportsData.io and upsert into Supabase.
"""
import os
import sys
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

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
SPORTSDATA_API_KEY = os.getenv('SPORTSDATA_MLB_KEY') # Use MLB specific key
BASE_URL = "https://api.sportsdata.io/v3/mlb"
SCORES_BASE_URL = f"{BASE_URL}/scores/json"
STATS_BASE_URL = f"{BASE_URL}/stats/json"

SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY") # For backend scripts, SERVICE_ROLE_KEY is often preferred

TARGET_SEASON = 2025
MLB_LEAGUE_EXTERNAL_ID = 1 # Assuming 1 is the common external_id for MLB
MLB_LEAGUE_NAME = "MLB"

if not SPORTSDATA_API_KEY or SPORTSDATA_API_KEY == 'your_sportsdata_api_key_here':
    logger.error("❌ Please set SPORTSDATA_MLB_KEY in your .env file")
    sys.exit(1)
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("❌ Please set PUBLIC_SUPABASE_URL and VITE_SUPABASE_KEY (or SERVICE_ROLE_KEY) in your .env file")
    sys.exit(1)

class SportsDataClient:
    """Client for interacting with the SportsData.io API."""
    def __init__(self, api_key: str):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={'Ocp-Apim-Subscription-Key': api_key, 'User-Agent': 'AstroBetAdvisor/1.0'}
        )

    async def get_all_teams(self) -> List[Dict[str, Any]]:
        url = f"{SCORES_BASE_URL}/AllTeams"
        logger.info(f"Fetching all MLB teams from API...")
        return await self._make_request(url)

    async def get_team_roster(self, team_key: str) -> List[Dict[str, Any]]:
        url = f"{SCORES_BASE_URL}/Players/{team_key.upper()}"
        logger.info(f"Fetching roster for team API key: {team_key}")
        return await self._make_request(url)

    async def get_player_season_stats(self, season: int) -> List[Dict[str, Any]]:
        url = f"{STATS_BASE_URL}/PlayerSeasonStats/{season}"
        logger.info(f"Fetching player season stats for {season} from API...")
        return await self._make_request(url)

    async def get_games_for_season(self, season: int) -> List[Dict[str, Any]]:
        url = f"{SCORES_BASE_URL}/Games/{season}"
        logger.info(f"Fetching games for season {season} from API...")
        return await self._make_request(url)

    async def _make_request(self, url: str) -> Optional[List[Dict[str, Any]]]:
        try:
            response = await self.session.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error for {url}: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 401:
                logger.error("❌ Invalid API key. Please check your SPORTSDATA_MLB_KEY in .env")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Request failed for {url}: {e}")
            return None

    async def close(self):
        await self.session.aclose()

async def get_or_create_league(supabase: Client, league_name: str, external_id: int) -> Optional[str]:
    """Get existing league_id or create it if not found."""
    try:
        result = supabase.table("leagues").select("id").eq("external_id", external_id).execute()
        if result.data:
            logger.info(f"Found existing league '{league_name}' with external_id {external_id}.")
            return result.data[0]["id"]
        else:
            logger.info(f"League '{league_name}' not found, creating...")
            insert_data = {"name": league_name, "abbreviation": league_name, "sport": "baseball", "external_id": external_id}
            result = supabase.table("leagues").insert(insert_data).execute()
            if result.data:
                logger.info(f"Created league '{league_name}'.")
                return result.data[0]["id"]
            else:
                logger.error(f"Failed to create league '{league_name}'. Error: {result.error}")
                return None
    except Exception as e:
        logger.exception(f"Error in get_or_create_league for '{league_name}': {e}")
        return None

def prepare_team_for_db(team_api_data: Dict[str, Any], league_id: str) -> Dict[str, Any]:
    """Prepare team data for insertion into the database.
    Only includes essential fields that are guaranteed to exist in the database.
    """
    # Only include the most basic fields that are guaranteed to exist
    return {
        "external_id": team_api_data.get("TeamID"),
        "league_id": league_id,
        "name": team_api_data.get("Name"),
        "city": team_api_data.get("City"),
        "abbreviation": team_api_data.get("Key"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

def prepare_player_for_db(player_api_data: Dict[str, Any], team_supabase_id: str) -> Dict[str, Any]:
    """Prepare player data for database insertion with only essential fields."""
    # Start with the most essential fields that should always be present
    player_data = {
        "external_id": player_api_data.get("PlayerID"),
        "team_id": team_supabase_id,
        "first_name": player_api_data.get("FirstName"),
        "last_name": player_api_data.get("LastName"),
        "position": player_api_data.get("Position"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Add optional fields only if they exist in the API response
    optional_fields = [
        "status", "position_category", "jersey_number", "height", "weight",
        "birth_date", "birth_city", "birth_state", "birth_country", "photo_url"
    ]
    
    for field in optional_fields:
        if field in player_api_data:
            player_data[field] = player_api_data[field]
            
    return player_data

def prepare_player_season_stats_for_db(stats_api_data: Dict[str, Any], player_supabase_id: str, season: int, team_supabase_id: str) -> Dict[str, Any]:
    """Prepare player season stats for database insertion with only essential fields."""
    # Start with the essential fields
    stats_data = {
        "player_id": player_supabase_id,
        "team_id": team_supabase_id,
        "season": season,
        "external_player_id": stats_api_data.get("PlayerID"),
        "external_team_id": stats_api_data.get("TeamID"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Add batting stats if they exist
    batting_stats = [
        "games_played", "at_bats", "runs", "hits", "doubles", "triples",
        "home_runs", "runs_batted_in", "batting_average", "slugging_percentage",
        "on_base_percentage", "on_base_plus_slugging", "stolen_bases",
        "walks", "strikeouts"
    ]
    
    for stat in batting_stats:
        if stat in stats_api_data:
            stats_data[stat] = stats_api_data[stat]
    
    # Add pitching stats if they exist
    pitching_stats = [
        "wins", "losses", "earned_run_average", "saves", "innings_pitched",
        "pitching_strikeouts", "walks_hits_per_inning_pitched"
    ]
    
    for stat in pitching_stats:
        if stat in stats_api_data:
            stats_data[stat] = stats_api_data[stat]
    
    return stats_data

def prepare_game_for_db(game_api_data: Dict[str, Any], league_id: str, 
                        home_team_supabase_id: str, away_team_supabase_id: str, season: int) -> Dict[str, Any]:
    game_datetime_utc_str = game_api_data.get("DateTimeUTC") or game_api_data.get("DateTime")
    game_datetime_utc = None
    if game_datetime_utc_str:
        try:
            game_datetime_utc = datetime.strptime(game_datetime_utc_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            logger.warning(f"Could not parse game datetime: {game_datetime_utc_str} for game {game_api_data.get('GameID')}")

    return {
        "external_id": game_api_data.get("GameID"),
        "league_id": league_id,
        "season": season,
        "season_type": str(game_api_data.get("SeasonType", "")).lower(), # e.g. 1 for regular, 2 for pre, 3 for post
        "game_date": game_datetime_utc.date().isoformat() if game_datetime_utc else None,
        "game_time_utc": game_datetime_utc.isoformat() if game_datetime_utc else None,
        "status": game_api_data.get("Status").lower() if game_api_data.get("Status") else None,
        "home_team_id": home_team_supabase_id,
        "away_team_id": away_team_supabase_id,
        "home_score": game_api_data.get("HomeTeamRuns"),
        "away_score": game_api_data.get("AwayTeamRuns"),
        "home_odds": game_api_data.get("HomeTeamMoneyLine"),
        "away_odds": game_api_data.get("AwayTeamMoneyLine"),
        "over_under": game_api_data.get("OverUnder"),
        "spread": game_api_data.get("PointSpread"),
        "attendance": game_api_data.get("Attendance"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        # Add more fields as needed, e.g., venue, period, etc.
    }

async def upsert_data_to_supabase(supabase: Client, table_name: str, data: List[Dict[str, Any]], 
                                on_conflict_columns: Optional[str] = None, chunk_size: int = 200) -> List[Dict[str, Any]]:
    """
    Insert or update data in Supabase in chunks.
    
    Args:
        supabase: Supabase client
        table_name: Name of the table to upsert to
        data: List of dictionaries representing rows to upsert
        on_conflict_columns: Comma-separated string of column names for conflict resolution (not used)
        chunk_size: Number of rows to process in each chunk
        
    Returns:
        List of all inserted/updated rows
    """
    if not data:
        return []
        
    all_processed_data = []
    
    # Process data in chunks to avoid overwhelming the database
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        logger.debug(f"Processing chunk {i//chunk_size + 1}/{(len(data)-1)//chunk_size + 1} with {len(chunk)} items")
        
        for row in chunk:
            try:
                # First, try to update existing record
                if 'external_id' in row and row['external_id'] is not None:
                    # Check if record exists
                    result = supabase.table(table_name).select('*').eq('external_id', row['external_id']).execute()
                    
                    if hasattr(result, 'data') and result.data:
                        # Record exists, update it
                        update_data = {k: v for k, v in row.items() if k != 'external_id'}
                        result = supabase.table(table_name).update(update_data).eq('external_id', row['external_id']).execute()
                        if hasattr(result, 'data') and result.data:
                            all_processed_data.extend(result.data)
                            continue
                
                # If we get here, either the record doesn't exist or we couldn't update it
                # So try to insert a new record
                result = supabase.table(table_name).insert(row).execute()
                if hasattr(result, 'data') and result.data:
                    all_processed_data.extend(result.data)
                
            except Exception as e:
                logger.error(f"Error processing row in {table_name}: {e}")
                logger.debug(f"Problematic row data: {row}")
    
    logger.info(f"Finished processing {len(all_processed_data)} rows in '{table_name}'.")
    return all_processed_data

async def main():
    logger.info(f"""
    ======================================================================
    Starting MLB Data Sync for Season {TARGET_SEASON}
    ======================================================================""")

    # Initialize clients
    client = None
    try:
        client = SportsDataClient(SPORTSDATA_API_KEY)
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Get or create MLB league
        league_id = await get_or_create_league(supabase, MLB_LEAGUE_NAME, MLB_LEAGUE_EXTERNAL_ID)
        if not league_id:
            logger.error("❌ Failed to get or create league. Exiting.")
            return

        # Fetch and upsert all teams
        logger.info("Fetching all MLB teams...")
        teams = await client.get_all_teams()
        if not teams:
            logger.error("❌ Failed to fetch teams. Exiting.")
            return

        # Process teams
        logger.info(f"Processing {len(teams)} teams...")
        
        # Prepare team data for database
        team_data = [prepare_team_for_db(team, league_id) for team in teams]
        
        # Upsert teams to Supabase
        upserted_teams = await upsert_data_to_supabase(
            supabase, 
            'teams', 
            team_data,
            on_conflict_columns='external_id',
            chunk_size=50
        )
        
        # After upserting, fetch the teams to get their Supabase IDs
        team_key_to_id = {}
        for team in teams:
            team_id = team.get('TeamID')
            if team_id:
                try:
                    # Query the team by external_id to get the Supabase ID
                    result = supabase.table('teams').select('id, external_id').eq('external_id', team_id).execute()
                    if result.data and len(result.data) > 0:
                        team_key_to_id[str(team_id)] = result.data[0]['id']
                except Exception as e:
                    logger.error(f"Error fetching team ID for team {team_id}: {e}")
        
        logger.info(f"Successfully processed {len(team_key_to_id)} teams in Supabase.")
        logger.debug(f"Team ID mapping: {team_key_to_id}")
        
        # Initialize player_key_to_id at the beginning
        player_key_to_id = {}
        
        # First pass: Collect all player data
        all_player_data = []
        team_roster_data = {}
        
        for team in teams:
            team_key = team.get("Key")
            team_supabase_id = team_key_to_id.get(str(team.get("TeamID")))
            
            if not team_supabase_id:
                logger.warning(f"Skipping roster for team with API Key {team_key} due to missing Supabase ID.")
                continue
                
            team_name = f"{team.get('City', '')} {team.get('Name', '')}".strip()
            logger.info(f"Fetching roster for team: {team_name} ({team_key})")
            
            roster = await client.get_team_roster(team_key)
            if not roster:
                logger.warning(f"No roster data for team {team_key}")
                continue
                
            logger.info(f"{team_name} Roster (Total: {len(roster)} players)")
            
            # Prepare player data and store with team info
            for player in roster:
                player_data = prepare_player_for_db(player, team_supabase_id)
                all_player_data.append(player_data)
                # Store team association for stats
                if player.get('PlayerID'):
                    team_roster_data[str(player['PlayerID'])] = team_supabase_id
        
        # Upsert all players in batches
        logger.info(f"Upserting {len(all_player_data)} total players...")
        for i in range(0, len(all_player_data), 100):
            chunk = all_player_data[i:i+100]
            result = await upsert_data_to_supabase(
                supabase,
                "players",
                chunk,
                on_conflict_columns="external_id"
            )
            
            # Update the mapping with the returned IDs
            if result:
                for player in result:
                    if player.get('external_id') and player.get('id'):
                        player_key_to_id[str(player['external_id'])] = player['id']
        
        logger.info(f"Successfully processed {len(player_key_to_id)} players")
        
        # Fetch and upsert player season stats
        logger.info("\nFetching player season stats...")
        player_stats = await client.get_player_season_stats(TARGET_SEASON)
        
        if player_stats:
            # Prepare player stats data
            stats_data = []
            for stat in player_stats:
                player_supabase_id = player_key_to_id.get(str(stat.get("PlayerID"))) if player_key_to_id else None
                team_supabase_id = team_key_to_id.get(str(stat.get("TeamID"))) if team_key_to_id else None
                
                if player_supabase_id and team_supabase_id:
                    stats_data.append(prepare_player_season_stats_for_db(
                        stat, player_supabase_id, TARGET_SEASON, team_supabase_id
                    ))
            
            # Upsert player stats in chunks
            logger.info(f"Upserting {len(stats_data)} player season stats...")
            for i in range(0, len(stats_data), 100):
                chunk = stats_data[i:i+100]
                await upsert_data_to_supabase(
                    supabase,
                    "player_season_stats",
                    chunk,
                    on_conflict_columns="player_id,season,team_id"
                )
            
            logger.info(f"Successfully upserted {len(stats_data)} player season stats.")
        
        # Fetch and upsert games for the season
        logger.info("\nFetching games for the season...")
        games = await client.get_games_for_season(TARGET_SEASON)
        
        if games:
            logger.info(f"Found {len(games)} games for the {TARGET_SEASON} season.")
            
            # Log sample game data to verify odds
            if games:
                sample_game = games[0]
                logger.info(f"Sample game data structure: {json.dumps({k: v for k, v in sample_game.items() if 'odds' in str(k).lower() or 'moneyline' in str(k).lower() or 'spread' in str(k).lower() or 'total' in str(k).lower() or 'over' in str(k).lower() or 'under' in str(k).lower()}, indent=2)}")
            
            # Prepare game data
            game_data = []
            games_with_odds = 0
            
            for game in games:
                home_team_id = team_key_to_id.get(str(game.get("HomeTeamID"))) if team_key_to_id else None
                away_team_id = team_key_to_id.get(str(game.get("AwayTeamID"))) if team_key_to_id else None
                
                if home_team_id and away_team_id:
                    game_entry = prepare_game_for_db(game, league_id, home_team_id, away_team_id, TARGET_SEASON)
                    
                    # Check if odds data exists
                    if any(game_entry.get(field) is not None for field in ['home_odds', 'away_odds', 'over_under', 'spread']):
                        games_with_odds += 1
                        
                    game_data.append(game_entry)
            
            # Upsert games in chunks
            logger.info(f"Upserting {len(game_data)} games ({games_with_odds} with odds data)...")
            for i in range(0, len(game_data), 100):
                chunk = game_data[i:i+100]
                await upsert_data_to_supabase(
                    supabase,
                    "games",
                    chunk,
                    on_conflict_columns="external_id"
                )
            
            logger.info(f"Successfully upserted {len(game_data)} games ({games_with_odds} with odds data).")
        
        logger.info("\n✅ Data sync completed successfully!")
        
    except Exception as e:
        logger.exception(f"Error in main: {e}")
    finally:
        if client:
            await client.close()
        logger.info("Script completed")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

#!/usr/bin/env python3
"""
Fetch NBA teams, player rosters, 2025 player stats, and 2025 game data (including odds)
from SportsData.io and upsert into Supabase NBA-specific tables.
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
from pathlib import Path

# Determine the project root directory (one level up from 'scripts')
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env'
logger.info(f"Attempting to load .env from: {dotenv_path}")
load_dotenv(dotenv_path=dotenv_path, override=True)

# MySportsFeeds API config
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')
MSF_BASE_URL = 'https://api.mysportsfeeds.com/v2.1/pull/nba'
SEASON = '2024-2025-regular'

# Constants
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("PUBLIC_SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("❌ Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY in your .env file")
    sys.exit(1)

# --- Fetch NBA Teams & Stats ---
async def fetch_nba_teams():
    url = f"{MSF_BASE_URL}/{SEASON}/team_stats_totals.json"
    async with httpx.AsyncClient(auth=(MSF_API_KEY, MSF_PASSWORD)) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        return data['teamStatsTotals']

# --- Fetch NBA Players ---
async def fetch_nba_players():
    """Fetch NBA players with detailed information including stats."""
    all_players = []
    
    # First, get the basic player list
    url = f"{MSF_BASE_URL}/players.json?season={SEASON}"
    try:
        async with httpx.AsyncClient(auth=(MSF_API_KEY, MSF_PASSWORD), timeout=30.0) as client:
            # Get player list first
            logger.info("Fetching NBA players list...")
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            players = data.get('players', [])
            
            # Fetch detailed stats for each player
            for i, player in enumerate(players):
                try:
                    player_id = player['player']['id']
                    logger.info(f"Fetching stats for player {i+1}/{len(players)}: {player_id}")
                    
                    # Get player game logs for the season
                    stats_url = f"{MSF_BASE_URL}/players/{player_id}/player_gamelogs.json?season={SEASON}"
                    stats_resp = await client.get(stats_url)
                    
                    if stats_resp.status_code == 200:
                        stats_data = stats_resp.json()
                        # Add stats to player data
                        if 'gamelogs' in stats_data and stats_data['gamelogs']:
                            # Calculate some basic stats
                            games = stats_data['gamelogs']
                            total_points = sum(g.get('stats', {}).get('points', {}).get('decimalValue', 0) for g in games)
                            total_rebounds = sum(g.get('stats', {}).get('rebounds', {}).get('decimalValue', 0) for g in games)
                            total_assists = sum(g.get('stats', {}).get('assists', {}).get('decimalValue', 0) for g in games)
                            
                            # Add calculated stats to player
                            player['stats'] = {
                                'games_played': len(games),
                                'points_per_game': round(total_points / len(games), 1) if games else 0,
                                'rebounds_per_game': round(total_rebounds / len(games), 1) if games else 0,
                                'assists_per_game': round(total_assists / len(games), 1) if games else 0,
                                'total_points': total_points,
                                'total_rebounds': total_rebounds,
                                'total_assists': total_assists
                            }
                    
                    all_players.append(player)
                    
                    # Be nice to the API
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"Error fetching stats for player {player_id}: {str(e)}")
                    # Still add the player even if stats fetch fails
                    all_players.append(player)
                    continue
                    
    except Exception as e:
        logger.error(f"Error in fetch_nba_players: {str(e)}")
        return []
    
    logger.info(f"Fetched {len(all_players)} NBA players with stats")
    return all_players

# --- Helper: Prepare teams for upsert ---
def prepare_team_rows(team_stats_totals):
    teams = []
    for entry in team_stats_totals:
        team = entry['team']
        teams.append({
            'external_team_id': str(team['id']),
            'abbreviation': team.get('abbreviation'),
            'city': team.get('city'),
            'name': team.get('name'),
            'conference': team.get('conference'),
            'division': team.get('division'),
            'logo_url': team.get('officialLogoImageSrc')
        })
    return teams

# --- Helper: Prepare players for upsert ---
def prepare_player_rows(players):
    """Prepare player data for database insertion with enhanced fields."""
    player_rows = []
    
    for p in players:
        try:
            player = p.get('player', {})
            team = player.get('currentTeam', {}) or player.get('team', {}) or {}
            stats = p.get('stats', {})  # Stats we calculated earlier
            
            # Handle height conversion (if needed)
            height = player.get('height')
            if isinstance(height, str) and '"' in height:
                # Convert from format like "6' 8"" to inches
                try:
                    feet, inches = height.replace('"', '').split("'")
                    height = int(feet) * 12 + int(inches.strip() or 0)
                except (ValueError, AttributeError):
                    height = None
            
            # Handle weight (remove 'lbs' if present)
            weight = player.get('weight')
            if isinstance(weight, str) and 'lbs' in weight:
                weight = weight.replace('lbs', '').strip()
            
            # Calculate age from birth date if available
            age = None
            birth_date = player.get('birthDate')
            if birth_date:
                try:
                    birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
                    today = datetime.now()
                    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                except (ValueError, TypeError):
                    pass
            
            # Prepare the player row with all fields
            player_row = {
                # Core identification
                'external_player_id': int(player.get('id', 0)) or None,
                'first_name': player.get('firstName', '').strip(),
                'last_name': player.get('lastName', '').strip(),
                'full_name': f"{player.get('firstName', '').strip()} {player.get('lastName', '').strip()}".strip(),
                'team_id': str(team.get('id')) if team and 'id' in team else None,
                
                # Personal info
                'primary_position': player.get('primaryPosition'),
                'jersey_number': player.get('jerseyNumber'),
                'birth_date': birth_date.isoformat() if isinstance(birth_date, datetime) else birth_date,
                'birth_city': player.get('birthCity'),
                'birth_country': player.get('birthCountry'),
                'birth_state': player.get('birthState'),
                'height': height,
                'weight': weight,
                'college': player.get('college'),
                'rookie': bool(player.get('rookie', False)),
                'active': bool(player.get('active', False)),
                'status': player.get('status'),
                'experience': player.get('experience'),
                'age': age,
                
                # Media
                'photo_url': player.get('photoUrl') or f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player.get('id')}.png",
                
                # Stats (from our earlier calculation)
                'games_played': stats.get('games_played', 0),
                'points_per_game': stats.get('points_per_game', 0.0),
                'rebounds_per_game': stats.get('rebounds_per_game', 0.0),
                'assists_per_game': stats.get('assists_per_game', 0.0),
                'total_points': stats.get('total_points', 0),
                'total_rebounds': stats.get('total_rebounds', 0),
                'total_assists': stats.get('total_assists', 0),
                
                # Timestamps
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'last_synced': datetime.now(timezone.utc).isoformat(),
                
                # Additional metadata
                'draft_year': player.get('draft', {}).get('year') if isinstance(player.get('draft'), dict) else None,
                'draft_round': player.get('draft', {}).get('round') if isinstance(player.get('draft'), dict) else None,
                'draft_pick': player.get('draft', {}).get('pick') if isinstance(player.get('draft'), dict) else None,
                'draft_team': player.get('draft', {}).get('team', {}).get('abbreviation') if isinstance(player.get('draft'), dict) else None,
            }
            
            # Remove None values
            player_row = {k: v for k, v in player_row.items() if v is not None}
            player_rows.append(player_row)
            
        except Exception as e:
            logger.error(f"Error preparing player row: {str(e)}")
            continue
            
    logger.info(f"Prepared {len(player_rows)} player rows for database")
    return player_rows

# --- Helper: Upsert to Supabase ---
def upsert_to_supabase(supabase, table, data, unique_cols):
    if not data:
        logger.warning(f"No data to upsert for {table}")
        return
    try:
        res = supabase.table(table).upsert(data, on_conflict=unique_cols).execute()
        logger.info(f"Upserted {len(data)} rows into {table}")
    except Exception as e:
        logger.error(f"Failed to upsert {table}: {e}")

    async def close(self):
        await self.session.aclose()

async def get_or_create_league(supabase: Client, league_name: str, external_id: int, sport_name: str) -> Optional[str]:
    """Get existing league_id or create it if not found."""
    try:
        result = supabase.table("leagues").select("id").eq("external_id", external_id).eq("name", league_name).execute()
        if result.data:
            logger.info(f"Found existing league '{league_name}' with external_id {external_id}.")
            return result.data[0]["id"]
        else:
            logger.info(f"League '{league_name}' not found, creating...")
            insert_data = {"name": league_name, "abbreviation": league_name.upper(), "sport": sport_name, "external_id": external_id}
            result = supabase.table("leagues").insert(insert_data).execute()
            if result.data:
                logger.info(f"Created league '{league_name}'.")
                return result.data[0]["id"]
            else:
                error_message = result.error.message if result.error and hasattr(result.error, 'message') else 'Unknown error'
                logger.error(f"Failed to create league '{league_name}'. Error: {error_message}")
                return None
    except Exception as e:
        logger.exception(f"Error in get_or_create_league for '{league_name}': {e}")
        return None

def prepare_team_for_db(team_api_data: Dict[str, Any], league_id: str) -> Dict[str, Any]:
    """Prepare NBA team data for insertion into the nba_teams table."""
    return {
        "external_id": team_api_data.get("TeamID"), 
        "league_id": league_id, 
        "name": team_api_data.get("Name"),
        "city": team_api_data.get("City"),
        "abbreviation": team_api_data.get("Key"), 
        "conference": team_api_data.get("Conference"),
        "division": team_api_data.get("Division"),
        "primary_color": team_api_data.get("PrimaryColor"),
        "secondary_color": team_api_data.get("SecondaryColor"),
        "tertiary_color": team_api_data.get("TertiaryColor"),
        "wikipedia_logo_url": team_api_data.get("WikipediaLogoUrl"),
        "stadium_id": team_api_data.get("StadiumID"), 
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

def prepare_player_for_db(player_api_data: Dict[str, Any], team_supabase_id: str) -> Dict[str, Any]:
    """Prepare NBA player data for nba_players table."""
    player_data = {
        "external_id": player_api_data.get("PlayerID"),
        "team_id": team_supabase_id, 
        "first_name": player_api_data.get("FirstName"),
        "last_name": player_api_data.get("LastName"),
        "position": player_api_data.get("Position"),
        "status": player_api_data.get("Status"),
        "jersey_number": player_api_data.get("Jersey"),
        "height": player_api_data.get("Height"),
        "weight": player_api_data.get("Weight"),
        "birth_date": player_api_data.get("BirthDate"),
        "birth_city": player_api_data.get("BirthCity"),
        "birth_state": player_api_data.get("BirthState"),
        "birth_country": player_api_data.get("BirthCountry"),
        "photo_url": player_api_data.get("PhotoUrl"),
        "experience": player_api_data.get("Experience"),
        "college": player_api_data.get("College"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    return {k: v for k, v in player_data.items() if v is not None} # Filter out None values

def prepare_player_season_stats_for_db(stats_api_data: Dict[str, Any], player_supabase_id: str, season: int, team_supabase_id: str) -> Dict[str, Any]:
    """Prepare NBA player season stats for nba_player_season_stats table."""
    stats_data = {
        "player_id": player_supabase_id, 
        "team_id": team_supabase_id, 
        "season": season,
        "external_player_id": stats_api_data.get("PlayerID"),
        "external_team_id": stats_api_data.get("TeamID"),
        "name": stats_api_data.get("Name"), # Often included in stats responses
        "team_abbreviation": stats_api_data.get("Team"),
        "games_played": stats_api_data.get("Games"),
        "minutes_played": stats_api_data.get("Minutes"),
        "field_goals_made": stats_api_data.get("FieldGoalsMade"),
        "field_goals_attempted": stats_api_data.get("FieldGoalsAttempted"),
        "field_goal_percentage": stats_api_data.get("FieldGoalsPercentage"),
        "three_pointers_made": stats_api_data.get("ThreePointersMade"),
        "three_pointers_attempted": stats_api_data.get("ThreePointersAttempted"),
        "three_pointer_percentage": stats_api_data.get("ThreePointersPercentage"),
        "free_throws_made": stats_api_data.get("FreeThrowsMade"),
        "free_throws_attempted": stats_api_data.get("FreeThrowsAttempted"),
        "free_throw_percentage": stats_api_data.get("FreeThrowsPercentage"),
        "offensive_rebounds": stats_api_data.get("OffensiveRebounds"),
        "defensive_rebounds": stats_api_data.get("DefensiveRebounds"),
        "rebounds": stats_api_data.get("Rebounds"),
        "assists": stats_api_data.get("Assists"),
        "steals": stats_api_data.get("Steals"),
        "blocks": stats_api_data.get("BlockedShots"),
        "turnovers": stats_api_data.get("Turnovers"),
        "personal_fouls": stats_api_data.get("PersonalFouls"),
        "points": stats_api_data.get("Points"),
        "plus_minus": stats_api_data.get("PlusMinus"),
        "double_doubles": stats_api_data.get("DoubleDoubles"),
        "triple_doubles": stats_api_data.get("TripleDoubles"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    return {k: v for k, v in stats_data.items() if v is not None} # Filter out None values

def prepare_game_for_db(game_api_data: Dict[str, Any], league_id: str, 
                        home_team_supabase_id: str, away_team_supabase_id: str, season: int) -> Dict[str, Any]:
    """Prepare NBA game data for nba_games table."""
    game_datetime_utc_str = game_api_data.get("DateTimeUTC") or game_api_data.get("DateTime")
    game_datetime_utc = None
    if game_datetime_utc_str:
        try:
            game_datetime_utc = datetime.strptime(game_datetime_utc_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            logger.warning(f"Could not parse game datetime: {game_datetime_utc_str}")

    game_data = {
        "external_id": game_api_data.get("GameID"),
        "league_id": league_id,
        "season": season,
        "game_day": game_datetime_utc.date().isoformat() if game_datetime_utc else None,
        "game_time_utc": game_datetime_utc.isoformat() if game_datetime_utc else None,
        "status": game_api_data.get("Status"),
        "home_team_id": home_team_supabase_id,
        "away_team_id": away_team_supabase_id,
        "home_team_score": game_api_data.get("HomeTeamScore"),
        "away_team_score": game_api_data.get("AwayTeamScore"),
        "stadium_id": game_api_data.get("StadiumID"),
        "channel": game_api_data.get("Channel"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    # Add odds if available (example fields)
    if game_api_data.get('PointSpread') is not None:
        game_data['point_spread'] = game_api_data.get('PointSpread')
    if game_api_data.get('OverUnder') is not None:
        game_data['over_under'] = game_api_data.get('OverUnder')
    if game_api_data.get('HomeTeamMoneyLine') is not None:
        game_data['home_team_moneyline'] = game_api_data.get('HomeTeamMoneyLine')
    if game_api_data.get('AwayTeamMoneyLine') is not None:
        game_data['away_team_moneyline'] = game_api_data.get('AwayTeamMoneyLine')

    return {k: v for k, v in game_data.items() if v is not None} # Filter out None values

async def upsert_data_to_supabase(supabase: Client, table_name: str, data: List[Dict[str, Any]], 
                                unique_column: str = "external_id", chunk_size: int = 100) -> List[Dict[str, Any]]:
    """Upsert data to Supabase table, handling conflicts on a unique column."""
    if not data:
        logger.info(f"No data to upsert for table {table_name}.")
        return []

    all_upserted_rows = []
    logger.info(f"Starting upsert for {len(data)} rows into {table_name}...")

    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        try:
            result = supabase.table(table_name).upsert(chunk, on_conflict=unique_column).execute()
            if result.data:
                all_upserted_rows.extend(result.data)
                logger.info(f"Successfully upserted/updated {len(result.data)} rows (chunk {i//chunk_size + 1}) into {table_name}.")
            elif result.error:
                error_message = result.error.message if result.error and hasattr(result.error, 'message') else 'Unknown error'
                logger.error(f"Error in chunk {i//chunk_size + 1} for {table_name}: {error_message}")
                logger.debug(f"Problematic chunk data (first item): {chunk[0] if chunk else 'N/A'}")
            else:
                logger.info(f"Chunk {i//chunk_size + 1} for {table_name} processed, no data returned.")
        except Exception as e:
            logger.exception(f"Exception during upsert chunk {i//chunk_size + 1} for {table_name}: {e}")
            logger.debug(f"Problematic chunk data (first item): {chunk[0] if chunk else 'N/A'}")

    logger.info(f"Finished upsert for {table_name}. Total rows processed in Supabase: {len(all_upserted_rows)}.")
    return all_upserted_rows

async def main():
    logger.info("🚀 Starting NBA data fetch and Supabase sync script...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch and upsert teams
    logger.info("Fetching NBA teams and stats from MySportsFeeds...")
    team_stats_totals = await fetch_nba_teams()
    teams = prepare_team_rows(team_stats_totals)
    upsert_to_supabase(supabase, 'nba_teams', teams, unique_cols=['external_team_id'])

    # Fetch and upsert players
    logger.info("Fetching NBA players from MySportsFeeds...")
    players = await fetch_nba_players()
    player_rows = prepare_player_rows(players)
    upsert_to_supabase(supabase, 'nba_players', player_rows, unique_cols=['external_player_id'])

    logger.info("NBA teams and players sync complete!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

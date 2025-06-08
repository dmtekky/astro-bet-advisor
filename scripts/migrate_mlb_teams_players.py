#!/usr/bin/env python3
"""
Script to migrate MLB teams and players from API-SPORTS to our database.
This script will:
1. Fetch teams from API-SPORTS
2. Match or create teams in our database
3. Fetch players for each team
4. Update or create player records with proper team references
"""
import os
import sys
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client as SupabaseClient

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
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_ANON_KEY')

if not all([API_SPORTS_KEY, SUPABASE_URL, SUPABASE_KEY]):
    logger.error("Missing required environment variables. Please check your .env file.")
    sys.exit(1)

# Initialize Supabase client
supabase: SupabaseClient = create_client(SUPABASE_URL, SUPABASE_KEY)

class APISportsClient:
    """Client for interacting with the API-SPORTS API."""
    
    BASE_URL = "https://v1.baseball.api-sports.io"
    
    def __init__(self, api_key: str):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'x-rapidapi-key': api_key,
                'x-rapidapi-host': 'v1.baseball.api-sports.io'
            }
        )
    
    async def get_teams(self, league_id: int = 1, season: int = 2024) -> List[Dict[str, Any]]:
        """Fetch all teams for a given league and season."""
        try:
            logger.info(f"Fetching teams for league {league_id}, season {season}")
            response = await self.session.get(
                f"{self.BASE_URL}/teams",
                params={"league": league_id, "season": season}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('response', [])
        except Exception as e:
            logger.error(f"Error fetching teams: {e}")
            return []
    
    async def get_team_players(self, team_id: int, season: int = 2024) -> List[Dict[str, Any]]:
        """Fetch all players for a given team and season."""
        try:
            logger.info(f"Fetching players for team {team_id}, season {season}")
            response = await self.session.get(
                f"{self.BASE_URL}/players",
                params={"team": team_id, "season": season}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('response', [])
        except Exception as e:
            logger.error(f"Error fetching players for team {team_id}: {e}")
            return []
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()

async def find_or_create_team(team_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Find or create a team in the database."""
    team_id = team_data.get('id')
    team_name = team_data.get('name')
    
    if not team_id or not team_name:
        logger.error(f"Invalid team data: {team_data}")
        return None
    
    try:
        # Try to find by external_id first
        result = supabase.table('teams') \
            .select('*') \
            .eq('external_id', str(team_id)) \
            .eq('sport', 'mlb') \
            .execute()
        
        if result.data and len(result.data) > 0:
            logger.info(f"Found existing team by external_id: {team_name}")
            return result.data[0]
        
        # Try to find by name and sport
        result = supabase.table('teams') \
            .select('*') \
            .ilike('name', f"%{team_name}%") \
            .eq('sport', 'mlb') \
            .execute()
        
        if result.data and len(result.data) > 0:
            # Update existing team with external_id
            existing_team = result.data[0]
            logger.info(f"Updating existing team with external_id: {team_name}")
            
            update_data = {
                'external_id': str(team_id),
                'source': 'api',
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'logo_url': team_data.get('logo')
            }
            
            # Only update abbreviation if it's not set or empty
            if not existing_team.get('abbreviation'):
                update_data['abbreviation'] = team_data.get('code', '')[:10]
            
            result = supabase.table('teams') \
                .update(update_data) \
                .eq('id', existing_team['id']) \
                .execute()
            
            return result.data[0] if result.data else None
        
        # Create new team
        logger.info(f"Creating new team: {team_name}")
        new_team = {
            'name': team_name,
            'abbreviation': team_data.get('code', '')[:10] or team_name[:3].upper(),
            'sport': 'mlb',
            'external_id': str(team_id),
            'logo_url': team_data.get('logo'),
            'source': 'api',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('teams').insert(new_team).execute()
        return result.data[0] if result.data else None
        
    except Exception as e:
        logger.error(f"Error in find_or_create_team for {team_name}: {e}")
        return None

async def update_or_create_player(player_data: Dict[str, Any], team_id: str) -> Optional[Dict[str, Any]]:
    """Update or create a player in the database."""
    player_info = player_data.get('player', {})
    player_id = player_info.get('id')
    
    if not player_id:
        logger.error(f"Invalid player data: {player_data}")
        return None
    
    try:
        # Prepare player data
        birth_date = None
        if player_info.get('birth', {}).get('date'):
            try:
                birth_date = datetime.strptime(
                    player_info['birth']['date'].split('T')[0], 
                    '%Y-%m-%d'
                ).date().isoformat()
            except (ValueError, KeyError):
                pass
        
        player_update = {
            'name': player_info.get('name', 'Unknown Player'),
            'birth_date': birth_date or '1900-01-01',
            'sport': 'mlb',
            'team_id': team_id,
            'external_id': str(player_id),
            'stats': {
                'position': player_data.get('position', 'Unknown'),
                'jersey_number': player_data.get('jersey_number'),
                'height': player_info.get('height'),
                'weight': player_info.get('weight'),
                'nationality': player_info.get('nationality'),
                'injury_status': player_info.get('injured', False)
            },
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Check if player exists by external_id
        result = supabase.table('players') \
            .select('id') \
            .eq('external_id', str(player_id)) \
            .execute()
        
        if result.data and len(result.data) > 0:
            # Update existing player
            player_id_db = result.data[0]['id']
            logger.info(f"Updating existing player: {player_update['name']}")
            
            result = supabase.table('players') \
                .update(player_update) \
                .eq('id', player_id_db) \
                .execute()
        else:
            # Create new player
            player_update['created_at'] = datetime.now(timezone.utc).isoformat()
            logger.info(f"Creating new player: {player_update['name']}")
            
            result = supabase.table('players').insert(player_update).execute()
        
        return result.data[0] if result.data else None
        
    except Exception as e:
        logger.error(f"Error in update_or_create_player: {e}")
        return None

async def main():
    """Main function to migrate teams and players."""
    api_client = APISportsClient(API_SPORTS_KEY)
    
    try:
        # Step 1: Fetch teams from API
        teams = await api_client.get_teams(league_id=1, season=2024)  # MLB league ID is 1
        
        if not teams:
            logger.error("No teams found in the API response")
            return
        
        # Step 2: Process each team
        for team_data in teams:
            team = team_data.get('team', {})
            if not team:
                continue
                
            # Find or create team in database
            db_team = await find_or_create_team(team)
            if not db_team:
                logger.error(f"Failed to process team: {team.get('name')}")
                continue
            
            logger.info(f"Processing players for team: {db_team['name']}")
            
            # Step 3: Fetch players for this team
            players = await api_client.get_team_players(team_id=team['id'], season=2024)
            
            # Step 4: Process each player
            for player_data in players:
                await update_or_create_player(player_data, db_team['id'])
                
    except Exception as e:
        logger.error(f"Error in main: {e}")
    finally:
        await api_client.close()
        logger.info("Migration completed")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

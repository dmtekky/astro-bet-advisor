# scripts/scrape_teams_only.py
import os
import sys
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import httpx
from supabase import create_client, Client
from typing import Dict, List, Optional

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('team_scraper')

# Initialize Supabase client
def get_env_var(name, prefix=''):
    # Try with prefix first, then without
    return os.getenv(f'{prefix}{name}') or os.getenv(name)

SUPABASE_URL = get_env_var('SUPABASE_URL', 'VITE_')
SUPABASE_KEY = get_env_var('SUPABASE_KEY', 'VITE_')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase URL or key in environment variables. "
                     "Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY or "
                     "SUPABASE_URL and SUPABASE_KEY in your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ESPN API configuration
ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports"
SPORTS = {
    "nba": "basketball/nba",
    "nfl": "football/nfl",
    "mlb": "baseball/mlb",
    "nhl": "hockey/nhl",
    "wnba": "basketball/wnba",
    "soccer/usa.1": "soccer/usa.1",  # MLS
    "soccer/eng.1": "soccer/eng.1"   # Premier League
}

async def fetch_teams(sport: str) -> List[Dict]:
    """Fetch teams for a specific sport from ESPN API."""
    url = f"{ESPN_BASE_URL}/{SPORTS[sport]}/teams"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            return data.get('sports', [{}])[0].get('leagues', [{}])[0].get('teams', [])
    except Exception as e:
        logger.error(f"Error fetching {sport} teams: {str(e)}")
        return []

def transform_team_data(team_data: Dict, sport: str) -> Dict:
    """Transform ESPN team data to our database schema.
    
    Args:
        team_data: Raw team data from ESPN API
        sport: The sport key (e.g., 'nba', 'nfl', 'soccer/eng.1')
        
    Returns:
        Transformed team data with espn_id prefixed by league to ensure uniqueness
    """
    team = team_data.get('team', {})
    
    # Handle soccer league naming
    if sport.startswith('soccer/'):
        league_name = 'MLS' if 'usa.1' in sport else 'Premier League' if 'eng.1' in sport else sport.split('/')[-1].upper()
        sport_upper = 'SOCCER'
    else:
        league_name = sport.upper()
        sport_upper = sport.upper()
    
    # Get the base espn_id and prefix it with the league to ensure uniqueness
    base_espn_id = str(team.get('id'))
    prefixed_espn_id = f"{sport.lower().replace('/', '_')}_{base_espn_id}"
    
    # Extract location from displayName (everything before the team name)
    display_name = team.get('displayName', team.get('name', ''))
    location = team.get('location', '')
    if not location and display_name:
        location = display_name.split(' ')[0]
    
    # Get abbreviation - handle cases where it might be missing
    abbreviation = team.get('abbreviation', '').upper()
    if not abbreviation and display_name:
        # Create an abbreviation from the name if not provided
        abbreviation = ''.join(word[0] for word in display_name.split() if word[0].isupper())
        abbreviation = abbreviation[:5]  # Limit abbreviation length
    
    # Get logo URL
    logos = team.get('logos', [])
    logo_url = next((logo['href'] for logo in logos if isinstance(logo, dict) and 'href' in logo), None)
    
    # Get team record if available
    wins = 0
    losses = 0
    
    # Try to get record from team data (newer ESPN API format)
    if 'record' in team and 'items' in team['record'] and team['record']['items']:
        for item in team['record']['items']:
            if item.get('type') == 'total':
                for stat in item.get('stats', []):
                    if stat.get('name') == 'wins':
                        wins = int(stat.get('value', 0))
                    elif stat.get('name') == 'losses':
                        losses = int(stat.get('value', 0))
                break
    # Fallback to old format if needed
    elif 'record' in team and 'items' in team['record'] and team['record']['items']:
        stats = team['record']['items'][0].get('stats', [])
        for stat in stats:
            if stat.get('name') == 'wins':
                wins = int(stat.get('value', 0))
            elif stat.get('name') == 'losses':
                losses = int(stat.get('value', 0))
    
    return {
        'espn_id': prefixed_espn_id,  # Now unique across all sports
        'name': display_name,
        'abbreviation': abbreviation,
        'logo_url': logo_url,
        'sport': sport_upper,
        'league': league_name,
        'external_id': f"espn_{sport.lower().replace('/', '_')}_{base_espn_id}",
        'location': location,
        'wins': wins,
        'losses': losses,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }

async def upsert_teams(teams_data: List[Dict], sport: str) -> None:
    """Upsert teams data into the database, with full debug logging."""
    if not teams_data:
        logger.warning(f"No {sport.upper()} teams data to upsert.")
        return

    logger.info(f"Processing {len(teams_data)} {sport.upper()} teams")
    
    # Transform the data
    transformed_data = []
    for team in teams_data:
        try:
            transformed = transform_team_data(team, sport)
            transformed_data.append(transformed)
            logger.debug(f"Transformed team: {transformed['name']} (ID: {transformed['espn_id']})")
        except Exception as e:
            logger.error(f"Error transforming team data: {e}")
    logger.info(f"Successfully transformed {len(transformed_data)}/{len(teams_data)} {sport.upper()} teams")

    # Upsert in batches
    batch_size = 5  # Small batches for easier debug
    for i in range(0, len(transformed_data), batch_size):
        batch = transformed_data[i:i + batch_size]
        logger.info(f"Upserting batch {i//batch_size + 1} with {len(batch)} teams...")
        logger.info(f"Batch payload: {batch}")
        try:
            response = supabase.table('teams').upsert(
                batch,
                on_conflict='espn_id',
                returning='representation'
            ).execute()
            logger.info(f"Supabase response: {response}")
            if hasattr(response, 'data') and response.data:
                logger.info(f"Successfully upserted {len(response.data)} {sport.upper()} teams (batch {i//batch_size + 1})")
                for team in response.data:
                    logger.debug(f"Upserted: {team.get('name')} (ID: {team.get('espn_id')})")
            else:
                logger.warning(f"No teams upserted in batch {i//batch_size + 1}. Response: {response}")
        except Exception as e:
            logger.error(f"Error upserting {sport.lower()} teams batch {i//batch_size + 1}: {str(e)}")
            logger.error(f"Batch data: {batch}")


async def main():
    """Main function to fetch and update teams for all sports."""
    logger.info("Starting team data update...")
    
    for sport in SPORTS.keys():
        logger.info(f"Fetching {sport.upper()} teams...")
        teams = await fetch_teams(sport)
        if teams:
            logger.info(f"Found {len(teams)} {sport.upper()} teams")
            await upsert_teams(teams, sport)
        else:
            logger.warning(f"No teams found for {sport.upper()}")
    
    logger.info("Team data update complete!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

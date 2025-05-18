# scripts/scrape_teams_only.py
import os
import sys
import logging
from datetime import datetime
import httpx
from supabase import create_client, Client
from typing import Dict, List, Optional

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
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase URL or key in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ESPN API configuration
ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports"
SPORTS = {
    "nba": "basketball/nba",
    "nfl": "football/nfl",
    "mlb": "baseball/mlb",
    "nhl": "hockey/nhl"
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
    """Transform ESPN team data to our database schema."""
    team = team_data.get('team', {})
    sport_upper = sport.upper()
    return {
        'espn_id': team.get('id'),
        'name': team.get('displayName'),
        'abbreviation': team.get('abbreviation'),
        'logo_url': next((logo['href'] for logo in team.get('logos', []) if 'href' in logo), None),
        'sport': sport_upper,
        'league': sport_upper,  # Set league to the same as sport (e.g., "NBA", "NFL")
        'external_id': f"espn_{team.get('id')}",
        'location': team.get('location'),
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }

async def upsert_teams(teams_data: List[Dict], sport: str) -> None:
    """Upsert teams data into the database."""
    if not teams_data:
        logger.warning(f"No {sport.upper()} teams data to upsert.")
        return

    # Log the number of teams being processed
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
    
    # Log the number of transformed teams
    logger.info(f"Successfully transformed {len(transformed_data)}/{len(teams_data)} {sport.upper()} teams")
    
    # Upsert in batches to avoid hitting URL length limits
    batch_size = 10  # Reduced batch size for better debugging
    for i in range(0, len(transformed_data), batch_size):
        batch = transformed_data[i:i + batch_size]
        try:
            logger.info(f"Upserting batch {i//batch_size + 1} with {len(batch)} teams...")
            response = supabase.table('teams').upsert(
                batch,
                on_conflict='espn_id',
                returning='representation'  # Changed to 'representation' to get the response data
            ).execute()
            
            # Log the response
            if hasattr(response, 'data'):
                logger.info(f"Successfully upserted {len(response.data)} {sport.upper()} teams (batch {i//batch_size + 1})")
                for team in response.data:
                    logger.debug(f"Upserted: {team.get('name')} (ID: {team.get('espn_id')})")
            else:
                logger.warning(f"Unexpected response format: {response}")
                
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

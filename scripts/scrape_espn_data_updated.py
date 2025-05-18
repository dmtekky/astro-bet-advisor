import os
import sys
import json
import time
import logging
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import schedule
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Changed from DEBUG to reduce verbosity
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scraper.log', mode='w')
    ]
)
logger = logging.getLogger('espn_scraper')

# Load environment variables
load_dotenv()

# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
TEAM_IMAGE_DIR = DATA_DIR / 'images' / 'teams'
PLAYER_IMAGE_DIR = DATA_DIR / 'images' / 'players'
TEAM_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
PLAYER_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# Supabase setup
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error('Supabase credentials not found in environment variables. Please check your .env file.')
    sys.exit(1)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ESPN API configuration
ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
}

SPORTS = [
    {'key': 'nba', 'sport': 'basketball', 'league': 'nba', 'stat_table': 'basketball_stats'},
    {'key': 'mlb', 'sport': 'baseball',   'league': 'mlb', 'stat_table': 'baseball_stats'},
    {'key': 'nfl', 'sport': 'football',   'league': 'nfl', 'stat_table': 'football_stats'},
    {'key': 'soccer', 'sport': 'soccer',  'league': 'eng.1', 'stat_table': 'soccer_stats'},
    {'key': 'boxing', 'sport': 'boxing',  'league': 'boxing', 'stat_table': 'boxing_stats'},
]

def download_image(url: str, save_path: Path) -> Optional[str]:
    """Download an image from a URL and save it to the specified path."""
    if not url or not isinstance(url, str) or not url.startswith('http'):
        return None
        
    try:
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        return str(save_path.relative_to(BASE_DIR))
    except Exception as e:
        logger.debug(f"Failed to download image {url}: {e}")
        return None

def process_team(team: dict, sport: dict) -> None:
    """Process a single team's data."""
    try:
        team_id = team.get('id')
        if not team_id:
            logger.warning("Skipping team with no ID")
            return
            
        # Use the team dict directly (already flattened by extract_teams_from_response)
        team_logo_url = (team.get('logos') or [{}])[0].get('href', '')
        team_logo_path = download_image(team_logo_url, TEAM_IMAGE_DIR / f"{team_id}.png") if team_logo_url else None

        team_record = {
            'espn_id': team_id,
            'name': team.get('name', ''),
            'display_name': team.get('displayName', ''),
            'abbreviation': team.get('abbreviation', ''),
            'sport': sport['key'],
            'league': sport['league'],
            'logo_url': team_logo_url or None,
            'logo_path': team_logo_path,
            'primary_color': team.get('color', ''),
            'secondary_color': team.get('alternateColor', '')
        }
        logger.info(f"Upserting team: {team_record['name']} (ID: {team_id})")
        
        # Remove None values
        team_record = {k: v for k, v in team_record.items() if v is not None}
        
        supabase.table('teams').upsert(team_record, on_conflict='espn_id').execute()
        logger.debug(f"Processed team: {team_record.get('name')} (ID: {team_id})")
        
        # Process team roster
        process_team_roster(team_id, sport)
        
    except Exception as e:
        logger.error(f"Error processing team {team_id}: {e}", exc_info=True)

def process_team_roster(team_id: str, sport: dict) -> None:
    """Process the roster for a single team."""
    roster_url = f"{ESPN_BASE_URL}/{sport['sport']}/{sport['league']}/teams/{team_id}/roster"
    
    try:
        logger.debug(f"Fetching roster for team {team_id}")
        response = requests.get(roster_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        roster_data = response.json()
        
        # Find athletes data in the response
        athletes = []
        if 'athletes' in roster_data:
            athletes = roster_data['athletes']
        else:
            # Try common alternative locations for athlete data
            for key in ['team', 'squad', 'roster', 'players']:
                if key in roster_data and isinstance(roster_data[key], list):
                    athletes = roster_data[key]
                    logger.debug(f"Found athletes in '{key}' key")
                    break
        
        if not isinstance(athletes, list):
            logger.warning(f"Could not find athletes list for team {team_id}")
            return
            
        logger.info(f"Found {len(athletes)} athletes for team {team_id}")
        
        for athlete in athletes:
            try:
                process_athlete(athlete, team_id, sport)
            except Exception as e:
                logger.error(f"Error processing athlete: {e}", exc_info=True)
                continue
                
    except Exception as e:
        logger.error(f"Error fetching roster for team {team_id}: {e}")

def process_athlete(athlete: dict, team_id: str, sport: dict) -> None:
    """Process a single athlete's data."""
    try:
        # Handle different athlete data structures
        if isinstance(athlete, dict) and 'athlete' in athlete:
            player = athlete.get('athlete', {})
        else:
            player = athlete or {}
        
        # Ensure we have a valid player ID
        player_id = str(player.get('id', '')).strip()
        if not player_id or player_id.lower() in ('none', 'null', 'undefined'):
            logger.debug(f"Skipping player with invalid ID. Data: {json.dumps(athlete, default=str)[:200]}")
            return
        
        # Get player image URL
        player_img_url = (
            (player.get('headshot') or {}).get('href', '') or 
            player.get('headshotHref', '') or
            (player.get('headshots', [{}])[0].get('href', '') if isinstance(player.get('headshots'), list) else '')
        )
        
        # Download player image if URL is available
        player_img_path = None
        if player_img_url and player_img_url.startswith('http'):
            try:
                player_img_path = download_image(
                    player_img_url, 
                    PLAYER_IMAGE_DIR / f"{player_id}.png"
                )
            except Exception as e:
                logger.debug(f"Failed to download image for player {player_id}: {e}")
        
        # Get player name from various possible fields
        first_name = str(player.get('firstName', '')).strip()
        last_name = str(player.get('lastName', '')).strip()
        display_name = str(player.get('displayName') or '').strip()
        full_name = str(player.get('fullName') or '').strip()
        
        # Construct the best possible name
        if display_name:
            player_name = display_name
        elif full_name:
            player_name = full_name
        elif first_name or last_name:
            player_name = f"{first_name} {last_name}".strip()
        else:
            player_name = f"Player-{player_id}"
        
        # Get position information
        position = ''
        for pos_src in [
            athlete.get('position', {}).get('abbreviation'),
            player.get('position', {}).get('abbreviation'),
            athlete.get('position'),
            player.get('position')
        ]:
            if pos_src:
                if isinstance(pos_src, dict):
                    position = pos_src.get('abbreviation', '')
                else:
                    position = str(pos_src)
                if position:
                    break
        
        # Get jersey number
        jersey = None
        for jersey_src in [athlete.get('jersey'), player.get('jersey')]:
            if jersey_src is not None:
                try:
                    jersey = int(str(jersey_src).strip())
                    break
                except (ValueError, TypeError):
                    continue
        
        # Get height and weight
        height = str(player.get('displayHeight') or player.get('height') or '').strip()
        weight = None
        try:
            weight_val = player.get('weight')
            if weight_val is not None:
                weight = int(str(weight_val).strip())
        except (ValueError, TypeError):
            pass
        
        # Prepare player record
        player_record = {
            'espn_id': player_id,
            'name': player_name,
            'birth_date': player.get('dateOfBirth') or player.get('birthDate'),
            'sport': sport['key'],
            'team_id': str(team_id).strip() if team_id else None,
            'position': position or None,
            'jersey_number': jersey,
            'height': height or None,
            'weight': weight,
            'image_url': player_img_url or None,
            'image_path': player_img_path
        }
        
        # Remove None values
        player_record = {k: v for k, v in player_record.items() if v is not None}
        
        # Validate required fields
        if not all(k in player_record for k in ['espn_id', 'name', 'sport']):
            logger.warning(f"Skipping player with missing required fields: {player_id}")
            return
        
        # Insert/update player record
        supabase.table('players').upsert(player_record, on_conflict='espn_id').execute()
        logger.info(f"Upserted player: {player_name} (ID: {player_id})")

        # --- Fetch and upsert player statistics ---
        try:
            stat_table = sport.get('stat_table')
            stats_url = f"https://site.api.espn.com/apis/site/v2/sports/{sport['sport']}/{sport['league']}/athletes/{player_id}/stats"
            stat_resp = requests.get(stats_url, headers=HEADERS, timeout=10)
            stat_resp.raise_for_status()
            stat_json = stat_resp.json()
            # Attempt to extract stats from the first available set (season/career)
            stats = {}
            if 'stats' in stat_json and isinstance(stat_json['stats'], list) and stat_json['stats']:
                # Grab the first stats dict that has 'stats' inside it
                for stat_group in stat_json['stats']:
                    if isinstance(stat_group, dict) and 'stats' in stat_group and isinstance(stat_group['stats'], dict):
                        stats = stat_group['stats']
                        break
            elif 'athlete' in stat_json and 'stats' in stat_json['athlete']:
                stats = stat_json['athlete']['stats']
            # Only upsert if we have stats and a stat table
            if stats and stat_table:
                stats_record = {'player_id': player_id, 'espn_id': player_id}
                # Flatten stats dict into the record
                stats_record.update(stats)
                supabase.table(stat_table).upsert(stats_record, on_conflict='player_id').execute()
                logger.info(f"Upserted stats for player: {player_name} (ID: {player_id}) in table {stat_table}")
            else:
                logger.info(f"No stats found for player: {player_name} (ID: {player_id})")
        except Exception as e:
            logger.warning(f"Failed to fetch/upsert stats for player {player_id}: {e}")

    except Exception as e:
        logger.error(f"Error processing athlete: {e}", exc_info=True)

def extract_teams_from_response(response_data: dict) -> list:
    """Extract teams from the ESPN API response."""
    teams = []
    
    # Try different response formats
    if 'sports' in response_data and response_data['sports']:
        # Format 1: sports -> leagues -> teams
        for sport in response_data['sports']:
            for league in sport.get('leagues', []):
                for team_obj in league.get('teams', []):
                    if 'team' in team_obj:
                        teams.append(team_obj['team'])
    elif 'leagues' in response_data and response_data['leagues']:
        # Format 2: leagues -> teams
        for league in response_data['leagues']:
            for team_obj in league.get('teams', []):
                if 'team' in team_obj:
                    teams.append(team_obj['team'])
    elif 'teams' in response_data:
        # Format 3: Direct teams array
        teams = response_data['teams']
    
    return teams

def scrape_teams_and_players():
    """Main function to scrape teams and players for all sports."""
    logger.info("Starting team and player scrape...")
    
    for sport in SPORTS:
        try:
            logger.info(f"Processing {sport['key'].upper()}...")
            teams_url = f"{ESPN_BASE_URL}/{sport['sport']}/{sport['league']}/teams"
            
            # Fetch teams with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    logger.debug(f"Fetching teams from {teams_url} (attempt {attempt + 1}/{max_retries})")
                    response = requests.get(teams_url, headers=HEADERS, timeout=15)
                    response.raise_for_status()
                    teams_data = response.json()
                    break
                except (requests.RequestException, json.JSONDecodeError) as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying...")
                    time.sleep(2 ** attempt)  # Exponential backoff
            
            # Extract teams from the response
            teams = extract_teams_from_response(teams_data)
            
            if not teams:
                logger.warning(f"No teams found in the API response for {sport['key']}")
                logger.debug(f"API Response: {json.dumps(teams_data, indent=2)[:1000]}...")  # Log first 1000 chars
                continue
            
            logger.info(f"Found {len(teams)} teams for {sport['key']}")
            
            # Process each team
            for team in teams:
                if not isinstance(team, dict):
                    logger.warning(f"Skipping invalid team data: {team}")
                    continue
                    
                team_id = team.get('id')
                if not team_id:
                    logger.warning(f"Skipping team with missing ID: {team.get('name', 'Unnamed Team')}")
                    continue
                    
                try:
                    logger.debug(f"Processing team: {team.get('name')} (ID: {team_id})")
                    process_team(team, sport)
                    time.sleep(0.5)  # Be nice to the API
                except Exception as e:
                    logger.error(f"Error processing team {team_id}: {e}", exc_info=True)
                    continue
                    
        except Exception as e:
            logger.error(f"Error processing {sport['key']}: {e}", exc_info=True)
            continue
    
    logger.info("Team and player scrape completed")

def main():
    """Main entry point for the scraper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='ESPN Data Scraper')
    parser.add_argument('--once', action='store_true', help='Run the scraper once and exit')
    args = parser.parse_args()
    
    try:
        if args.once:
            logger.info("Running scraper once...")
            scrape_teams_and_players()
        else:
            logger.info("Starting scraper in scheduled mode...")
            # Schedule to run daily at 3 AM
            schedule.every().day.at("03:00").do(scrape_teams_and_players)
            
            # Initial run
            scrape_teams_and_players()
            
            # Keep the script running
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
                
    except KeyboardInterrupt:
        logger.info("Scraper stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()

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
    level=logging.DEBUG,  # Set to DEBUG to see more detailed logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scraper.log', mode='w')  # 'w' to overwrite previous logs
    ]
)
logger = logging.getLogger('espn_scraper')

# Enable HTTP request/response logging
logging.getLogger('httpx').setLevel(logging.DEBUG)
logging.getLogger('httpcore').setLevel(logging.DEBUG)

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
    {'key': 'nhl', 'sport': 'hockey',     'league': 'nhl', 'stat_table': 'hockey_stats'},
    {'key': 'wnba', 'sport': 'basketball', 'league': 'wnba', 'stat_table': 'basketball_stats'},
    {'key': 'mls', 'sport': 'soccer',     'league': 'usa.1', 'stat_table': 'soccer_stats'},  # MLS
    {'key': 'epl', 'sport': 'soccer',     'league': 'eng.1', 'stat_table': 'soccer_stats'},  # Premier League
]

RATE_LIMIT_SEC = 1

# --- Image Download Helper ---
def download_image(url: str, save_path: Path) -> Optional[str]:
    try:
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        return str(save_path.relative_to(BASE_DIR))
    except Exception as e:
        logger.warning(f"Failed to download image {url}: {e}")
        return None

# --- Scraper Logic ---
def scrape_and_update():
    logger.info('Starting ESPN data scrape...')
    player_count = 0  # TEMPORARY: Count total players processed
    for sport in SPORTS:
        logger.info(f"Processing {sport['key'].upper()}...")
        teams_url = f"{ESPN_BASE_URL}/{sport['sport']}/{sport['league']}/teams"
        try:
            teams_resp = requests.get(teams_url, headers=HEADERS, timeout=15)
            teams_resp.raise_for_status()
            teams_data = teams_resp.json()
            teams = teams_data.get('sports', [{}])[0].get('leagues', [{}])[0].get('teams', [])
        except Exception as e:
            logger.error(f"Error fetching teams for {sport['key']}: {e}")
            continue
        for team_obj in teams:
            team = team_obj.get('team', {})
            team_id = team.get('id')
            team_logos = team.get('logos', [])
            team_logo_url = team_logos[0].get('href') if team_logos and isinstance(team_logos, list) and len(team_logos) > 0 else ''
            team_logo_path = None
            if team_logo_url:
                try:
                    team_logo_path = download_image(team_logo_url, TEAM_IMAGE_DIR / f"{sport['key']}_{team_id}.png")
                except Exception as e:
                    logger.warning(f"Failed to download team logo for {team.get('name', '')}: {e}")
                    team_logo_path = None
            # Create prefixed team ID
            prefixed_team_id = f"{sport['key']}_{team_id}"
            
            # Get league display name
            league_name = sport['league'].upper()
            if sport['key'] == 'mls':
                league_name = 'MLS'
            elif sport['key'] == 'epl':
                league_name = 'Premier League'
            elif sport['key'] == 'wnba':
                league_name = 'WNBA'
                
            # Get team location from display name if not available
            location = team.get('location', '')
            if not location and 'displayName' in team:
                location = team['displayName'].split(' ')[0]
                
            # Prepare team record with new ID format
            team_record = {
                'espn_id': prefixed_team_id,
                'name': team.get('displayName', team.get('name', '')),
                'abbreviation': team.get('abbreviation', '').upper(),
                'sport': 'BASKETBALL' if sport['key'] in ['nba', 'wnba'] else sport['key'].upper(),
                'league': league_name,
                'logo_url': team_logo_url,
                'logo_path': team_logo_path,
                'primary_color': team.get('color', ''),
                'secondary_color': team.get('alternateColor', ''),
                'location': location,
                'external_id': f"espn_{sport['key']}_{team_id}",
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            try:
                supabase.table('teams').upsert(team_record, on_conflict='espn_id').execute()
            except Exception as e:
                logger.warning(f"Failed to upsert team {team_id}: {e}")
            # --- Players ---
            roster_url = f"{ESPN_BASE_URL}/{sport['sport']}/{sport['league']}/teams/{team_id}/roster"
            try:
                logger.debug(f"Fetching roster from: {roster_url}")
                roster_resp = requests.get(roster_url, headers=HEADERS, timeout=15)
                roster_resp.raise_for_status()
                roster_data = roster_resp.json()
                
                # Log the full roster data for debugging
                logger.debug(f"Roster data keys: {list(roster_data.keys())}")
                if 'athletes' not in roster_data:
                    logger.warning(f"No 'athletes' key in roster data. Available keys: {list(roster_data.keys())}")
                    # Try to find athletes data in other possible keys
                    for key in ['team', 'squad', 'roster', 'players']:
                        if key in roster_data and isinstance(roster_data[key], list):
                            roster_data['athletes'] = roster_data[key]
                            logger.info(f"Found athletes data in key: {key}")
                            break
                
                athletes = roster_data.get('athletes', [])
                logger.info(f"Found {len(athletes)} athletes in roster")
            except Exception as e:
                logger.warning(f"Failed to fetch roster for team {team_id}: {e}")
                continue
            if not isinstance(athletes, list):
                logger.warning(f"Unexpected athletes data format for team {team_id}: {type(athletes)}")
                continue
                
            for athlete in athletes:

                player_count += 1
                # Handle different athlete data structures
                if isinstance(athlete, dict) and 'athlete' in athlete:
                    player = athlete.get('athlete', {})
                else:
                    player = athlete
                    
                player_id = player.get('id')
                
                # Skip if player_id is missing or invalid
                if not player_id:
                    logger.debug(f"Skipping player with missing ID. Player data: {json.dumps(player, default=str)[:200]}")
                    continue
                    
                # Get player image URL from different possible locations
                player_img_url = (
                    player.get('headshot', {}).get('href', '') or 
                    player.get('headshotHref', '') or
                    (player.get('headshots', [{}])[0].get('href', '') if isinstance(player.get('headshots'), list) else '')
                )
                player_img_path = None
                if player_img_url:
                    try:
                        player_img_path = download_image(player_img_url, PLAYER_IMAGE_DIR / f"{player_id}.png")
                    except Exception as e:
                        logger.warning(f"Failed to download image for player {player_id}: {e}")
                
                # Prepare player record with proper null handling
                try:
                    # Get player name from various possible fields
                    player_name = (
                        player.get('displayName') or 
                        player.get('fullName') or
                        f"{player.get('firstName', '').strip()} {player.get('lastName', '').strip()}".strip() or
                        f"Player-{player_id}"
                    )
                    
                    # Get position from various possible locations
                    position = (
                        athlete.get('position', {}).get('abbreviation', '') or
                        player.get('position', {}).get('abbreviation', '') or
                        athlete.get('position', '') or
                        player.get('position', '')
                    )
                    if isinstance(position, dict):
                        position = position.get('abbreviation', '')
                        
                    # Extract stats from possible keys
                    stats = {}
                    # ESPN often uses 'stats', 'statistics', or a nested list of stats objects
                    if 'stats' in player and isinstance(player['stats'], list):
                        # If stats is a list of dicts, merge them
                        for stat_obj in player['stats']:
                            if isinstance(stat_obj, dict):
                                stats.update(stat_obj)
                    elif 'statistics' in player and isinstance(player['statistics'], dict):
                        stats = player['statistics']
                    elif 'statistics' in player and isinstance(player['statistics'], list):
                        # Sometimes it's a list of dicts
                        for stat_obj in player['statistics']:
                            if isinstance(stat_obj, dict):
                                stats.update(stat_obj)
                    # Fallback: look for known stat fields for common sports
                    if not stats:
                        for key in ['points', 'rebounds', 'assists', 'goals', 'saves', 'appearances', 'minutes', 'touchdowns', 'homeRuns', 'battingAverage']:
                            if key in player:
                                stats[key] = player[key]
                    player_record = {
                        'espn_id': f"{sport['key']}_{player_id}",
                        'name': player_name,
                        'birth_date': player.get('dateOfBirth') or player.get('birthDate'),
                        'sport': 'BASKETBALL' if sport['key'] in ['nba', 'wnba'] else sport['key'].upper(),
                        'team_id': prefixed_team_id,
                        'position': position,
                        'jersey_number': int(athlete.get('jersey') or player.get('jersey') or 0) if str(athlete.get('jersey') or player.get('jersey') or '').isdigit() else None,
                        'height': player.get('displayHeight') or player.get('height') or '',
                        'weight': int(player.get('weight', 0)) if str(player.get('weight', '')).isdigit() else None,
                        'image_url': player_img_url or None,
                        'image_path': str(player_img_path) if player_img_path else None,
                        'stats': stats if stats else None
                    }
                    
                    # Only include fields that have values
                    player_record = {k: v for k, v in player_record.items() if v is not None}
                    
                    # Upsert player record
                    supabase.table('players').upsert(player_record, on_conflict='espn_id').execute()
                    logger.debug(f"Upserted player: {player_record.get('name')} (ID: {player_id})")
                    
                except Exception as e:
                    logger.error(f"Failed to process player {player_id} ({player.get('displayName', 'Unknown')}): {str(e)}", exc_info=True)
                # --- Stats (simplified: you may want to expand this for each sport) ---
                # Here you would fetch and map stats per sport and insert into the appropriate stats table
                # For brevity, this is left as a stub
                time.sleep(RATE_LIMIT_SEC)
        logger.info(f"Finished {sport['key'].upper()}.")
    logger.info('ESPN data scrape complete.')

# --- Scheduler ---
def run_weekly_scraper():
    schedule.every().monday.at("02:00").do(scrape_and_update)
    logger.info('Weekly ESPN scraper scheduled for Mondays at 2am.')
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(60)
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()

def scrape_schedules():
    logger.info('Starting ESPN schedule scrape...')
    for sport in SPORTS:
        # Example schedule endpoints for each league
        if sport['key'] == 'nba':
            schedule_endpoint = 'basketball/nba/scoreboard'
        elif sport['key'] == 'mlb':
            schedule_endpoint = 'baseball/mlb/scoreboard'
        elif sport['key'] == 'nfl':
            schedule_endpoint = 'football/nfl/scoreboard'
        elif sport['key'] == 'soccer':
            schedule_endpoint = 'soccer/eng.1/scoreboard'  # Premier League as example
        elif sport['key'] == 'boxing':
            continue  # ESPN API does not provide boxing schedules in the same format
        else:
            continue
        url = f"{ESPN_BASE_URL}/{schedule_endpoint}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            games = data.get('events', [])
        except Exception as e:
            logger.error(f"Error fetching schedule for {sport['key']}: {e}")
            continue
        for game in games:
            try:
                # Parse teams and game info
                game_id = game['id']
                competitions = game.get('competitions', [{}])[0]
                competitors = competitions.get('competitors', [])
                if len(competitors) < 2:
                    continue
                home = next((c for c in competitors if c.get('homeAway') == 'home'), competitors[0])
                away = next((c for c in competitors if c.get('homeAway') == 'away'), competitors[1])
                home_id = home.get('team', {}).get('id', '')
                away_id = away.get('team', {}).get('id', '')
                game_time = game.get('date')
                status = game.get('status', {}).get('type', {}).get('name', '')
                # Upsert schedule
                schedule_record = {
                    'espn_id': game_id,
                    'sport': sport['key'],
                    'home_team': home_id,
                    'away_team': away_id,
                    'game_time': game_time,
                    'status': status,
                    'last_updated': datetime.utcnow().isoformat()
                }
                supabase.table('schedules').upsert(schedule_record, on_conflict='espn_id').execute()
            except Exception as e:
                logger.warning(f"Failed to upsert schedule for game {game.get('id', 'unknown')}: {e}")
        logger.info(f"Finished {sport['key'].upper()} schedule.")
    logger.info('ESPN schedule scrape complete.')

# Enhanced weekly runner: scrape teams/players/stats and schedules
def run_weekly_scraper():
    schedule.every().monday.at("02:00").do(scrape_and_update)
    schedule.every().monday.at("03:00").do(scrape_schedules)
    logger.info('Weekly ESPN scraper and schedule updater scheduled for Mondays.')
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(60)
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Run ESPN data scraper')
    parser.add_argument('--once', action='store_true', help='Run scraper once immediately')
    parser.add_argument('--weekly', action='store_true', help='Run scraper and schedule updater every week (background)')
    parser.add_argument('--schedules', action='store_true', help='Run only the schedule updater')
    args = parser.parse_args()
    if args.once:
        scrape_and_update()
    elif args.schedules:
        scrape_schedules()
    elif args.weekly:
        run_weekly_scraper()
        while True:
            time.sleep(3600)
    else:
        print("Use --once to run now, --schedules to update schedules, or --weekly to run both every week as a background process.")

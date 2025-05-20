import os
import sys
import time
import random
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
import re
from pathlib import Path

# Set up headers to mimic a real browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.espn.com/',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
}

# Set up path to .env file (assuming it's in the project root)
env_path = Path(__file__).parent.parent / '.env'

# Load environment variables
load_dotenv(dotenv_path=env_path, override=True)

# Try multiple possible environment variable names for Supabase URL and Key
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase URL or Key in environment variables")
    print(f"SUPABASE_URL: {'Set' if SUPABASE_URL else 'Not set'}")
    print(f"SUPABASE_KEY: {'Set' if SUPABASE_KEY else 'Not set'}")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('espn_roster_scraper')

# MLB team ESPN abbreviations
MLB_TEAMS = {
    'ari': 'Arizona Diamondbacks',
    'atl': 'Atlanta Braves',
    'bal': 'Baltimore Orioles',
    'bos': 'Boston Red Sox',
    'chw': 'Chicago White Sox',
    'chc': 'Chicago Cubs',
    'cin': 'Cincinnati Reds',
    'cle': 'Cleveland Guardians',
    'col': 'Colorado Rockies',
    'det': 'Detroit Tigers',
    'hou': 'Houston Astros',
    'kc': 'Kansas City Royals',
    'la': 'Los Angeles Angels',
    'lad': 'Los Angeles Dodgers',
    'mia': 'Miami Marlins',
    'mil': 'Milwaukee Brewers',
    'min': 'Minnesota Twins',
    'nym': 'New York Mets',
    'nyy': 'New York Yankees',
    'oak': 'Oakland Athletics',
    'phi': 'Philadelphia Phillies',
    'pit': 'Pittsburgh Pirates',
    'sd': 'San Diego Padres',
    'sf': 'San Francisco Giants',
    'sea': 'Seattle Mariners',
    'stl': 'St. Louis Cardinals',
    'tb': 'Tampa Bay Rays',
    'tex': 'Texas Rangers',
    'tor': 'Toronto Blue Jays',
    'was': 'Washington Nationals',
}

# Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ESPN_ROSTER_URL = 'https://www.espn.com/mlb/team/roster/_/name/{abbr}'

# Helper function to parse height (e.g., 6'2")
def parse_height(ht_str):
    match = re.match(r"(\d+)'(\d+)", ht_str)
    if match:
        feet, inches = match.groups()
        return int(feet) * 12 + int(inches)
    return None

def fetch_and_parse_roster(team_abbr, team_name):
    url = ESPN_ROSTER_URL.format(abbr=team_abbr)
    logger.info(f"Fetching roster for {team_name} ({team_abbr}) from {url}")
    
    # Add random delay to avoid rate limiting
    time.sleep(random.uniform(1.0, 3.0))
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        
        # Check if we got a valid HTML response
        if not resp.text.strip() or '<!doctype html' not in resp.text.lower():
            logger.error(f"Received empty or non-HTML response from {url}")
            return []
            
        soup = BeautifulSoup(resp.text, 'html.parser')
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching {url}: {e}")
        return []

    # Find the roster table
    table = soup.find('table')
    if not table:
        logger.error(f"No roster table found for {team_name}")
        return []

    headers = [th.text.strip().lower() for th in table.find('thead').find_all('th')]
    players = []
    for row in table.find('tbody').find_all('tr'):
        cols = row.find_all('td')
        if not cols or len(cols) < 7:
            continue
        player = {}
        # ESPN player link is in the first column
        name_cell = cols[0]
        name_link = name_cell.find('a')
        
        # Extract player name
        player_name = name_cell.get_text(strip=True)
        if not player_name and name_link:
            player_name = name_link.get_text(strip=True)
        
        # Extract ESPN player ID if available
        player_id = None
        if name_link and 'href' in name_link.attrs:
            player_url = name_link['href']
            match = re.search(r'/id/(\d+)', player_url)
            if match:
                player_id = match.group(1)
        
        player['espn_id'] = player_id
        player['name'] = player_name or 'Unknown Player'
        
        # Debug logging
        if not player_name:
            logger.warning(f"Could not extract name for player, cell content: {str(name_cell)}")
        if not player_id:
            logger.warning(f"Could not extract ID for player: {player_name}")

        player['position'] = cols[1].text.strip()
        player['bats'] = cols[2].text.strip()
        player['throws'] = cols[3].text.strip()
        player['age'] = int(cols[4].text.strip()) if cols[4].text.strip().isdigit() else None
        player['height'] = cols[5].text.strip()
        player['height_inches'] = parse_height(player['height'])
        player['weight'] = int(cols[6].text.strip()) if cols[6].text.strip().isdigit() else None
        player['team'] = team_name
        player['team_abbr'] = team_abbr
        player['sport'] = 'mlb'
        players.append(player)
    return players

def upsert_players(players):
    for player in players:
        # Create a stats JSON object with all player data
        stats = {
            'position': player['position'],
            'bats': player['bats'],
            'throws': player['throws'],
            'age': player['age'],
            'height': player['height'],
            'height_inches': player['height_inches'],
            'weight': player['weight'],
            'team': player['team'],
            'team_abbr': player['team_abbr'],
            'source': 'espn_roster'
        }
        
        # Create the record with stats in the JSON column
        record = {
            'espn_id': player['espn_id'],
            'name': player['name'],
            'sport': player['sport'],
            'stats': stats  # Store all data in the stats JSON column
        }
        
        try:
            # First try to get the existing player to preserve any existing stats
            existing = supabase.table('players').select('*').eq('espn_id', player['espn_id']).execute()
            if existing.data and len(existing.data) > 0:
                # Merge with existing stats if they exist
                existing_stats = existing.data[0].get('stats', {})
                existing_stats.update(stats)  # Update with new stats, preserving any existing ones
                record['stats'] = existing_stats
            
            # Upsert the player record
            result = supabase.table('players').upsert(record, on_conflict='espn_id').execute()
            if hasattr(result, 'error') and result.error:
                raise Exception(result.error)
                
            logger.info(f"Upserted player: {player['name']} (ID: {player['espn_id']})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upsert player {player['name']} (ID: {player['espn_id']}): {str(e)}")
            return False

def main():
    # First, try with the primary abbreviations
    processed_teams = set()
    
    for abbr, name in MLB_TEAMS.items():
        if name in processed_teams:
            continue
            
        logger.info(f"\n{'='*50}")
        logger.info(f"Processing team: {name} (abbreviation: {abbr})")
        logger.info(f"{'='*50}")
        
        try:
            players = fetch_and_parse_roster(abbr, name)
            if players:
                logger.info(f"Found {len(players)} players for {name}")
                success = upsert_players(players)
                if success:
                    processed_teams.add(name)
                    logger.info(f"Successfully processed {len(players)} players for {name}")
                else:
                    logger.warning(f"Failed to upsert players for {name}")
            else:
                logger.warning(f"No players found for {name} (tried abbreviation: {abbr})")
                
            # Add a small delay between teams
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Error processing team {name} (abbreviation: {abbr}): {str(e)}")
            logger.exception("Full traceback:")
    
    logger.info(f"\nProcessing complete. Successfully processed {len(processed_teams)} teams.")

if __name__ == "__main__":
    main()

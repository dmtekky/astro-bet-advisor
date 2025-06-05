import base64
import os
import time
import random
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API credentials from environment variables
API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
PASSWORD = 'MYSPORTSFEEDS'  # As per API documentation

# API endpoints
BASE_URL = 'https://api.mysportsfeeds.com/v2.1/pull/nba'

# Since the 2024-2025 season hasn't started, we'll use the most recent completed season
CURRENT_SEASON = '2023-2024-regular'
PLAYOFFS_SEASON = '2024-playoff'  # Current playoffs (if any)

def create_session():
    """Create a requests session with retry logic and delays."""
    session = requests.Session()
    
    # Configure retry strategy
    retry_strategy = Retry(
        total=3,  # number of retries
        backoff_factor=1,  # wait 1, 2, 4 seconds between retries
        status_forcelist=[429, 500, 502, 503, 504],  # status codes to retry on
        allowed_methods=["GET"]  # only retry on GET requests
    )
    
    # Mount the retry adapter
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Add headers
    auth_string = f"{API_KEY}:{PASSWORD}"
    auth_bytes = auth_string.encode('utf-8')
    auth_token = base64.b64encode(auth_bytes).decode('ascii')
    session.headers.update({
        'Authorization': f'Basic {auth_token}',
        'User-Agent': 'NBA Stats Fetcher/1.0'
    })
    
    return session

def safe_request(session, url, params=None):
    """Make a request with rate limiting and error handling."""
    # Add a small delay between requests to avoid rate limiting
    time.sleep(0.5 + random.uniform(0, 0.5))  # 0.5-1.0 second delay
    
    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_nba_stats():
    session = create_session()
    
    try:
        
        # First, get the current season info
        print("Fetching current season information...")
        season_url = f"{BASE_URL}/current_season.json"
        season_response = safe_request(session, season_url)
        
        if season_response and season_response.status_code == 200:
            try:
                season_data = season_response.json()
                print(f"Current season: {season_data.get('season', {}).get('name', 'Unknown')}")
            except ValueError:
                print("Could not parse season data")
        
        # Try to get current season stats
        print(f"\nAttempting to fetch stats for {CURRENT_SEASON}...")
        stats_url = f"{BASE_URL}/{CURRENT_SEASON}/player_stats_totals.json"
        params = {
            'limit': 20,  # Reduced limit to avoid rate limiting
            'sort': 'stats.minSeconds',
            'sortdir': 'DESC'
        }
        
        response = safe_request(session, stats_url, params)
        
        # If no data in current season, try regular season with a different approach
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'playerStatsTotals' in data and data['playerStatsTotals'] and \
                   any(stat.get('statistics', {}).get('minSeconds', 0) > 0 for stat in data['playerStatsTotals']):
                    print(f"Found valid data for {CURRENT_SEASON}")
                else:
                    print(f"No valid data found for {CURRENT_SEASON}, trying with different parameters...")
                    # Try with different parameters
                    params.update({
                        'limit': 10,
                        'sort': 'stats.pts',
                        'sortdir': 'DESC'
                    })
                    response = safe_request(session, stats_url, params)
                    
                    if not response or response.status_code != 200:
                        print("Failed to fetch data with alternative parameters")
                        return
            except ValueError:
                print("Could not parse response data")
                return
        
        if not response:
            print("Failed to fetch data after multiple attempts")
            return
            
        print(f'Response HTTP Status Code: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print('\n=== NBA Playoff Stats ===')
            
            if 'playerStatsTotals' in data and data['playerStatsTotals']:
                print(f'\nFound {len(data["playerStatsTotals"])} player stats entries\n')
                
                # Print table header
                print(f'{"Player":<25} {"Team":<5} {"PTS":>5} {"REB":>5} {"AST":>5} {"STL":>5} {"BLK":>5} {"FG%":>6} {"3P%":>6} {"FT%":>6} {"MIN":>6} {"GP":>5}')
                print('-' * 92)
                
                # Print each player's stats
                for player in data['playerStatsTotals']:
                    stats = player.get('statistics', {})
                    player_info = player.get('player', {})
                    team_info = player.get('team', {})
                    
                    name = f"{player_info.get('firstName', '')} {player_info.get('lastName', '')}"
                    team = team_info.get('abbreviation', 'N/A')
                    
                    print(f'{name[:24]:<25} {team:<5} '  # Name and team
                          f'{stats.get("pts", 0):>5} '      # Points
                          f'{stats.get("reb", 0):>5} '      # Rebounds
                          f'{stats.get("ast", 0):>5} '      # Assists
                          f'{stats.get("stl", 0):>5} '      # Steals
                          f'{stats.get("blk", 0):>5} '      # Blocks
                          f'{stats.get("fgPct", 0):>6.1%} '  # FG%
                          f'{stats.get("fg3PtPct", 0):>6.1%} '  # 3P%
                          f'{stats.get("ftPct", 0):>6.1%} '  # FT%
                          f'{stats.get("minSeconds", 0) // 60:>6d} '  # Minutes
                          f'{stats.get("gamesPlayed", 0):>5d}')  # Games Played
            else:
                print("No player stats found in the response")
                print("Available keys:", data.keys())
        else:
            print(f'Error: {response.status_code}')
            print(response.text)
            
    except Exception as e:
        print(f'Request failed: {str(e)}')
    finally:
        session.close()

if __name__ == "__main__":
    if not API_KEY:
        print("Error: MY_SPORTS_FEEDS_API_KEY not found in environment variables")
    else:
        get_nba_stats()

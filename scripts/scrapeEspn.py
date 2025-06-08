import os
import sys
import json
import time
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from supabase import create_client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-us,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
}

def get_player_list(sport):
    """Get list of players for a given sport"""
    if sport == 'boxing':
        return get_boxing_players()
    elif sport == 'nba':
        return get_nba_players()
    elif sport == 'mlb':
        return get_mlb_players()
    elif sport == 'nfl':
        return get_nfl_players()
    return []

def get_boxing_players():
    """Get top 50 boxers"""
    players = []
    # Add logic to scrape top 50 boxers
    return players[:50]

def get_nba_players():
    """Get NBA players"""
    players = []
    # Add NBA player scraping logic
    return players

def get_mlb_players():
    """Get MLB players"""
    players = []
    # Add MLB player scraping logic
    return players

def get_nfl_players():
    """Get NFL players"""
    players = []
    # Add NFL player scraping logic
    return players

def save_player_to_supabase(player):
    """Save player data to Supabase"""
    try:
        result = supabase.table('players').insert({
            'name': player['name'],
            'birth_date': player['birth_date'],
            'sport': player['sport'],
            'team_id': player.get('team_id'),
            'win_shares': player.get('win_shares'),
            'stats': player.get('stats', {})
        }).execute()
        return result
    except Exception as e:
        print(f"Error saving player {player['name']}: {str(e)}")
        return None

def main():
    sports = ['nba', 'mlb', 'nfl', 'boxing']
    for sport in sports:
        print(f"\nScraping {sport.upper()} players...")
        players = get_player_list(sport)
        print(f"Found {len(players)} players")
        
        for player in players:
            print(f"Processing {player['name']}")
            save_player_to_supabase(player)
            time.sleep(1)  # Rate limiting

if __name__ == "__main__":
    main()

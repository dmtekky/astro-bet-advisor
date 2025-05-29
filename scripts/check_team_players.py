import os
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

# Headers for Supabase API requests
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# Get all baseball players
def fetch_all_players():
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/baseball_players",
        headers=headers,
        params={'select': '*'}
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching players: {response.status_code} - {response.text}")
        return []

# Get team by ID
def fetch_team_by_id(team_id):
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/teams",
        headers=headers,
        params={'select': '*', 'id': f'eq.{team_id}'}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data:
            return data[0]
    
    print(f"Error fetching team: {response.status_code} - {response.text}")
    return None

# Test specific team ID from URL
TEAM_ID = "1b8311d5-9f37-4638-9b2d-16ebbeab895a"

team = fetch_team_by_id(TEAM_ID)
if team:
    print(f"Team: {team.get('name', 'Unknown')} ({team.get('abbreviation', 'Unknown')})")
    print(f"External ID: {team.get('external_id', 'Unknown')}")
    
    # Get all players and filter manually
    all_players = fetch_all_players()
    print(f"Total players in database: {len(all_players)}")
    
    # Filter by team abbreviation
    team_abbr = team.get('abbreviation', '').upper()
    players_for_team = []
    
    for player in all_players:
        # Check both abbreviation fields
        current_team_abbr = player.get('player_current_team_abbreviation', '')
        team_abbreviation = player.get('team_abbreviation', '')
        
        if current_team_abbr and current_team_abbr.upper() == team_abbr:
            players_for_team.append(player)
            print(f"Match on player_current_team_abbreviation: {player.get('full_name')} - {current_team_abbr}")
        elif team_abbreviation and team_abbreviation.upper() == team_abbr:
            players_for_team.append(player)
            print(f"Match on team_abbreviation: {player.get('full_name')} - {team_abbreviation}")
    
    print(f"\nFound {len(players_for_team)} players for team {team_abbr}")
    
    if players_for_team:
        print("\nSample players:")
        for player in players_for_team[:5]:
            print(f"Name: {player.get('full_name')}")
            print(f"Position: {player.get('position')}")
            print(f"Number: {player.get('number')}")
            print(f"player_current_team_abbreviation: {player.get('player_current_team_abbreviation')}")
            print(f"team_abbreviation: {player.get('team_abbreviation')}")
            print("-" * 40)
else:
    print(f"Team with ID {TEAM_ID} not found")

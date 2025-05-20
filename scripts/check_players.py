import os
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Initialize Supabase client
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_KEY')

if not url or not key:
    print("Error: Missing Supabase URL or Key in environment variables")
    exit(1)

supabase = create_client(url, key)

# Query the players table
try:
    # First, check if we have any MLB players
    response = supabase.table('players') \
        .select('*') \
        .eq('sport', 'mlb') \
        .limit(5) \
        .execute()
    
    if hasattr(response, 'data') and response.data:
        print("\nFirst 5 MLB players in the database:")
        for i, player in enumerate(response.data, 1):
            print(f"\nPlayer {i}:")
            print(f"Name: {player.get('name')}")
            print(f"ESPN ID: {player.get('espn_id')}")
            print(f"Team: {player.get('team', 'N/A')}")
            print(f"Position: {player.get('position', 'N/A')}")
            print(f"Stats: {player.get('stats', {})}")
    else:
        print("No MLB players found in the database.")
    
    # Get total count of MLB players
    count = supabase.table('players') \
        .select('*', count='exact') \
        .eq('sport', 'mlb') \
        .execute()
        
    if hasattr(count, 'count'):
        print(f"\nTotal MLB players in database: {count.count}")
    
    # Check for any players with stats
    stats_players = supabase.table('players') \
        .select('*') \
        .not_.is_('stats', 'null') \
        .limit(3) \
        .execute()
    
    if hasattr(stats_players, 'data') and stats_players.data:
        print("\nPlayers with stats:")
        for i, player in enumerate(stats_players.data, 1):
            print(f"\nPlayer {i}:")
            print(f"Name: {player.get('name')}")
            print(f"Sport: {player.get('sport', 'N/A')}")
            print(f"Stats: {player.get('stats')}")
    
    # Check the most recently added players
    recent_players = supabase.table('players') \
        .select('*') \
        .order('created_at', desc=True) \
        .limit(5) \
        .execute()
    
    if hasattr(recent_players, 'data') and recent_players.data:
        print("\nMost recently added players:")
        for i, player in enumerate(recent_players.data, 1):
            print(f"\nPlayer {i} (added: {player.get('created_at', 'N/A')}):")
            print(f"Name: {player.get('name')}")
            print(f"Sport: {player.get('sport', 'N/A')}")
            print(f"Team: {player.get('team', 'N/A')}")
            print(f"Position: {player.get('position', 'N/A')}")
            print(f"Has stats: {'Yes' if player.get('stats') else 'No'}")
    
except Exception as e:
    print(f"Error querying database: {str(e)}")

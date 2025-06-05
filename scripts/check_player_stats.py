import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv("PUBLIC_SUPABASE_URL"),
    os.getenv("PUBLIC_SUPABASE_KEY")
)

def check_players():
    """Check if there are any players in the database."""
    try:
        # Get a sample of players
        response = supabase.table('nba_players').select('*').limit(5).execute()
        
        if hasattr(response, 'data') and response.data:
            print(f"Found {len(response.data)} players in the database.")
            print("Sample players:")
            for player in response.data:
                print(f"- {player.get('first_name')} {player.get('last_name')} (ID: {player.get('external_player_id')})")
            return response.data
        else:
            print("No players found in the database.")
            return []
            
    except Exception as e:
        print(f"Error checking players: {str(e)}")
        return []

def check_player_stats(player_id: str):
    """Check if a specific player has stats in the database."""
    try:
        response = supabase.table('nba_player_season_stats') \
            .select('*') \
            .eq('external_player_id', player_id) \
            .execute()
            
        if hasattr(response, 'data') and response.data:
            print(f"Found stats for player ID {player_id}:")
            print(response.data[0])
            return response.data[0]
        else:
            print(f"No stats found for player ID {player_id}")
            return None
            
    except Exception as e:
        print(f"Error checking player stats: {str(e)}")
        return None

if __name__ == "__main__":
    print("=== Checking NBA Players and Stats ===")
    players = check_players()
    
    if players:
        # Check stats for the first player
        first_player_id = players[0].get('external_player_id')
        if first_player_id:
            print("\nChecking stats for first player...")
            check_player_stats(first_player_id)
    
    print("\n=== Check Complete ===")

import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv("PUBLIC_SUPABASE_URL"),
    os.getenv("PUBLIC_SUPABASE_KEY")
)

async def check_stats():
    # Check if the table exists
    try:
        print("Checking nba_player_season_stats table...")
        result = supabase.table('nba_player_season_stats').select('*').limit(5).execute()
        
        if hasattr(result, 'data') and result.data:
            print(f"Found {len(result.data)} records in nba_player_season_stats:")
            for i, stat in enumerate(result.data, 1):
                print(f"\nRecord {i}:")
                for key, value in stat.items():
                    print(f"  {key}: {value}")
                    
            # Check the schema
            print("\nTable schema:")
            first = result.data[0]
            for key in first.keys():
                print(f"- {key} ({type(first[key]).__name__})")
        else:
            print("No data found in nba_player_season_stats table")
            
        # Check players with stats
        print("\nChecking players with stats...")
        players_with_stats = supabase.table('nba_players') \
            .select('id, first_name, last_name, nba_player_season_stats(*)') \
            .not_.is_('nba_player_season_stats', 'null') \
            .limit(5) \
            .execute()
            
        if hasattr(players_with_stats, 'data') and players_with_stats.data:
            print(f"\nFound {len(players_with_stats.data)} players with stats:")
            for player in players_with_stats.data:
                print(f"- {player['first_name']} {player['last_name']} (ID: {player['id']})")
                if 'nba_player_season_stats' in player and player['nba_player_season_stats']:
                    print(f"  Stats: {player['nba_player_season_stats']}")
        else:
            print("No players with stats found")
            
    except Exception as e:
        print(f"Error checking stats: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_stats())

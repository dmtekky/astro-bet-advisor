import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase URL or key in environment variables")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def cleanup_duplicate_teams():
    """Remove teams that don't have the league prefix in their espn_id."""
    try:
        # Get all team IDs that are just numbers (no prefix)
        result = supabase.table('teams') \
            .select('id, espn_id, name, league') \
            .execute()
        
        teams = result.data if hasattr(result, 'data') else []
        
        # Find teams with numeric espn_id (no prefix)
        teams_to_delete = [
            team for team in teams 
            if team.get('espn_id') and team['espn_id'].isdigit()
        ]
        
        if not teams_to_delete:
            print("No duplicate teams found to clean up!")
            return
        
        print(f"Found {len(teams_to_delete)} teams to clean up:")
        for team in teams_to_delete:
            print(f"- {team['name']} (ID: {team['id']}, espn_id: {team['espn_id']}, League: {team['league']})")
        
        # Delete the duplicate teams
        for team in teams_to_delete:
            supabase.table('teams').delete().eq('id', team['id']).execute()
        
        print(f"\nSuccessfully cleaned up {len(teams_to_delete)} teams!")
        
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        raise

if __name__ == "__main__":
    print("Starting cleanup of duplicate teams...")
    cleanup_duplicate_teams()
    print("Cleanup complete!")

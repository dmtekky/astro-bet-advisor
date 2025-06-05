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

def check_table_schema():
    """Check if the nba_player_season_stats table exists and its schema."""
    try:
        # Try to get table info
        response = supabase.rpc('exec_sql', {
            'query': """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'nba_player_season_stats'
                ORDER BY ordinal_position;
            """
        }).execute()
        
        if hasattr(response, 'data') and response.data:
            print("nba_player_season_stats table schema:")
            for col in response.data:
                print(f"- {col['column_name']}: {col['data_type']} (Nullable: {col['is_nullable']})")
            return True
        else:
            print("nba_player_season_stats table does not exist or is empty.")
            return False
            
    except Exception as e:
        print(f"Error checking table schema: {str(e)}")
        return False

def create_table_if_not_exists():
    """Create the nba_player_season_stats table if it doesn't exist."""
    try:
        response = supabase.rpc('exec_sql', {
            'query': """
                CREATE TABLE IF NOT EXISTS public.nba_player_season_stats (
                    external_player_id TEXT PRIMARY KEY REFERENCES nba_players(external_player_id),
                    games_played INTEGER,
                    minutes NUMERIC,
                    points NUMERIC,
                    rebounds NUMERIC,
                    assists NUMERIC,
                    steals NUMERIC,
                    blocks NUMERIC,
                    turnovers NUMERIC,
                    field_goals_made NUMERIC,
                    field_goals_attempted NUMERIC,
                    field_goal_pct NUMERIC,
                    three_point_made NUMERIC,
                    three_point_attempted NUMERIC,
                    three_point_pct NUMERIC,
                    free_throws_made NUMERIC,
                    free_throws_attempted NUMERIC,
                    free_throw_pct NUMERIC,
                    offensive_rebounds NUMERIC,
                    defensive_rebounds NUMERIC,
                    personal_fouls NUMERIC,
                    plus_minus NUMERIC,
                    impact_score NUMERIC,
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_player_id 
                ON nba_player_season_stats(external_player_id);
                
                COMMENT ON TABLE public.nba_player_season_stats IS 'NBA player season statistics';
            """
        }).execute()
        
        print("Successfully created nba_player_season_stats table.")
        return True
        
    except Exception as e:
        print(f"Error creating table: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Checking nba_player_season_stats Table ===")
    
    # First check if table exists
    table_exists = check_table_schema()
    
    if not table_exists:
        print("\nTable does not exist. Creating table...")
        create_table_if_not_exists()
        print("\nTable created. Please re-run the NBA data sync script to populate the stats.")
    else:
        print("\nTable exists. Checking if it has data...")
        # Check if table has any data
        response = supabase.table('nba_player_season_stats').select('*', count='exact').limit(1).execute()
        if hasattr(response, 'count') and response.count > 0:
            print(f"Table has {response.count} records.")
        else:
            print("Table is empty. Please ensure the NBA data sync script is running correctly.")
            print("You may need to run: python3 scripts/nba_data_sync.py")

"""Script to check the database schema for the nba_players table."""
import os
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

async def check_table_schema():
    """Check the schema of the nba_players table."""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Get table columns information
        response = supabase.table('nba_players').select('*').limit(1).execute()
        
        if hasattr(response, 'data') and response.data:
            print("Table 'nba_players' exists with the following columns:")
            if response.data:
                first_row = response.data[0]
                for column_name, value in first_row.items():
                    print(f"- {column_name}: {type(value).__name__}")
                
                # Also print the column names for reference
                print("\nColumn names:")
                print(", ".join([f'"{col}"' for col in first_row.keys()]))
        else:
            print("Table 'nba_players' is empty or does not exist.")
            
    except Exception as e:
        print(f"Error checking table schema: {e}")

if __name__ == "__main__":
    asyncio.run(check_table_schema())

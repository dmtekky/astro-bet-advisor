import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase setup
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase URL or key not found in environment variables.")
    exit(1)

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_table_exists(table_name):
    try:
        # Try to select a single row from the table
        result = supabase.table(table_name).select("*", count="exact").limit(1).execute()
        return True
    except Exception as e:
        print(f"Error checking table {table_name}: {str(e)}")
        return False

def main():
    tables = [
        'players',
        'teams',
        'basketball_stats',
        'baseball_stats',
        'football_stats',
        'soccer_stats',
        'boxing_stats',
        'schedules'
    ]
    
    print("Checking tables in Supabase...")
    all_tables_exist = True
    
    for table in tables:
        exists = check_table_exists(table)
        status = "✅" if exists else "❌"
        print(f"{status} {table}")
        if not exists:
            all_tables_exist = False
    
    if all_tables_exist:
        print("\nAll tables exist! You can now run the scraper.")
    else:
        print("\nSome tables are missing. Please check the SQL migration.")

if __name__ == "__main__":
    main()

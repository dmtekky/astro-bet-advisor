import os
import sys
import glob
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase setup
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase URL or key not found in environment variables.")
    sys.exit(1)

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get all migration files in order
migration_files = sorted(glob.glob('supabase/migrations/*.sql'))

print(f"Found {len(migration_files)} migration files.")

# Apply each migration
for file_path in migration_files:
    print(f"\nApplying migration: {file_path}")
    try:
        with open(file_path, 'r') as f:
            sql = f.read()
        # Split SQL into individual statements and execute them one by one
        for statement in sql.split(';'):
            statement = statement.strip()
            if not statement:
                continue
            print(f"  Executing: {statement[:50]}...")
            try:
                supabase.rpc('exec_sql', {'query': statement}).execute()
            except Exception as e:
                print(f"  Error executing statement: {e}")
                raise
        print(f"Successfully applied {file_path}")
    except Exception as e:
        print(f"Error applying {file_path}: {e}")
        sys.exit(1)

print("\nAll migrations have been applied successfully.")

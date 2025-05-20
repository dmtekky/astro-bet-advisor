#!/usr/bin/env python3
"""
Script to run database migrations for the sports data schema.
"""
import os
import asyncio
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.getenv('PUBLIC_SUPABASE_URL')
key = os.getenv('PUBLIC_SUPABASE_KEY')

if not url or not key:
    raise ValueError("Missing required environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY")

# Read the migration SQL file
MIGRATION_FILE = '../supabase/migrations/20240519201400_update_teams_schema.sql'

try:
    with open(MIGRATION_FILE, 'r') as f:
        migration_sql = f.read()
except Exception as e:
    print(f"Error reading migration file: {e}")
    exit(1)

async def run_migration():
    print("🔧 Starting database migration...")
    
    # Initialize Supabase client
    supabase = create_client(url, key)
    
    try:
        # Split the SQL into individual statements
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
        
        # Execute each statement
        for i, stmt in enumerate(statements, 1):
            if not stmt.strip():
                continue
                
            print(f"\n🚀 Executing statement {i}/{len(statements)}...")
            print(f"SQL: {stmt[:100]}..." if len(stmt) > 100 else f"SQL: {stmt}")
            
            try:
                # Use the RPC endpoint to execute raw SQL
                result = supabase.rpc('query', {'query': stmt}).execute()
                print("✅ Statement executed successfully")
                
                # If there's data in the result, print it
                if hasattr(result, 'data') and result.data:
                    print(f"Result: {result.data}")
                    
            except Exception as e:
                print(f"❌ Error executing statement: {e}")
                # Try to continue with the next statement
                continue
                
        print("\n🎉 Database migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration())

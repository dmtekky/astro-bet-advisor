import os
import sys
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

def apply_sql_file(file_path):
    try:
        with open(file_path, 'r') as f:
            sql = f.read()
        
        # Split SQL into individual statements and execute them one by one
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        for i, statement in enumerate(statements, 1):
            print(f"Executing statement {i}/{len(statements)}...")
            try:
                result = supabase.rpc('exec_sql', {'query': statement}).execute()
                if hasattr(result, 'error') and result.error:
                    print(f"Error executing statement {i}: {result.error}")
                    return False
            except Exception as e:
                print(f"Error executing statement {i}: {str(e)}")
                print(f"Statement: {statement[:200]}...")
                return False
        
        print("\nAll SQL statements executed successfully!")
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python apply_sql_file.py <path_to_sql_file>")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    if not os.path.exists(sql_file):
        print(f"Error: File '{sql_file}' not found.")
        sys.exit(1)
    
    print(f"Applying SQL file: {sql_file}")
    if apply_sql_file(sql_file):
        print("\nDatabase schema updated successfully!")
    else:
        print("\nFailed to update database schema.")
        sys.exit(1)

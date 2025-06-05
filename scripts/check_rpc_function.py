"""Script to check and create the add_column_if_not_exists RPC function if it doesn't exist."""
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

async def check_and_create_rpc_function():
    """Check if the add_column_if_not_exists function exists and create it if it doesn't."""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Check if the function exists
    try:
        # Try to call the function with invalid parameters to see if it exists
        result = supabase.rpc('add_column_if_not_exists', {
            'table_name': 'nonexistent_table',
            'column_name': 'nonexistent_column',
            'column_type': 'TEXT'
        }).execute()
        
        # If we get here, the function exists
        print("The 'add_column_if_not_exists' function already exists.")
        return True
        
    except Exception as e:
        error_msg = str(e)
        if 'function public.add_column_if_not_exists' in error_msg and 'does not exist' in error_msg:
            print("The 'add_column_if_not_exists' function does not exist. Creating it...")
            
            # SQL to create the function
            create_function_sql = """
            CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(
                table_name TEXT,
                column_name TEXT,
                column_type TEXT
            ) RETURNS void AS $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = $1
                    AND column_name = $2
                ) THEN
                    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', $1, $2, $3);
                END IF;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            """
            
            try:
                # Execute the SQL to create the function
                result = supabase.rpc('sql', {'query': create_function_sql}).execute()
                print("Successfully created the 'add_column_if_not_exists' function.")
                return True
            except Exception as create_error:
                print(f"Failed to create the 'add_column_if_not_exists' function: {str(create_error)}")
                return False
        else:
            print(f"Error checking for function: {error_msg}")
            return False

if __name__ == "__main__":
    asyncio.run(check_and_create_rpc_function())

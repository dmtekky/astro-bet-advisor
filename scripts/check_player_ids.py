import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('check_players.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Get Supabase connection details
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

def main():
    """Check player IDs in the database."""
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        logger.error("Missing required environment variables. Please check your .env file.")
        return
    
    try:
        # Initialize Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Fetch a few players to check their IDs
        logger.info("Fetching players from the database...")
        response = supabase.table('nba_players').select('external_player_id, first_name, last_name').limit(5).execute()
        
        if not hasattr(response, 'data') or not response.data:
            logger.error("No players found in the database.")
            return
        
        logger.info("Found players:")
        for player in response.data:
            logger.info(f"Name: {player.get('first_name')} {player.get('last_name')}")
            logger.info(f"  ID: {player.get('external_player_id')}")
            logger.info("")
            
    except Exception as e:
        logger.error(f"Error fetching players: {str(e)}")

if __name__ == "__main__":
    main()

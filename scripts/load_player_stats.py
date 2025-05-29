import os
import json
import logging
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from ohmysportsfeedspy import MySportsFeeds

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class PlayerStatsLoader:
    def __init__(self):
        """Initialize the PlayerStatsLoader with API and database connections."""
        self.msf_api = self._init_mysportsfeeds()
        self.supabase = self._init_supabase()
        self.current_season = datetime.now().year  # Default to current year
        
    def _init_mysportsfeeds(self):
        """Initialize the MySportsFeeds API client."""
        api_key = os.getenv('MY_SPORTS_FEEDS_API_KEY')
        password = os.getenv('MY_SPORTS_FEEDS_PASSWORD')
        
        if not api_key or not password:
            raise ValueError("MySportsFeeds API key and password must be set in .env file")
            
        # Initialize the client with authentication
        msf = MySportsFeeds(version="2.0")
        msf.authenticate(api_key, password)
        return msf
    
    def _init_supabase(self):
        """Initialize the Supabase client."""
        supabase_url = os.getenv('PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('PUBLIC_SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase URL and service role key must be set in .env file")
            
        return create_client(supabase_url, supabase_key)
    
    def get_team_abbreviation(self, team_id):
        """Get team abbreviation by team ID."""
        try:
            response = self.supabase.table('teams').select('abbreviation').eq('id', team_id).execute()
            if response.data:
                return response.data[0]['abbreviation']
            return None
        except Exception as e:
            logger.error(f"Error fetching team abbreviation: {e}")
            return None
    
    def get_player_external_id(self, player_id):
        """Get player's external ID by player ID."""
        try:
            response = self.supabase.table('players').select('external_id').eq('id', player_id).execute()
            if response.data:
                return response.data[0]['external_id']
            return None
        except Exception as e:
            logger.error(f"Error fetching player external ID: {e}")
            return None
    
    def fetch_players_from_db(self):
        """Fetch all players from the database."""
        try:
            response = self.supabase.table('players').select('*').execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching players from database: {e}")
            return []
    
    def fetch_and_store_team_player_stats(self, team_abbrev='nyy'):
        """Fetch all player stats for a team and update the database."""
        logger.info(f"Fetching all player stats for team: {team_abbrev}")
        try:
            team_stats = self.msf_api.msf_get_data(
                league='mlb',
                season='current',
                feed='seasonal_player_stats',
                format='json',
                team=team_abbrev.lower(),
                force='true'
            )
            player_stats_totals = team_stats.get('playerStatsTotals', [])
            logger.info(f"Found {len(player_stats_totals)} players for team {team_abbrev}")
            for entry in player_stats_totals:
                player = entry.get('player', {})
                stats = entry.get('stats', {})
                player_id = player.get('id')
                first_name = player.get('firstName', '')
                last_name = player.get('lastName', '')
                logger.info(f"Processing player {player_id}: {first_name} {last_name}")
                # Insert/update player stats in the database (customize as needed)
                self._upsert_player_stats(player, stats, team_abbrev)
            logger.info(f"Finished processing all players for {team_abbrev}")
        except Exception as e:
            logger.error(f"Failed to fetch or process player stats for {team_abbrev}: {e}")

    def _map_player_stats(self, player_entry, team_abbrev):
        """Map MySportsFeeds API response to our database schema.
        
        Args:
            player_entry: The player entry from the API response
            team_abbrev: The team abbreviation
            
        Returns:
            dict: Mapped player stats ready for database insertion
        """
        # Extract player info - handle both nested and flat structures
        if 'player' in player_entry and isinstance(player_entry['player'], dict):
            player = player_entry['player']
            stats = player_entry.get('stats', {})
        else:
            player = player_entry
            stats = {}
            # Try to extract stats from the player entry
            for key in ['batting', 'pitching', 'fielding']:
                if key in player_entry:
                    stats[key] = player_entry[key]
        
        # Default values
        data = {
            'player_external_id': str(player.get('id', '')),
            'jersey_number': player.get('jerseyNumber', ''),
            'primary_position': player.get('primaryPosition', ''),
            'team_abbreviation': team_abbrev.upper(),
            'season': datetime.now().year,  # Current season
            'updated_at': datetime.utcnow().isoformat(),
            'first_name': player.get('firstName', ''),
            'last_name': player.get('lastName', '')
        }
        
        # Helper function to safely get numeric values
        def get_numeric(data, key, default=0):
            value = data.get(key, default)
            if value == '':
                return default
            try:
                return float(value) if '.' in str(value) else int(value)
            except (ValueError, TypeError):
                return default
        
        # Map batting stats if available
        batting = stats.get('batting', {})
        if batting:
            # Handle case where stats might be in a nested 'stat' object
            if 'stat' in batting and isinstance(batting['stat'], dict):
                batting = batting['stat']
                
            data.update({
                'games_played': get_numeric(batting, 'gamesPlayed'),
                'at_bats': get_numeric(batting, 'atBats'),
                'runs': get_numeric(batting, 'runs'),
                'hits': get_numeric(batting, 'hits'),
                'doubles': get_numeric(batting, 'doubles'),
                'triples': get_numeric(batting, 'triples'),
                'home_runs': get_numeric(batting, 'homeRuns'),
                'rbi': get_numeric(batting, 'rbi'),
                'stolen_bases': get_numeric(batting, 'stolenBases'),
                'caught_stealing': get_numeric(batting, 'caughtStealing'),
                'walks': get_numeric(batting, 'baseOnBalls'),
                'strikeouts': get_numeric(batting, 'strikeOuts'),
                'batting_avg': get_numeric(batting, 'avg'),
                'on_base_pct': get_numeric(batting, 'obp'),
                'slugging_pct': get_numeric(batting, 'slg'),
                'ops': get_numeric(batting, 'ops')
            })
            
        # Map pitching stats if available
        pitching = stats.get('pitching', {})
        if pitching:
            # Handle case where stats might be in a nested 'stat' object
            if 'stat' in pitching and isinstance(pitching['stat'], dict):
                pitching = pitching['stat']
                
            data.update({
                'wins': get_numeric(pitching, 'wins'),
                'losses': get_numeric(pitching, 'losses'),
                'era': get_numeric(pitching, 'era'),
                'games_pitched': get_numeric(pitching, 'gamesPlayed'),
                'games_started': get_numeric(pitching, 'gamesStarted'),
                'saves': get_numeric(pitching, 'saves'),
                'innings_pitched': get_numeric(pitching, 'inningsPitched'),
                'hits_allowed': get_numeric(pitching, 'hits'),
                'runs_allowed': get_numeric(pitching, 'runs'),
                'earned_runs': get_numeric(pitching, 'earnedRuns'),
                'home_runs_allowed': get_numeric(pitching, 'homeRuns'),
                'walks_allowed': get_numeric(pitching, 'baseOnBalls'),
                'strikeouts_pitched': get_numeric(pitching, 'strikeOuts'),
                'whip': get_numeric(pitching, 'whip')
            })
            
        # Map fielding stats if available
        fielding = stats.get('fielding', {})
        if fielding:
            # Handle case where stats might be in a nested 'stat' object
            if 'stat' in fielding and isinstance(fielding['stat'], dict):
                fielding = fielding['stat']
                
            data.update({
                'fielding_pct': get_numeric(fielding, 'fieldingPct'),
                'errors': get_numeric(fielding, 'errors'),
                'assists': get_numeric(fielding, 'assists'),
                'putouts': get_numeric(fielding, 'putOuts')
            })
            
        # Clean up None values
        data = {k: v for k, v in data.items() if v is not None}
        return data
        
    def _upsert_player_stats(self, player, stats, team_abbrev):
        """Insert or update player stats in the Supabase database."""
        try:
            # Create a combined entry with player and stats to match what _map_player_stats expects
            player_entry = {
                'player': player,
                'stats': stats
            }
            
            # Map the player stats to our database schema
            data = self._map_player_stats(player_entry, team_abbrev)
            
            # Get the player's internal ID from our database using the external ID
            player_id = self._get_player_id_by_external_id(data['player_external_id'])
            if player_id:
                data['player_id'] = player_id
            
            # Get the team's internal ID from our database using the team abbreviation
            team_id = self._get_team_id_by_abbreviation(team_abbrev.upper())
            if team_id:
                data['team_id'] = team_id
            
            # Upsert into baseball_stats table
            self.supabase.table('baseball_stats').upsert(data, on_conflict='player_external_id,season,team_abbreviation').execute()
            logger.info(f"Upserted stats for player {player.get('id')} ({player.get('firstName')} {player.get('lastName')}) - {team_abbrev}")
            return True
        except Exception as e:
            logger.error(f"Failed to upsert stats for player {player.get('id')}: {e}")
            return False
            
    def _get_player_id_by_external_id(self, external_id):
        """Get the internal player ID using the external ID."""
        try:
            result = self.supabase.table('players') \
                .select('id') \
                .eq('external_id', external_id) \
                .execute()
            if result.data and len(result.data) > 0:
                return result.data[0]['id']
            return None
        except Exception as e:
            logger.warning(f"Error getting player ID for external ID {external_id}: {e}")
            return None
            
    def _get_team_id_by_abbreviation(self, abbreviation):
        """Get the internal team ID using the team abbreviation."""
        try:
            result = self.supabase.table('teams') \
                .select('id') \
                .ilike('abbreviation', f'%{abbreviation}%') \
                .execute()
            if result.data and len(result.data) > 0:
                return result.data[0]['id']
            return None
        except Exception as e:
            logger.warning(f"Error getting team ID for abbreviation {abbreviation}: {e}")
            return None
    
    def process_player_stats(self, player_id, stats_data):
        """Process and insert/update player statistics in the database."""
        try:
            # Call the database function to upsert the stats
            result = self.supabase.rpc('upsert_baseball_stats', {
                'p_player_id': player_id,
                'p_player_external_id': str(stats_data.get('player', {}).get('id', '')),
                'p_season': self.current_season,
                'p_team_id': None,  # Will be set by the function if team exists
                'p_team_abbreviation': stats_data.get('team', {}).get('abbreviation', ''),
                'p_stats': json.dumps(stats_data)
            }).execute()
            
            logger.info(f"Processed stats for player {player_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing stats for player {player_id}: {e}")
            return False
    
    def run(self):
        """Main method to load player statistics."""
        logger.info("Starting player stats loading process for all MLB teams...")
        MLB_TEAMS = [
            'ari', 'atl', 'bal', 'bos', 'chc', 'cws', 'cin', 'cle', 'col', 'det',
            'hou', 'kc', 'laa', 'lad', 'mia', 'mil', 'min', 'nym', 'nyy', 'oak',
            'phi', 'pit', 'sd', 'sea', 'sf', 'stl', 'tb', 'tex', 'tor', 'was'
        ]
        
        # Add a delay between API calls (in seconds) to avoid rate limiting
        DELAY_BETWEEN_TEAMS = 15  # 15 seconds between team requests
        
        try:
            for i, team_abbrev in enumerate(MLB_TEAMS):
                logger.info(f"Processing team: {team_abbrev.upper()} ({i+1}/{len(MLB_TEAMS)})")
                
                # Add delay for all but the first team
                if i > 0:
                    logger.info(f"Waiting {DELAY_BETWEEN_TEAMS} seconds before next team...")
                    time.sleep(DELAY_BETWEEN_TEAMS)
                
                try:
                    self.fetch_and_store_team_player_stats(team_abbrev)
                except Exception as e:
                    logger.error(f"Error processing team {team_abbrev.upper()}: {e}")
                    # Add extra delay on error before continuing
                    time.sleep(5)
                    continue
                    
            logger.info("Finished loading player stats for all teams.")
        except Exception as e:
            logger.error(f"An error occurred during player stats loading for all teams: {e}")
            raise

if __name__ == "__main__":
    try:
        loader = PlayerStatsLoader()
        loader.run()
    except Exception as e:
        logger.exception("An error occurred during player stats loading")
        raise

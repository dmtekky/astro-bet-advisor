import os
import sys
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Dict, Any, Optional

# Load environment variables
load_dotenv()

# Constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPORTSDATA_API_KEY = os.getenv("SPORTSDATA_MLB_KEY")
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")

# SportsData.io API endpoints
BASE_URL = "https://api.sportsdata.io/v3/mlb/scores/json"
GAMES_ENDPOINT = f"{BASE_URL}/Games"
LEAGUES_ENDPOINT = f"{BASE_URL}/Leagues"
TEAMS_ENDPOINT = f"{BASE_URL}/AllTeams"

class SportsDataFetcher:
    def __init__(self):
        self.headers = {"Ocp-Apim-Subscription-Key": SPORTSDATA_API_KEY}
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.league_cache = {}
        self.team_cache = {}

    def get_league_id(self, external_id: int = 1) -> Optional[str]:
        """Get the internal UUID for the specified league by external_id."""
        if not self.league_cache:
            result = self.supabase.table("leagues").select("id,external_id").execute()
            if result.data:
                self.league_cache = {item["external_id"]: item["id"] for item in result.data}
        
        return self.league_cache.get(external_id)

    def get_team_id(self, external_id: int) -> Optional[str]:
        """Get the internal UUID for a team by its external ID."""
        if not external_id:
            return None
            
        if not self.team_cache:
            result = self.supabase.table("teams").select("id,external_id,abbreviation").execute()
            if result.data:
                # Map by external_id and also by common abbreviations for fallback
                for item in result.data:
                    self.team_cache[item["external_id"]] = item["id"]
                    
                    # Create a mapping of common abbreviations to team IDs
                    if item.get("abbreviation"):
                        self.team_cache[item["abbreviation"]] = item["id"]
        
        # Try direct lookup first
        team_id = self.team_cache.get(external_id)
        
        # If not found, try converting to string in case the ID is a string in the cache
        if not team_id and isinstance(external_id, (int, str)):
            team_id = self.team_cache.get(str(external_id))
            
        return team_id

    def fetch_games(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Fetch MLB games for the specified season."""
        # First try to get games for the specified season
        season_url = f"{GAMES_ENDPOINT}/{season}"
        response = requests.get(season_url, headers=self.headers)
        
        # If no games found for the specified season, try the current season
        if response.status_code == 400 and "No games found" in response.text:
            print(f"No games found for season {season}, trying current season...")
            response = requests.get(GAMES_ENDPOINT, headers=self.headers)
            
        response.raise_for_status()
        return response.json()

    def process_and_store_games(self, games_data: List[Dict[str, Any]]) -> None:
        """Process and store games data in the database."""
        # Get MLB league by external_id = 1
        league_id = self.get_league_id(1)
        if not league_id:
            print("Error: Could not find MLB league in the database")
            return

        success_count = 0
        error_count = 0
        skipped_count = 0

        for game in games_data:
            try:
                game_data = self.prepare_game_data(game, league_id)
                if not game_data:
                    skipped_count += 1
                    continue

                # Check if game already exists
                existing_game = self.supabase.table("games") \
                    .select("id") \
                    .eq("external_id", game_data["external_id"]) \
                    .execute()

                if existing_game.data:
                    # Update existing game
                    self.supabase.table("games") \
                        .update(game_data) \
                        .eq("external_id", game_data["external_id"]) \
                        .execute()
                    success_count += 1
                    if success_count % 10 == 0:  # Print progress
                        print(f"Processed {success_count} games...")
                else:
                    # Insert new game
                    self.supabase.table("games").insert(game_data).execute()
                    success_count += 1
                    if success_count % 10 == 0:  # Print progress
                        print(f"Processed {success_count} games...")


            except Exception as e:
                error_count += 1
                if error_count < 10:  # Only print first 10 errors to avoid flooding
                    print(f"Error processing game {game.get('GameID')}: {str(e)}")
                elif error_count == 10:
                    print("Too many errors, suppressing further error messages...")

        print(f"\nProcessing complete!")
        print(f"Successfully processed: {success_count}")
        print(f"Skipped: {skipped_count}")
        print(f"Errors: {error_count}")

    def prepare_game_data(self, game: Dict[str, Any], league_id: str) -> Optional[Dict[str, Any]]:
        """Prepare game data for database insertion."""
        try:
            # Safely parse datetime
            game_time_utc = datetime.strptime(game.get("DateTime", ""), "%Y-%m-%dT%H:%M:%S")
            game_time_local = game_time_utc - timedelta(hours=4)  # Convert to local time (ET)
            
            # Handle team IDs
            home_team_id = self.get_team_id(game.get("HomeTeamID"))
            away_team_id = self.get_team_id(game.get("AwayTeamID"))
            
            # If we can't find team IDs, try alternative fields
            if not home_team_id and "HomeTeam" in game:
                home_team_id = self.get_team_id(game["HomeTeam"])
            if not away_team_id and "AwayTeam" in game:
                away_team_id = self.get_team_id(game["AwayTeam"])
            
            if not home_team_id or not away_team_id:
                print(f"Skipping game {game.get('GameID')}: Could not find team IDs in database")
                print(f"  Home Team ID: {game.get('HomeTeamID')}, Away Team ID: {game.get('AwayTeamID')}")
                print(f"  Home Team: {game.get('HomeTeam')}, Away Team: {game.get('AwayTeam')}")
                return None

            # Safely get scores with defaults
            home_score = game.get("HomeTeamRuns")
            away_score = game.get("AwayTeamRuns")
            
            # Prepare the game data
            game_data = {
                "external_id": game.get("GameID"),
                "league_id": league_id,
                "season": game.get("Season"),
                "season_type": str(game.get("SeasonType", "")).lower(),
                "game_date": game_time_utc.date().isoformat(),
                "game_time_utc": game_time_utc.isoformat(),
                "game_time_local": game_time_local.isoformat(),
                "status": self.map_game_status(game.get("Status"), home_score, away_score),
                "period": game.get("Inning"),
                "period_time_remaining": game.get("InningHalf"),
                "home_team_id": home_team_id,
                "away_team_id": away_team_id,
                "venue_id": home_team_id,  # Using home team's venue
                "home_score": home_score,
                "away_score": away_score,
                "home_odds": game.get("HomeTeamMoneyLine"),
                "away_odds": game.get("AwayTeamMoneyLine"),
                "over_under": game.get("OverUnder"),
                "spread": game.get("PointSpread"),
                "attendance": game.get("Attendance"),
                "broadcasters": [game.get("Broadcast")] if game.get("Broadcast") else [],
                "notes": game.get("Notes"),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            return game_data
            
        except Exception as e:
            print(f"Error preparing game data for game {game.get('GameID')}: {str(e)}")
            return None

    @staticmethod
    def map_game_status(status, home_score: int = None, away_score: int = None) -> str:
        """Map SportsData.io status to our internal status."""
        if status is None:
            return "scheduled"
            
        # Handle case where status might be an integer or other type
        status_str = str(status).lower() if status is not None else ""
        
        if "scheduled" in status_str:
            return "scheduled"
        elif "inprogress" in status_str or "in progress" in status_str:
            return "in_progress"
        elif "final" in status_str:
            return "final"
        elif "postponed" in status_str:
            return "postponed"
        elif "cancel" in status_str:
            return "canceled"
        elif home_score is not None and away_score is not None:
            return "final"  # If scores exist, consider it final
        return "scheduled"  # Default to scheduled

def main():
    if not SPORTSDATA_API_KEY or SPORTSDATA_API_KEY == "your_mlb_api_key_here":
        print("Error: SPORTSDATA_MLB_KEY not set in .env file")
        sys.exit(1)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase credentials not found in .env file")
        sys.exit(1)
    
    try:
        fetcher = SportsDataFetcher()
        
        current_year = datetime.now().year
        print(f"Fetching MLB games for {current_year} season...")
        games = fetcher.fetch_games(current_year)
        
        if not games:
            print("No games found in the API response")
            return
            
        print(f"Processing {len(games)} games...")
        fetcher.process_and_store_games(games)
        
        print("Done!")
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from SportsData.io: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

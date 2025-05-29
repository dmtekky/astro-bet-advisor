import os
from ohmysportsfeedspy import MySportsFeeds
from dotenv import load_dotenv

class MySportsFeedsTester:
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()
        
        # Get API credentials from environment variables
        self.api_key = os.getenv('MY_SPORTS_FEEDS_API_KEY')
        self.password = os.getenv('MY_SPORTS_FEEDS_PASSWORD')
        
        # Initialize the MySportsFeeds client (v2.0)
        self.msf = MySportsFeeds(version="2.0")
        
        # Authenticate with the API
        self.msf.authenticate(self.api_key, self.password)
    
    def test_standings(self):
        """Test fetching MLB standings"""
        try:
            print("Fetching MLB standings...")
            standings = self.msf.msf_get_data(
                league='mlb',
                season='current',
                feed='seasonal_standings',
                format='json',
                force='true'  # Force update from the API
            )
            print("MLB Standings:")
            if 'teams' in standings:
                print(f"Number of teams: {len(standings['teams'])}")
            else:
                print("No teams data found in response")
                print("Available keys:", standings.keys())
            return True
        except Exception as e:
            print(f"Error fetching standings: {str(e)}")
            return False
        
    def test_player_stats(self, team_abbrev='nyy'):
        """Test fetching player stats for a specific team"""
        try:
            print(f"\nFetching player stats for team: {team_abbrev}")
            player_stats = self.msf.msf_get_data(
                league='mlb',
                season='current',
                feed='seasonal_player_stats',
                format='json',
                team=team_abbrev,  # Team abbreviation (e.g., 'nyy' for New York Yankees)
                force='true'  # Force update from the API
            )
            
            # Print the raw response structure for debugging
            print("\nRaw response structure:")
            print("-" * 50)
            print(player_stats)
            print("-" * 50)
            
            # Print some sample player stats
            print("\nSample Player Stats:")
            
            return player_stats
        except Exception as e:
            print(f"Error fetching player stats: {str(e)}")
            return None
        
    def process_player_stats(self, player_stats):
        """Process and display player stats from the API response"""
        if not player_stats:
            print("No player stats data to process")
            return False
            
        print("\nResponse structure:")
        print("Top-level keys in response:", list(player_stats.keys()))
        
        # Check if we have the expected data structure
        if 'playerStatsTotals' in player_stats and player_stats['playerStatsTotals']:
            player_stats_totals = player_stats['playerStatsTotals']
            
            # Handle case where playerStatsTotals is a list
            if isinstance(player_stats_totals, list):
                print(f"\nFound {len(player_stats_totals)} players in playerStatsTotals list")
                
                # Process each player in the list
                for i, player_entry in enumerate(player_stats_totals[:5]):  # Show first 5 players
                    try:
                        print(f"\n--- Player {i+1} ---")
                        
                        # The player entry might be the player data directly
                        if isinstance(player_entry, dict):
                            # Check if there's a nested player object
                            if 'player' in player_entry and isinstance(player_entry['player'], dict):
                                player_info = player_entry['player']
                                print(f"Name: {player_info.get('firstName', 'N/A')} {player_info.get('lastName', 'N/A')}")
                                print(f"Position: {player_info.get('primaryPosition', 'N/A')}")
                                print(f"Jersey: {player_info.get('jerseyNumber', 'N/A')}")
                            
                            # Print all available stats
                            if 'stats' in player_entry and isinstance(player_entry['stats'], dict):
                                print("\nStats:")
                                self._print_stats(player_entry['stats'])
                            
                            # Print player info directly if no nested player object
                            elif any(key in player_entry for key in ['firstName', 'lastName', 'jerseyNumber']):
                                print(f"Name: {player_entry.get('firstName', 'N/A')} {player_entry.get('lastName', 'N/A')}")
                                print(f"Position: {player_entry.get('primaryPosition', 'N/A')}")
                                print(f"Jersey: {player_entry.get('jerseyNumber', 'N/A')}")
                                self._print_stats({k: v for k, v in player_entry.items() 
                                                 if k not in ['firstName', 'lastName', 'jerseyNumber', 'primaryPosition']})
                        
                    except Exception as e:
                        print(f"Error processing player {i+1}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                
                return True
                
            # Handle case where playerStatsTotals is a dictionary
            elif isinstance(player_stats_totals, dict):
                print("\nplayerStatsTotals is a dictionary with keys:", player_stats_totals.keys())
                
                # Try to find player stats in different possible locations
                players = None
                if 'player' in player_stats_totals:
                    players = player_stats_totals['player']
                elif 'playerStats' in player_stats_totals:
                    players = player_stats_totals['playerStats']
                
                if players:
                    if not isinstance(players, list):
                        players = [players]  # Convert single player to list for consistency
                    
                    print(f"\nFound {len(players)} players in the response")
                    
                    # Show stats for first 5 players or all if less than 5
                    for i, player in enumerate(players[:5]):
                        try:
                            print(f"\n--- Player {i+1} ---")
                            
                            # Extract player info
                            if isinstance(player, dict):
                                if 'player' in player and isinstance(player['player'], dict):
                                    player_info = player['player']
                                    print(f"Name: {player_info.get('firstName', 'N/A')} {player_info.get('lastName', 'N/A')}")
                                    print(f"Position: {player_info.get('primaryPosition', 'N/A')}")
                                    print(f"Jersey: {player_info.get('jerseyNumber', 'N/A')}")
                                
                                # Print all available stats
                                if 'stats' in player and isinstance(player['stats'], dict):
                                    print("\nStats:")
                                    self._print_stats(player['stats'])
                                
                                # Print player info directly if no nested player object
                                elif any(key in player for key in ['firstName', 'lastName', 'jerseyNumber']):
                                    print(f"Name: {player.get('firstName', 'N/A')} {player.get('lastName', 'N/A')}")
                                    print(f"Position: {player.get('primaryPosition', 'N/A')}")
                                    print(f"Jersey: {player.get('jerseyNumber', 'N/A')}")
                                    self._print_stats({k: v for k, v in player.items() 
                                                     if k not in ['firstName', 'lastName', 'jerseyNumber', 'primaryPosition']})
                            
                        except Exception as e:
                            print(f"Error processing player {i+1}: {str(e)}")
                            import traceback
                            traceback.print_exc()
                    
                    return True
                else:
                    print("\nCould not find player data in the expected structure.")
            else:
                print(f"\nUnexpected type for playerStatsTotals: {type(player_stats_totals)}")
        else:
            print("\nUnexpected response structure. Available keys:", player_stats.keys())
            if 'playerStatsTotals' in player_stats:
                print("Type of 'playerStatsTotals':", type(player_stats['playerStatsTotals']))
            if 'references' in player_stats:
                print("References available in the response")
        
        return False
    
    def _print_stats(self, stats_dict, indent=0):
        """Helper method to print stats with proper indentation"""
        if not isinstance(stats_dict, dict):
            print(" " * indent + str(stats_dict))
            return
            
        for key, value in stats_dict.items():
            if isinstance(value, dict):
                if '#text' in value:
                    print(" " * indent + f"{key}: {value['#text']}")
                else:
                    print(" " * indent + f"{key}:")
                    self._print_stats(value, indent + 2)
            elif isinstance(value, (list, tuple)):
                print(" " * indent + f"{key}:")
                for i, item in enumerate(value):
                    print(" " * (indent + 2) + f"Item {i+1}:")
                    self._print_stats(item, indent + 4)
            else:
                print(" " * indent + f"{key}: {value}")


def main():
    print("Testing MySportsFeeds API...")
    tester = MySportsFeedsTester()
    
    # Test standings
    print("\n=== Testing Standings ===")
    standings_success = tester.test_standings()
    
    # Test player stats
    print("\n=== Testing Player Stats ===")
    player_stats = tester.test_player_stats(team_abbrev='nyy')  # NY Yankees
    if player_stats is not None:
        tester.process_player_stats(player_stats)
    
    print("\nTest completed!")


if __name__ == "__main__":
    main()

import requests
import os
import base64
from dotenv import load_dotenv
import json
import supabase
from datetime import datetime

# Load environment variables
load_dotenv()

# MySportsFeeds API credentials
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')

# Supabase credentials
SUPABASE_URL = os.getenv('PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('PUBLIC_SUPABASE_KEY')

if not all([MSF_API_KEY, MSF_PASSWORD, SUPABASE_URL, SUPABASE_KEY]):
    raise ValueError("Missing required environment variables")

# Initialize Supabase client
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# API endpoint details
season_string = "2025-regular"
league = "mlb"
feed = "player_stats_totals"
api_format = "json"

url = f"https://api.mysportsfeeds.com/v2.1/pull/{league}/{season_string}/{feed}.{api_format}"

print("Fetching player data from MySportsFeeds...")

# Prepare authentication header
auth_header = base64.b64encode(f"{MSF_API_KEY}:{MSF_PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {
    "Authorization": f"Basic {auth_header}"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    api_data = response.json()

    if not api_data.get('playerStatsTotals'):
        print("No player data found in the response!")
        exit(1)

    players = api_data['playerStatsTotals']
    print(f"Found {len(players)} players to process")

    # Process each player
    for player_data in players:
        try:
            player = player_data.get('player', {})
            stats = player_data.get('stats', {})
            team = player.get('currentTeam', {})

            # Create player record
            player_record = {
                # Core Info
                'player_id': player.get('id'),
                'player_first_name': player.get('firstName'),
                'player_last_name': player.get('lastName'),
                'player_full_name': player.get('fullName'),
                'player_primary_position': player.get('primaryPosition'),
                'player_jersey_number': player.get('jerseyNumber'),

                # Personal Info
                'player_age': player.get('age'),
                'player_birth_city': player.get('birthCity'),
                'player_birth_country': player.get('birthCountry'),
                'player_birth_date': player.get('birthDate'),
                'player_height': player.get('height'),
                'player_weight': player.get('weight'),

                # Contact Info
                'player_college': player.get('college'),
                'player_high_school': player.get('highSchool'),
                'player_official_image_src': player.get('officialImageSrc'),
                'player_social_media_accounts': player.get('socialMediaAccounts'),

                # Team Info
                'player_current_team_id': team.get('id'),
                'player_current_team_abbreviation': team.get('abbreviation'),
                'player_current_roster_status': player.get('currentRosterStatus'),
                'player_current_injury': player.get('currentInjury'),

                # Physical Info
                'player_handedness_bats': player.get('handedness', {}).get('bats'),
                'player_handedness_throws': player.get('handedness', {}).get('throws'),
                'player_rookie': player.get('rookie'),

                # Team Info
                'team_id': team.get('id'),
                'team_abbreviation': team.get('abbreviation'),

                # Stats - Batting
                'stats_batting_at_bats': stats.get('batting', {}).get('atBats'),
                'stats_batting_batting_avg': stats.get('batting', {}).get('battingAvg'),
                'stats_batting_on_base_pct': stats.get('batting', {}).get('onBasePct'),
                'stats_batting_slugging_pct': stats.get('batting', {}).get('sluggingPct'),
                'stats_batting_on_base_plus_slugging_pct': stats.get('batting', {}).get('onBasePlusSluggingPct'),
                'stats_batting_hits': stats.get('batting', {}).get('hits'),
                'stats_batting_homeruns': stats.get('batting', {}).get('homeruns'),
                'stats_batting_runs': stats.get('batting', {}).get('runs'),
                'stats_batting_runs_batted_in': stats.get('batting', {}).get('runsBattedIn'),
                'stats_batting_walks': stats.get('batting', {}).get('walks'),
                'stats_batting_strikeouts': stats.get('batting', {}).get('strikeouts'),
                'stats_batting_stolen_bases': stats.get('batting', {}).get('stolenBases'),
                'stats_batting_caught_base_steals': stats.get('batting', {}).get('caughtBaseSteals'),
                'stats_batting_double_plays': stats.get('batting', {}).get('doublePlays'),
                'stats_batting_triple_plays': stats.get('batting', {}).get('triplePlays'),
                'stats_batting_left_on_base': stats.get('batting', {}).get('leftOnBase'),

                # Stats - Pitching
                'stats_pitching_wins': stats.get('pitching', {}).get('wins'),
                'stats_pitching_losses': stats.get('pitching', {}).get('losses'),
                'stats_pitching_saves': stats.get('pitching', {}).get('saves'),
                'stats_pitching_holds': stats.get('pitching', {}).get('holds'),
                'stats_pitching_earned_run_avg': stats.get('pitching', {}).get('earnedRunAvg'),
                'stats_pitching_innings_pitched': stats.get('pitching', {}).get('inningsPitched'),
                'stats_pitching_hits_allowed': stats.get('pitching', {}).get('hitsAllowed'),
                'stats_pitching_homeruns_allowed': stats.get('pitching', {}).get('homerunsAllowed'),
                'stats_pitching_walks_allowed': stats.get('pitching', {}).get('walksAllowed'),
                'stats_pitching_strikeouts': stats.get('pitching', {}).get('strikeouts'),
                'stats_pitching_batters_hit': stats.get('pitching', {}).get('battersHit'),
                'stats_pitching_wild_pitches': stats.get('pitching', {}).get('wildPitches'),
                'stats_pitching_balks': stats.get('pitching', {}).get('balks'),
                'stats_pitching_shutouts': stats.get('pitching', {}).get('shutouts'),
                'stats_pitching_save_opportunities': stats.get('pitching', {}).get('saveOpportunities'),
                'stats_pitching_games_finished': stats.get('pitching', {}).get('gamesFinished'),
                'stats_pitching_completed_games': stats.get('pitching', {}).get('completedGames'),

                # Stats - Fielding
                'stats_fielding_fielding_pct': stats.get('fielding', {}).get('fieldingPct'),
                'stats_fielding_range_factor': stats.get('fielding', {}).get('rangeFactor'),
                'stats_fielding_assists': stats.get('fielding', {}).get('assists'),
                'stats_fielding_errors': stats.get('fielding', {}).get('errors'),
                'stats_fielding_put_outs': stats.get('fielding', {}).get('putOuts'),
                'stats_fielding_double_plays': stats.get('fielding', {}).get('doublePlays'),
                'stats_fielding_triple_plays': stats.get('fielding', {}).get('triplePlays'),
                'stats_fielding_passed_balls': stats.get('fielding', {}).get('passedBalls'),
                'stats_fielding_caught_stealing': stats.get('fielding', {}).get('caughtStealing'),
                'stats_fielding_stolen_bases_allowed': stats.get('fielding', {}).get('stolenBasesAllowed'),

                # Misc Stats
                'stats_games_played': stats.get('gamesPlayed'),
                'stats_miscellaneous_games_started': stats.get('miscellaneous', {}).get('gamesStarted'),

                # JSONB fields for detailed stats
                'stats_batting_details': json.dumps(stats.get('batting', {})),
                'stats_pitching_details': json.dumps(stats.get('pitching', {})),
                'stats_fielding_details': json.dumps(stats.get('fielding', {})),
            }

            # Remove None values
            player_record = {k: v for k, v in player_record.items() if v is not None}

            # Insert or update player
            result = supabase_client.table('baseball_players').upsert([player_record]).execute()
            if result.error:
                print(f"Error inserting player {player.get('fullName')}: {str(result.error)}")
            else:
                print(f"Successfully inserted/updated player: {player.get('fullName')}")
                print(f"  Data: {result.data}")

            # Handle Supabase response
            if result.error:
                print(f"Error inserting player {player.get('fullName')}: {str(result.error)}")
            else:
                print(f"Successfully inserted/updated player: {player.get('fullName')}")
                print(f"  Data: {result.data}")

        except Exception as e:
            print(f"Error processing player {player.get('fullName')}: {str(e)}")
            continue

    print("\nPlayer ingestion complete!")

except Exception as e:
    print(f"An error occurred: {e}")

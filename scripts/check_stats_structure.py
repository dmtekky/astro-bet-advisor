#!/usr/bin/env python3
"""
Check the structure of the fetched player statistics.
"""

import json
from pprint import pprint

def main():
    """Main function to load and display the structure of player stats."""
    try:
        # Load the data
        with open('nba_player_stats_current_season.json', 'r') as f:
            players = json.load(f)
        
        print(f"Total players: {len(players)}")
        
        if not players:
            print("No player data found.")
            return
        
        # Show the structure of the first player
        print("\nFirst player structure:")
        print("Player ID:", players[0]['player']['id'])
        print("Player name:", f"{players[0]['player']['firstName']} {players[0]['player']['lastName']}")
        
        # Show available stats categories
        print("\nAvailable stats categories:")
        if 'stats' in players[0]:
            for category in players[0]['stats'].keys():
                print(f"- {category}")
        
        # Show a sample of the stats
        print("\nSample stats:")
        if 'stats' in players[0]:
            sample_stats = {}
            for category, values in players[0]['stats'].items():
                if isinstance(values, dict):
                    # For nested dictionaries, just show the keys
                    sample_stats[category] = list(values.keys())[:3]  # First 3 keys
                else:
                    sample_stats[category] = values
            
            print("Sample stats structure:")
            pprint(sample_stats, depth=2, width=100)
        
        # Check if we have team information
        print("\nTeam information:")
        if 'team' in players[0]:
            print(f"Team ID: {players[0]['team'].get('id')}")
            print(f"Team Abbreviation: {players[0]['team'].get('abbreviation')}")
        
        # Check for any player with stats
        player_with_stats = next((p for p in players if p.get('stats')), None)
        if player_with_stats:
            print("\nPlayer with stats:")
            print(f"Name: {player_with_stats['player']['firstName']} {player_with_stats['player']['lastName']}")
            print(f"Games Played: {player_with_stats['stats'].get('gamesPlayed', 'N/A')}")
            
            # Show some basic stats if available
            if 'points' in player_with_stats['stats']:
                print(f"Points: {player_with_stats['stats']['points'].get('points', 'N/A')}")
            if 'rebounds' in player_with_stats['stats']:
                print(f"Rebounds: {player_with_stats['stats']['rebounds'].get('rebounds', 'N/A')}")
            if 'assists' in player_with_stats['stats']:
                print(f"Assists: {player_with_stats['stats']['assists'].get('assists', 'N/A')}")
        
    except FileNotFoundError:
        print("Error: nba_player_stats_current_season.json not found. Please run fetch_current_season_stats.py first.")
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()

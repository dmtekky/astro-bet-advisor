#!/usr/bin/env python3
"""
Fetch MLB teams and player data from SportsData.io
"""
import os
import sys
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants
SPORTSDATA_API_KEY = os.getenv('SPORTSDATA_API_KEY')
BASE_URL = "https://api.sportsdata.io/v3/mlb"

if not SPORTSDATA_API_KEY or SPORTSDATA_API_KEY == 'your_sportsdata_api_key_here':
    logger.error("❌ Please set SPORTSDATA_API_KEY in your .env file")
    sys.exit(1)

class SportsDataClient:
    """Client for interacting with the SportsData.io API."""
    
    def __init__(self, api_key: str):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'Ocp-Apim-Subscription-Key': api_key,
                'User-Agent': 'AstroBetAdvisor/1.0'
            }
        )
    
    async def get_teams(self) -> List[Dict[str, Any]]:
        """Fetch all MLB teams."""
        url = f"{BASE_URL}/scores/json/AllTeams"
        logger.info(f"Fetching all MLB teams...")
        return await self._make_request(url)
    
    async def get_team_stats(self, season: int = 2024) -> List[Dict[str, Any]]:
        """Fetch season stats for all teams."""
        url = f"{BASE_URL}/scores/json/TeamSeasonStats/{season}"
        logger.info(f"Fetching team stats for {season}...")
        return await self._make_request(url)
    
    async def get_team_schedule(self, team_key: str, season: int = 2024) -> List[Dict[str, Any]]:
        """Fetch schedule for a specific team."""
        url = f"{BASE_URL}/scores/json/Games/{season}/{team_key.upper()}"
        logger.info(f"Fetching schedule for {team_key}...")
        return await self._make_request(url)
    
    async def get_team_roster(self, team_key: str) -> List[Dict[str, Any]]:
        """Fetch roster for a specific team."""
        url = f"{BASE_URL}/scores/json/Players/{team_key.upper()}"
        logger.info(f"Fetching roster for team: {team_key}")
        return await self._make_request(url)
    
    async def get_player_season_stats(self, season: int = 2024) -> List[Dict[str, Any]]:
        """Fetch season stats for all players."""
        url = f"{BASE_URL}/stats/json/PlayerSeasonStats/{season}"
        logger.info(f"Fetching player stats for {season}...")
        return await self._make_request(url)
    
    async def _make_request(self, url: str) -> Any:
        """Make an HTTP request and handle errors."""
        try:
            response = await self.session.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 401:
                logger.error("❌ Invalid API key. Please check your SPORTSDATA_API_KEY in .env")
            return None
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return None
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()

def format_team_record(team_stats: Dict[str, Any]) -> str:
    """Format team's win-loss record."""
    if not team_stats:
        return "Record: N/A"
    return f"Record: {team_stats.get('Wins')}-{team_stats.get('Losses')} ({team_stats.get('WinsPercentage', 0):.3f})"

def format_next_game(schedule: List[Dict[str, Any]]) -> str:
    """Format next/upcoming game info."""
    if not schedule:
        return "Next Game: No upcoming games"
    
    next_game = None
    for game in schedule:
        if game.get('Status') == 'Scheduled':
            next_game = game
            break
    
    if not next_game:
        return "Next Game: Season complete"
    
    game_time = datetime.strptime(next_game['DateTime'], '%Y-%m-%dT%H:%M:%S')
    return f"Next Game: {game_time.strftime('%a %b %d')} vs {next_game.get('AwayTeam', 'TBD') if next_game.get('HomeTeam') == next_game.get('GlobalGameID') else next_game.get('HomeTeam', 'TBD')} at {game_time.strftime('%I:%M %p')}"

async def display_team_info(team: Dict[str, Any], team_stats: Dict[str, Any] = None, schedule: List[Dict[str, Any]] = None) -> None:
    """Display formatted team information."""
    logger.info("\n" + "="*70)
    logger.info(f"{team.get('City')} {team.get('Name')} ({team.get('Key')})")
    logger.info("-"*70)
    
    # Basic info
    logger.info(f"Stadium: {team.get('StadiumName')}, {team.get('StadiumCity')}, {team.get('StadiumState')}")
    logger.info(f"Division: {team.get('Conference')} {team.get('Division')}")
    
    # Team stats/record
    if team_stats:
        logger.info(format_team_record(team_stats))
        logger.info(f"Last 10: {team_stats.get('LastTenGamesWins')}-{team_stats.get('LastTenGamesLosses')} | "
                   f"Home: {team_stats.get('HomeWins')}-{team_stats.get('HomeLosses')} | "
                   f"Away: {team_stats.get('AwayWins')}-{team_stats.get('AwayLosses')}")
    
    # Next game
    if schedule:
        logger.info(format_next_game(schedule))
    
    logger.info("="*70)

def format_batting_stats(stats: Dict[str, Any]) -> str:
    """Format batting statistics."""
    if not stats or stats.get('Games') == 0:
        return "No batting stats available"
    
    return (f"BA: {stats.get('BattingAverage', 0):.3f} | "
            f"HR: {stats.get('HomeRuns', 0)} | "
            f"RBI: {stats.get('RunsBattedIn', 0)} | "
            f"OPS: {stats.get('OnBasePlusSlugging', 0):.3f} | "
            f"SB: {stats.get('StolenBases', 0)}")

def format_pitching_stats(stats: Dict[str, Any]) -> str:
    """Format pitching statistics."""
    if not stats or stats.get('Games') == 0:
        return "No pitching stats available"
    
    return (f"W-L: {stats.get('Wins', 0)}-{stats.get('Losses', 0)} | "
            f"ERA: {stats.get('EarnedRunAverage', 0):.2f} | "
            f"SO: {stats.get('PitchingStrikeouts', 0)} | "
            f"WHIP: {stats.get('WalksAndHitsPerInningPitched', 0):.2f}")

async def display_player_info(player: Dict[str, Any], player_stats: Dict[str, Any] = None) -> None:
    """Display formatted player information with stats."""
    logger.info("\n" + "-"*70)
    logger.info(f"{player.get('FirstName')} {player.get('LastName')} (#{player.get('Jersey')})")
    logger.info(f"Position: {player.get('Position')} | Bats: {player.get('BatHand')} | Throws: {player.get('ThrowHand')}")
    
    # Personal info
    if player.get('BirthDate'):
        birth_date = datetime.strptime(player['BirthDate'].split('T')[0], '%Y-%m-%d')
        age = (datetime.now() - birth_date).days // 365
        logger.info(f"Age: {age} | DOB: {player['BirthDate'].split('T')[0]}")
    
    logger.info(f"Height: {player.get('Height')//12}'{player.get('Height')%12}\" | Weight: {player.get('Weight')} lbs")
    
    # Player stats
    if player_stats:
        if player_stats.get('PositionCategory') == 'P':
            logger.info("Pitching Stats:")
            logger.info(f"  {format_pitching_stats(player_stats)}")
        else:
            logger.info("Batting Stats:")
            logger.info(f"  {format_batting_stats(player_stats)}")
    
    logger.info("-"*70)

async def main():
    """Main function to fetch and display MLB data."""
    logger.info("Starting MLB Data Fetcher")
    logger.info("="*70)
    
    client = SportsDataClient(SPORTSDATA_API_KEY)
    
    try:
        # Step 1: Fetch all data in parallel
        logger.info("Fetching MLB data...")
        teams_task = client.get_teams()
        team_stats_task = client.get_team_stats()
        all_player_stats_task = client.get_player_season_stats()
        
        # Wait for all data to be fetched
        teams = await teams_task
        team_stats_list = await team_stats_task
        all_player_stats = await all_player_stats_task
        
        if not teams:
            logger.error("❌ Failed to fetch teams. Check your API key and internet connection.")
            return
        
        # Create a lookup for team stats by team ID
        team_stats_map = {str(ts['TeamID']): ts for ts in (team_stats_list or [])}
        
        # Create a lookup for player stats by player ID
        player_stats_map = {str(ps['PlayerID']): ps for ps in (all_player_stats or [])}
        
        # Display all teams for reference
        logger.info("\nMLB Teams:")
        logger.info("-"*70)
        for team in sorted(teams, key=lambda x: x.get('Name', '')):
            team_stat = team_stats_map.get(str(team.get('TeamID', '')))
            record = f" ({team_stat.get('Wins')}-{team_stat.get('Losses')})" if team_stat else ""
            logger.info(f"{team.get('Key')}: {team.get('City')} {team.get('Name')}{record}")
        
        # Find Marlins and Cubs
        target_teams = [t for t in teams if t.get('Key') in ['MIA', 'CHC']]
        
        for team in target_teams:
            team_key = team.get('Key')
            team_id = str(team.get('TeamID'))
            
            # Get team-specific data
            team_schedule_task = client.get_team_schedule(team_key)
            roster_task = client.get_team_roster(team_key)
            
            team_schedule = await team_schedule_task
            roster = await roster_task
            
            # Display team info with stats and schedule
            team_stat = team_stats_map.get(team_id)
            await display_team_info(team, team_stat, team_schedule)
            
            if not roster:
                logger.warning(f"No roster found for {team_key}")
                continue
            
            # Display roster with stats
            logger.info(f"\n{team.get('City')} {team.get('Name')} Roster (Total: {len(roster)} players):")
            
            # Sort players by position (pitchers first, then by name)
            def sort_key(p):
                position = p.get('Position', '').upper()
                # Pitchers first, then by last name
                return (0 if position in ['P', 'SP', 'RP', 'CL'] else 1, p.get('LastName', ''))
            
            for player in sorted(roster, key=sort_key):
                player_id = str(player.get('PlayerID'))
                stats = player_stats_map.get(player_id)
                await display_player_info(player, stats)
            
            logger.info(f"\nFinished processing {team.get('Key')} roster")
            logger.info("="*70)
                
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
    finally:
        await client.close()
        logger.info("Script completed")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

"""
Fetch NBA player statistics for the current season from MySportsFeeds API.
"""

import os
import asyncio
import base64
import json
import logging
import httpx
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('fetch_stats.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

class NBAPlayerStatsFetcher:
    """Fetches NBA player statistics from MySportsFeeds API."""
    
    def __init__(self):
        """Initialize the fetcher with API credentials."""
        self.api_key = os.getenv('MY_SPORTS_FEEDS_API_KEY')
        self.password = os.getenv('MY_SPORTS_FEEDS_PASSWORD')
        self.base_url = "https://api.mysportsfeeds.com/v2.1/pull/nba"
        self.season = "current"
        
        if not all([self.api_key, self.password]):
            raise ValueError("Missing required API credentials in environment variables")
    
    def _get_auth_headers(self):
        """Generate authentication headers."""
        auth_string = f"{self.api_key}:{self.password}"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        return {
            "Authorization": f"Basic {base64_auth}",
            "Accept": "application/json"
        }
    
    async def fetch_player_stats(self, limit=100, offset=0, max_retries=3, retry_delay=5):
        """
        Fetch player statistics for the current season with retry logic.
        
        Args:
            limit: Maximum number of players to fetch per request
            offset: Starting offset for pagination
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in seconds
            
        Returns:
            Dictionary containing player statistics or error information
        """
        url = f"{self.base_url}/{self.season}/player_stats_totals.json"
        params = {
            "limit": limit,
            "offset": offset
        }
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    logger.info(f"Fetching player stats from {url} with params: {params} (Attempt {attempt + 1}/{max_retries})")
                    response = await client.get(
                        url,
                        headers=self._get_auth_headers(),
                        params=params,
                        timeout=30.0
                    )
                    
                    # Check for rate limiting
                    if response.status_code == 429:
                        retry_after = int(response.headers.get('Retry-After', retry_delay))
                        logger.warning(f"Rate limited. Waiting {retry_after} seconds before retry...")
                        await asyncio.sleep(retry_after)
                        continue
                        
                    response.raise_for_status()
                    return response.json()
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    retry_after = int(e.response.headers.get('Retry-After', retry_delay))
                    logger.warning(f"Rate limited. Waiting {retry_after} seconds before retry...")
                    await asyncio.sleep(retry_after)
                    continue
                    
                logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
                return {"error": f"HTTP error: {e.response.status_code}"}
                
            except httpx.RequestError as e:
                logger.error(f"Request error: {str(e)}")
                if attempt < max_retries - 1:
                    logger.warning(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    continue
                return {"error": f"Request error: {str(e)}"}
                
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                if attempt < max_retries - 1:
                    logger.warning(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    continue
                return {"error": str(e)}
        
        return {"error": "Max retries exceeded"}
    
    async def get_all_players_stats(self, batch_size=50, max_players=None):
        """
        Fetch all player stats with pagination and rate limit handling.
        
        Args:
            batch_size: Number of players to fetch in each request
            max_players: Maximum number of players to fetch (None for all)
            
        Returns:
            List of player statistics
        """
        all_players = []
        offset = 0
        total = None
        request_delay = 2  # Start with a 2-second delay between requests
        
        try:
            while True:
                if max_players is not None and len(all_players) >= max_players:
                    logger.info(f"Reached maximum number of players to fetch: {max_players}")
                    break
                    
                # Calculate the actual limit for this request
                current_limit = batch_size
                if max_players is not None:
                    remaining = max_players - len(all_players)
                    current_limit = min(batch_size, remaining)
                
                logger.info(f"Fetching batch at offset {offset} (limit: {current_limit})")
                
                # Fetch the data with retry logic
                data = await self.fetch_player_stats(limit=current_limit, offset=offset)
                
                # Handle errors
                if "error" in data:
                    logger.error(f"Error fetching batch: {data['error']}")
                    if "Rate limit" in data['error']:
                        # If we're still being rate limited after retries, increase the delay
                        request_delay = min(60, request_delay * 2)  # Cap at 60 seconds
                        logger.warning(f"Rate limited. Increasing delay to {request_delay} seconds...")
                        await asyncio.sleep(request_delay)
                        continue
                    break
                    
                # Check for valid response format
                if "playerStatsTotals" not in data:
                    logger.error("Unexpected response format. 'playerStatsTotals' key not found.")
                    logger.info("Available keys in response:")
                    for key in data.keys():
                        logger.info(f"- {key}")
                    
                    # Save the full response for debugging
                    debug_file = "debug_api_response.json"
                    with open(debug_file, 'w') as f:
                        json.dump(data, f, indent=2)
                    logger.info(f"Full API response saved to {debug_file}")
                    break
                    
                # Process the batch
                batch = data["playerStatsTotals"]
                all_players.extend(batch)
                
                # Update total if this is the first batch
                if total is None and "pagination" in data:
                    total = data["pagination"].get("total", 0)
                    logger.info(f"Total players to fetch: {total}")
                
                # If we got fewer players than requested, we've reached the end
                if len(batch) < current_limit:
                    logger.info("Reached end of player list")
                    break
                    
                # Update offset for next batch
                offset += len(batch)
                
                # Be nice to the API - use exponential backoff
                logger.info(f"Fetched {len(batch)} players. Waiting {request_delay} seconds before next request...")
                await asyncio.sleep(request_delay)
                
                # Reset the delay if we had a successful request
                request_delay = max(2, request_delay // 2)  # Don't go below 2 seconds
                
        except Exception as e:
            logger.error(f"Unexpected error in get_all_players_stats: {str(e)}", exc_info=True)
            
        
        return all_players

async def main():
    """Main function to fetch and save player stats."""
    try:
        fetcher = NBAPlayerStatsFetcher()
        
        # First, try to get a small batch to check the response format
        logger.info("Testing API connection...")
        test_data = await fetcher.fetch_player_stats(limit=1)
        
        if "error" in test_data:
            logger.error(f"Failed to fetch test data: {test_data['error']}")
            return
            
        logger.info("Successfully connected to the API. Fetching all player stats...")
        
        # Fetch all player stats
        all_players = await fetcher.get_all_players_stats()
        
        # Save to file
        output_file = "nba_player_stats_current_season.json"
        with open(output_file, 'w') as f:
            json.dump(all_players, f, indent=2)
            
        logger.info(f"Successfully saved stats for {len(all_players)} players to {output_file}")
        
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}", exc_info=True)

if __name__ == "__main__":
    asyncio.run(main())

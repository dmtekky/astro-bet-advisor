import os
import base64
import asyncio
import aiohttp
import logging
import json
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MySportsFeeds API credentials
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')

if not all([MSF_API_KEY, MSF_PASSWORD]):
    raise ValueError("Missing required environment variables: MY_SPORTS_FEEDS_API_KEY and/or MY_SPORTS_FEEDS_PASSWORD")

# Base URL for MySportsFeeds API v2.1
MSF_BASE_URL = "https://api.mysportsfeeds.com/v2.1/pull/nba"

# Test different season formats
SEASONS_TO_TEST = [
    "current",
    "current-regular",
    "2024-2025-regular",
    "2024-2025",
    "2024",
]

# Test different endpoints and their parameters
ENDPOINTS_TO_TEST = [
    ("players.json", {"limit": 1}),  # Test player list endpoint
    ("current/players.json", {"limit": 1}),  # Alternative format with season in path
    ("2024-2025/players.json", {"limit": 1}),  # Alternative format with specific season in path
    ("current/player_stats_totals.json", {"limit": 1}),  # Direct stats endpoint
]

async def test_endpoint(session, url, params=None, headers=None):
    if params is None:
        params = {}
    if headers is None:
        headers = {}
    
    # Add authentication
    auth = aiohttp.BasicAuth(login=MSF_API_KEY, password=MSF_PASSWORD)
    
    logger.info(f"Testing URL: {url} with params: {params}")
    try:
        async with session.get(url, params=params, headers=headers, auth=aiohttp.BasicAuth(MSF_API_KEY, MSF_PASSWORD)) as response:
            status = response.status
            text = await response.text()
            logger.info(f"Status: {status}")
            logger.info(f"Response headers: {dict(response.headers)}")
            logger.info(f"Response body (first 500 chars): {text[:500]}")
            
            try:
                json_data = await response.json()
                logger.info("Response JSON structure:")
                logger.info(json.dumps(json_data, indent=2)[:1000])  # Print first 1000 chars of pretty JSON
            except Exception as e:
                logger.warning(f"Could not parse JSON: {e}")
            
            return status, text
    except Exception as e:
        logger.error(f"Error making request to {url}: {str(e)}")
        return None, str(e)

async def main():
    async with aiohttp.ClientSession() as session:
        # Test different endpoints with default params
        for endpoint, params in ENDPOINTS_TO_TEST:
            url = f"{MSF_BASE_URL}/{endpoint}"
            logger.info(f"\n{'='*80}\nTesting endpoint: {endpoint}\n{'='*80}")
            status, text = await test_endpoint(session, url, params=params)
            
            # If we get a successful response, no need to test other variations
            if status == 200:
                logger.info(f"Success with endpoint: {endpoint}")
                return
        
        # If we get here, none of the endpoints worked with default params
        logger.warning("No successful API calls with the tested endpoints and parameters.")
        logger.info("\nTesting with different season parameters...")
        
        # Test with different season parameters
        for season in SEASONS_TO_TEST:
            url = f"{MSF_BASE_URL}/players.json"
            params = {"season": season, "limit": 1}
            logger.info(f"\n{'='*80}\nTesting with season: {season}\n{'='*80}")
            status, text = await test_endpoint(session, url, params=params)
            
            if status == 200:
                logger.info(f"Success with season: {season}")
                return
        
        logger.error("All API tests failed. Please check your credentials and API documentation.")

if __name__ == "__main__":
    asyncio.run(main())

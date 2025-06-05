# NBA Player and Statistics Synchronization

This directory contains scripts for synchronizing NBA player data and statistics from the MySportsFeeds API.

## Scripts

### `sync_nba_players_with_stats.py`

Fetches NBA player information and their statistics, then saves the data to JSON files.

#### Features:
- Fetches complete player roster with details
- Retrieves current season statistics for all players
- Handles pagination and rate limiting
- Saves data to timestamped JSON files

#### Usage:

1. Set up your environment variables in `.env`:
   ```
   MY_SPORTS_FEEDS_API_KEY=your_api_key
   MY_SPORTS_FEEDS_PASSWORD=your_password
   ```

2. Run the script:
   ```bash
   python3 scripts/sync_nba_players_with_stats.py
   ```

3. The script will create two files:
   - `nba_players_YYYYMMDD_HHMMSS.json`: Contains player information
   - `nba_player_stats_YYYYMMDD_HHMMSS.json`: Contains player statistics

#### Output Format:

Player data includes:
- Basic info (name, position, team, etc.)
- Physical attributes (height, weight, age)
- Career information (rookie status, college, etc.)

Statistics include:
- Games played
- Field goals (2PT, 3PT, FT)
- Rebounds (offensive, defensive, total)
- Assists, steals, blocks
- Points and other advanced metrics

### `fetch_current_season_stats.py`

Legacy script for fetching only player statistics. Use `sync_nba_players_with_stats.py` instead.

## Scheduled Execution

To run this script daily, you can set up a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run at 3 AM daily
0 3 * * * cd /path/to/astro-bet-advisor && /usr/bin/python3 scripts/sync_nba_players_with_stats.py >> /var/log/nba_sync.log 2>&1
```

## Database Integration

To store the data in your database, you'll need to extend the `sync_players_and_stats` method in `NBADataSync` class to:

1. Connect to your database
2. Upsert player information
3. Update player statistics
4. Handle any necessary data transformations

## Rate Limiting

The API has rate limits. The script includes:
- 2-second delay between stats requests
- 1-second delay between player info requests
- Error handling for rate limit responses (HTTP 429)

## Dependencies

- Python 3.8+
- aiohttp
- python-dotenv

Install with:
```bash
pip install aiohttp python-dotenv
```

## Error Handling

The script includes basic error handling and logging. Check the console output for any issues.

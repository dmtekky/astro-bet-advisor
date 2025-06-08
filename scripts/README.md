# Sports Data and Astro Score Management

This directory contains scripts for syncing sports data from SportsData.io to your Supabase database and managing astrological influence scores for players.

## Features

### Data Sync
- Syncs sports data including teams, players, games, standings, and live betting odds
- Supports multiple leagues: MLB, NFL, NBA, NHL, and more

### Astro Score Features
- Calculates astrological influence scores for players based on birth dates
- Updates scores in the database with proper normalization
- Generates score distribution histograms
- Daily automated updates

- **Leagues**: MLB, NFL, NBA, NHL, and more
- **Data Synced**:
  - Teams and team details
  - Players and player metadata
  - Player season statistics
  - Game schedules and results
  - Team standings
  - **Betting Odds** (moneyline, spreads, over/under) from multiple sportsbooks

## Astro Score Management

### Scripts

#### `update-all-astro-scores.cjs`
- **Purpose**: Updates astrological influence scores for all players in the database
- **How it works**:
  1. Fetches all players with birth dates from the database
  2. Calculates astro scores in a batch process for proper normalization
  3. Updates player records in the database
  4. Generates a score distribution histogram
- **Usage**:
  ```bash
  node scripts/update-all-astro-scores.cjs
  ```

#### `check_astro_scores.cjs`
- **Purpose**: Verifies and displays astro score statistics
- **Usage**:
  ```bash
  node scripts/check_astro_scores.cjs
  ```

#### `histogramAstroScores.cjs`
- **Purpose**: Generates a histogram of score distribution
- **Note**: Automatically run by `update-all-astro-scores.cjs`

### Setup

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements-sync.txt
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the project root with:
   ```
   # SportsData.io API Key
   SPORTSDATA_API_KEY=your_sportsdata_api_key
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # Optional: Configure which leagues to sync (comma-separated)
   SYNC_LEAGUES=MLB,NFL,NBA,NHL
   ```

3. **Run Database Migrations**
   Apply the database schema in `supabase/migrations/20240519191300_initial_sports_schema.sql` to your Supabase database.

## Usage

### Sync All Data for All Leagues
```bash
python3 scripts/sync_sports_data.py
```

### Sync Specific Leagues
Modify the `SYNC_LEAGUES` environment variable or edit the `main()` function in `sync_sports_data.py`.

### Data Refresh Schedule

### Sports Data Sync
For production, set up a cron job to run the sync script regularly:

```bash
# Run every 6 hours
0 */6 * * * cd /path/to/astro-bet-advisor && python3 scripts/sync_sports_data.py >> /var/log/sports_sync.log 2>&1
```

### Astro Score Updates
Astro scores should be updated daily to reflect current astrological conditions:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/astro-bet-advisor && node scripts/update-all-astro-scores.cjs >> /var/log/astro_score_updates.log 2>&1
```

## Database Schema

### Key Tables

#### `leagues`
- `id`: UUID primary key
- `name`: League name (e.g., "National Basketball Association")
- `key`: League key (e.g., "NBA")
- `season`: Current season year
- `is_active`: Boolean if the league is currently active

#### `teams`
- `id`: UUID primary key
- `external_id`: SportsData.io team ID
- `league_id`: Reference to leagues.id
- `name`: Team name
- `city`: Team city
- `abbreviation`: Team abbreviation (e.g., "LAL")
- `logo_url`: URL to team logo
- `venue_*`: Stadium/venue details

#### `players`
- `id`: UUID primary key
- `external_id`: SportsData.io player ID
- `first_name`: Player first name
- `last_name`: Player last name
- `position`: Player position
- `height/weight`: Physical attributes
- `birth_date`: Player birth date

#### `player_seasons`
- `id`: UUID primary key
- `player_id`: Reference to players.id
- `team_id`: Reference to teams.id
- `league_id`: Reference to leagues.id
- `season`: Season year
- `stats`: JSONB field with all player stats

#### `games`
- `id`: UUID primary key
- `external_id`: SportsData.io game ID
- `league_id`: Reference to leagues.id
- `home_team_id`, `away_team_id`: References to teams.id
- `game_date`: Scheduled game time
- `status`: Game status (Scheduled, InProgress, Final, etc.)
- `home_score`, `away_score`: Current score
- `venue`: Game venue details

#### `game_odds`
- `id`: UUID primary key
- `game_id`: Reference to games.id
- `sportsbook`: Name of the sportsbook
- `moneyline_home/away`: Moneyline odds
- `spread_home/away`: Point spread payouts
- `spread_points`: Point spread value
- `over_under`: Over/under total points
- `over_odds`/`under_odds`: Payouts for over/under
- `last_updated`: Timestamp of last odds update

## Monitoring

Check the script output or logs for any sync issues. The script logs:
- Successful syncs with record counts
- API errors or rate limiting
- Data validation issues

## Rate Limiting

The script includes basic rate limiting to stay within SportsData.io's API limits. If you encounter rate limiting errors, you may need to add delays between requests.

## Support

For issues or feature requests, please open an issue in the repository.

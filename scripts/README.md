# Sports Data Sync

This repository contains scripts to sync sports data from various APIs to your Supabase database, including teams, players, games, standings, and astrological influence scores.

## Features

### General Sports Data Sync
- **Leagues**: MLB, NFL, NBA, NHL, and more
- **Data Synced**:
  - Teams and team details
  - Players and player metadata
  - Player season statistics
  - Game schedules and results
  - Team standings
  - **Betting Odds** (moneyline, spreads, over/under) from multiple sportsbooks

### NBA Player Stats with Astrological Influence
- **NBA Player Statistics**:
  - Fetches comprehensive player stats from MySportsFeeds API
  - Includes points, assists, rebounds, steals, blocks, and shooting percentages
  - Tracks per-game and season-total statistics

- **Astrological Influence Scoring**:
  - Calculates player zodiac signs based on birth dates
  - Determines elemental influence (fire, earth, air, water)
  - Computes astrological influence scores based on player performance and zodiac elements
  - Stores both raw stats and calculated influence scores

- **Data Enrichment**:
  - Enriches player data with astrological insights
  - Provides a holistic view of player performance with astrological context
  - Enables filtering and analysis by astrological factors

## Setup

### Prerequisites

1. **Node.js** (v14 or later) and npm/yarn
2. **Supabase Project** with the following tables:
   - `nba_player_season_stats_2025` (will be created if it doesn't exist)
3. **MySportsFeeds API** account and credentials

### Installation

1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js luxon
   # or with yarn
   # yarn add @supabase/supabase-js luxon
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the project root with:
   ```
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_or_service_key
   
   # MySportsFeeds API Credentials
   MSF_API_KEY=your_msf_api_key
   MSF_PASSWORD=your_msf_password
   
   # Optional: Configure season (default: 2024-2025-regular)
   MSF_SEASON=2024-2025-regular
   ```

3. **Database Setup**
   The script will automatically create the `nba_player_season_stats_2025` table if it doesn't exist.
   The table includes columns for player stats, zodiac information, and astrological influence scores.

## Database Schema

The `nba_player_season_stats_2025` table stores player statistics along with astrological information:

```sql
CREATE TABLE IF NOT EXISTS public.nba_player_season_stats_2025 (
  id BIGSERIAL PRIMARY KEY,
  msf_player_id INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  position TEXT,
  birth_date DATE,
  height INTEGER,
  weight INTEGER,
  team_id INTEGER,
  team_abbreviation TEXT,
  zodiac_sign TEXT,
  zodiac_element TEXT,
  astro_influence_score DECIMAL(5,2),
  raw_stats JSONB,
  season TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_msf_player_season UNIQUE (msf_player_id, season)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nba_player_season_team ON public.nba_player_season_stats_2025(team_abbreviation);
CREATE INDEX IF NOT EXISTS idx_nba_player_season_zodiac ON public.nba_player_season_stats_2025(zodiac_sign, zodiac_element);
CREATE INDEX IF NOT EXISTS idx_nba_player_season_score ON public.nba_player_season_stats_2025(astro_influence_score);
```

### Schema Description

- **msf_player_id**: The MySportsFeeds unique player identifier
- **first_name/last_name**: Player's name
- **position**: Player's position (PG, SG, SF, PF, C)
- **birth_date**: Player's date of birth (used for astrological calculations)
- **height/weight**: Player's physical attributes (in inches and pounds)
- **team_id/team_abbreviation**: Team information
- **zodiac_sign**: Player's zodiac sign (e.g., 'Aries', 'Taurus')
- **zodiac_element**: Element associated with the zodiac sign ('fire', 'earth', 'air', 'water')
- **astro_influence_score**: Calculated astrological influence score (0-100)
- **raw_stats**: Complete JSON object of player statistics from MySportsFeeds
- **season**: NBA season identifier (e.g., '2024-2025-regular')
- **last_updated**: Timestamp of when the record was last updated

## Usage

### NBA Player Stats with Astrological Influence

1. **Run the Sync Script**
   ```bash
   node scripts/sync_nba_astro_scores.js
   ```

2. **Script Output**
   The script will output progress information, including:
   - Number of players processed
   - Any errors encountered
   - Summary of successful operations

3. **Verify Data in Supabase**
   After running the script, you can query the `nba_player_season_stats_2025` table in your Supabase database to view the synced data, including:
   - Player statistics
   - Zodiac sign and element
   - Astrological influence score
   - Raw JSON stats

### Data Refresh Schedule
For production, set up a cron job to run the sync script regularly (e.g., daily during the NBA season):

```bash
# Example cron job to run daily at 3 AM
0 3 * * * cd /path/to/your/project && node scripts/sync_nba_astro_scores.js >> /var/log/nba_astro_sync.log 2>&1
```

## Astrological Influence Scoring

The astrological influence score is calculated based on:

1. **Zodiac Element**
   - Fire (Aries, Leo, Sagittarius)
   - Earth (Taurus, Virgo, Capricorn)
   - Air (Gemini, Libra, Aquarius)
   - Water (Cancer, Scorpio, Pisces)

2. **Elemental Multipliers**
   Each element has different multipliers for various statistics:
   - Fire: Emphasizes points and steals
   - Earth: Emphasizes rebounds and blocks
   - Air: Emphasizes assists and steals
   - Water: Emphasizes points and blocks

3. **Score Calculation**
   ```
   score = (
     (points * points_multiplier) +
     (assists * assists_multiplier) +
     (rebounds * rebounds_multiplier) +
     (steals * steals_multiplier) +
     (blocks * blocks_multiplier) -
     (turnovers * 1.5) +
     (field_goal_pct * 50) +
     (free_throw_pct * 30)
   ) / 5
   ```

   The final score is normalized to a 0-100 scale.

## Error Handling

The script includes comprehensive error handling to ensure data integrity:

1. **API Rate Limiting**
   - Implements automatic retries with exponential backoff
   - Respects API rate limits
   - Logs rate limit information

2. **Data Validation**
   - Validates API responses before processing
   - Handles missing or malformed data gracefully
   - Logs data validation issues for review

3. **Database Operations**
   - Uses transactions for data consistency
   - Implements upsert operations to handle duplicates
   - Logs database errors with detailed context

## Troubleshooting

### Common Issues

1. **API Authentication Failures**
   - Verify your MySportsFeeds API key and password
   - Ensure your subscription includes access to the NBA data
   - Check for any IP restrictions on your API key

2. **Database Connection Issues**
   - Verify your Supabase URL and API key
   - Check your network connection to Supabase
   - Ensure your database has the necessary tables and permissions

3. **Missing Player Data**
   - Some players might be missing birth dates, which are required for astrological calculations
   - The script will log warnings for players with missing data

### Logging

Detailed logs are output to the console. For production use, consider redirecting logs to a file:

```bash
node scripts/sync_nba_astro_scores.js >> /var/log/nba_astro_sync.log 2>&1
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, please open an issue in the repository or contact the maintainers.

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

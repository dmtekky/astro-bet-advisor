# Full Moon Odds (Latest Deployment Test)

A web-based tool that helps users make informed sports betting decisions by analyzing odds data, astrological factors, and comprehensive sports statistics.

## Features

- Dashboard with tabs for different sports (NBA, MLB, NFL, Boxing planned).
- Player and team cards displaying betting odds.
- Astrological insights for players.
- **Player Impact Scoring:** Advanced algorithm for calculating player impact scores based on performance metrics.
  - Considers points, assists, rebounds, steals, blocks, and other key statistics
  - Adjusts for playing time and game participation
  - Provides a normalized score from 30-100 for easy comparison
  - Stable and deterministic sorting for consistent rankings
- **Accurate Moon Phase Calculation:** Real-time moon phase tracking with precise illumination percentages and phase names.
  - Uses astronomical calculations based on the lunar cycle (29.53058867 days)
  - Tracks moon phases with high accuracy using a known new moon reference
  - Provides illumination percentage and phase name (New Moon, Waxing Crescent, First Quarter, etc.)
  - Updates in real-time based on the current date and time
- **Comprehensive Sports Data Integration:** Fetches and stores team, player, and game data from various sports APIs.
- Data caching and storage in Supabase for optimal performance and historical analysis.

## Technologies Used

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Data Management**: Supabase (PostgreSQL), Tanstack React Query
- **Backend Scripting**: Node.js, TypeScript, tsx
- **Data Analysis**: Custom statistical models for player impact scoring
- **APIs**:
  - TheSportsDB API (for MLB data)
  - The Odds API (Assumed for betting odds)
  - Sports Game Odds API (Assumed alternative for odds)
  - Swiss Ephemeris (Assumed for astrological calculations)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- A Supabase account (for database and potentially Edge Functions)
- Supabase CLI (for generating types and local development)

### Setup

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd astro-bet-advisor
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the project root by copying `.env.example` (if one exists) or creating it manually. Populate it with your credentials:
    ```env
    # Supabase credentials (found in your Supabase project settings)
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_KEY=your_supabase_anon_key

    # TheSportsDB API Key (get one from https://www.thesportsdb.com/api.php)
    THESPORTSDB_API_KEY=your_thesportsdb_api_key # (Currently '502451' is hardcoded as a fallback in the service)

    # Other API keys as needed (e.g., for The Odds API)
    # THE_ODDS_API_KEY=your_odds_api_key
    ```

4.  **Initialize Supabase Project (if not already linked):**
    If you're setting this up with a new Supabase project or need to link it:
    ```sh
    npx supabase login
    npx supabase link --project-ref <your-supabase-project-id>
    ```

5.  **Database Schema and Types:**
    The database schema should include tables for `leagues`, `teams`, `players`, `venues`, and `games` (among others like `astrological_data`). Ensure these tables exist in your Supabase project.
    Generate TypeScript types for your database schema:
    ```sh
    npx supabase gen types typescript --project-id <your-supabase-project-id> --schema public > src/types/database.types.ts
    ```
    This command should be re-run if you make changes to your database schema.

6.  **Start the development server (for the Astro frontend):**
    ```sh
    npm run dev
    ```
    Open your browser at the local address provided (usually http://localhost:4321 for Astro).

## Player Impact Score Calculation

The impact score is a comprehensive metric that evaluates player performance across multiple statistical categories. The score ranges from 30-100, with higher scores indicating better performance.

### Score Distribution
- **98-100**: Top 2% of players
- **94-97**: Next 3% of players
- **88-93**: Next 5% of players
- **80-87**: Next 10% of players
- **70-79**: Next 15% of players
- **60-69**: Next 20% of players
- **50-59**: Next 20% of players
- **40-49**: Next 15% of players
- **30-39**: Bottom 10% of players

### Key Statistics Considered
- **Offensive Stats**: Points, Assists, Field Goal %, 3-Point %, Free Throw %
- **Defensive Stats**: Rebounds, Steals, Blocks
- **Efficiency**: Plus/Minus, Turnovers, Personal Fouls
- **Playing Time**: Minutes Played, Games Played, Games Started

## Baseball Score Updates

### Update Process

The baseball player scores are updated using the `update-baseball-scores.js` script, which runs the following updates in sequence:

## NBA Data Update Pipeline

The NBA data update process is managed by `scripts/update_nba_pipeline.js`, which coordinates the following steps:

1. **Fetch NBA Data**
   - Updates teams, players, games, and stats from MySportsFeeds
   - Script: `scripts/fetch_nba_data.js`
   - Updates tables: `nba_teams`, `nba_players`, `nba_games`, `nba_player_season_stats_2025`

2. **Update Player Impact Scores**
   - Calculates and updates player impact scores based on performance metrics
   - Script: `scripts/update-player-scores.js`
   - Updates `impact_score` in `nba_player_season_stats_2025`

3. **Update Astrological Influence Scores**
   - Updates astrological influence scores for all NBA players
   - Script: `scripts/update-nba-astro-scores-fixed.cjs`
   - Updates both `nba_players` and `nba_player_season_stats_2025` tables
   - Uses `msf_player_id` to match records between tables

### Running the Pipeline

```bash
# Run the complete NBA update pipeline
node scripts/update_nba_pipeline.js

# Or run individual components as needed
node scripts/fetch_nba_data.js
node scripts/update-player-scores.js
node scripts/update-nba-astro-scores-fixed.cjs
```

### Scheduling Updates

To run the pipeline daily, add a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 3 AM
0 3 * * * cd /path/to/astro-bet-advisor && node scripts/update_nba_pipeline.js >> logs/nba-update-$(date +\%Y\%m\%d).log 2>&1
```

## Player Stats Update
   - Updates basic player statistics
   - Script: `scripts/update-player-scores.ts`

2. **Impact Scores**
   - Recalculates player impact scores based on performance metrics
   - Script: `scripts/recalculate_impact_scores.js`

3. **Astrological Scores**
   - Updates astrological influence scores using the versioned scoring algorithm
   - Script: `scripts/astroScore_2025-06-07.cjs` (versioned copy)

### Running the Update

```bash
# Make the script executable (first time only)
chmod +x scripts/update-baseball-scores.js

# Run the update process
node scripts/update-baseball-scores.js
```

### Output
- Progress is logged to the console
- Each step shows success/failure status
- The script will stop if any step fails

### Versioning
- The astrological scoring algorithm is versioned by date (e.g., `astroScore_YYYY-MM-DD.cjs`)
- The `astroScore_latest.cjs` symlink always points to the current version

### Automated Execution

To set up daily automatic updates:

1. Create a shell script wrapper at `/usr/local/bin/update-baseball-scores.sh`:
```bash
#!/bin/bash
cd /path/to/astro-bet-advisor
export $(grep -v '^#' .env | xargs)
/usr/bin/node scripts/update-baseball-scores.js >> /var/log/baseball-updates.log 2>&1
```

2. Make it executable:
```bash
chmod +x /usr/local/bin/update-baseball-scores.sh
```

3. Create a systemd service file at `/etc/systemd/system/baseball-update.service`:
```ini
[Unit]
Description=Full Moon Odds Baseball Score Updates
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/astro-bet-advisor
ExecStart=/usr/local/bin/update-baseball-scores.sh
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

4. Create a timer at `/etc/systemd/system/baseball-update.timer`:
```ini
[Unit]
Description=Daily update of baseball scores at 3 AM

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

5. Enable and start the timer:
```bash
sudo systemctl daemon-reload
sudo systemctl enable baseball-update.timer
sudo systemctl start baseball-update.timer
```

6. Verify the timer is active:
```bash
systemctl list-timers --all | grep baseball
```

The impact score is a comprehensive metric that evaluates player performance across multiple statistical categories. The score ranges from 30-100, with higher scores indicating better performance.

### Score Distribution
- **98-100**: Top 2% of players
- **94-97**: Next 3% of players
- **88-93**: Next 5% of players
- **80-87**: Next 10% of players
- **70-79**: Next 15% of players
- **60-69**: Next 20% of players
- **50-59**: Next 20% of players
- **40-49**: Next 15% of players
- **30-39**: Bottom 10% of players

### Key Statistics Considered
- **Offensive Stats**: Points, Assists, Field Goal %, 3-Point %, Free Throw %
- **Defensive Stats**: Rebounds, Steals, Blocks
- **Efficiency**: Plus/Minus, Turnovers, Personal Fouls
- **Playing Time**: Minutes Played, Games Played, Games Started

## NBA Data Ingestion

The NBA data ingestion process fetches game data from MySportsFeeds API and stores it in the Supabase database. The system is optimized for performance and reliability.

### Features

- **Single API Call**: Fetches both regular season and playoff games in just two API calls
- **Efficient Upsert**: Uses a single database operation to upsert all games
- **Deduplication**: Automatically removes duplicate game entries
- **Error Handling**: Comprehensive error handling with fallback to individual inserts if batch fails
- **Team Reference Processing**: Extracts and processes team references from game data

### Data Flow

1. **Fetch Games**
   - Regular season games (2024-2025-regular)
   - Playoff games (2025-playoff)

2. **Process Games**
   - Deduplicate games by external_id
   - Map team references to internal UUIDs
   - Prepare data for database insertion

3. **Database Operations**
   - Single upsert operation for all games
   - Fallback to individual inserts if batch operation fails
   - Update team references and metadata

### Performance

- Processes 1,300+ games in a single database operation
- Typical execution time: ~3 seconds for full season data
- Memory efficient processing of large datasets

### Usage

```bash
node scripts/fetch_nba_data.js
```

### Error Handling

- Logs detailed error information for failed operations
- Provides fallback mechanisms for partial failures
- Maintains data consistency with transaction-like behavior

### NBA Data Pipeline

The NBA data pipeline is responsible for fetching, processing, and updating all NBA-related data in the correct order. The pipeline consists of the following scripts, which should be run in sequence:

#### 1. `fetch_nba_data.js`
Fetches the latest NBA data from the sports data API and updates the database.
- Fetches team data and updates `nba_teams`
- Fetches player data and updates `nba_players`
- Fetches player season stats and updates `nba_player_season_stats_2025`

#### 2. `calculate_player_impact_scores.js`
Calculates impact scores for all NBA players based on their performance metrics.
- Considers points, assists, rebounds, steals, blocks, shooting percentages, and plus/minus
- Applies weighted scoring to different statistics
- Updates the `impact_score` column in `nba_player_season_stats_2025`

#### 3. `sync_nba_astro_scores_fixed.js`
Efficiently syncs astrological data and impact scores for NBA players using bulk database operations.
- Fetches player data in bulk from the `nba_players` table using `external_player_id`
- Calculates astrological influence based on birth dates
- Computes impact scores using performance metrics
- Updates player records in `nba_player_season_stats_2025` with:
  - Zodiac sign and element
  - Astro influence score (0-100)
  - Impact score (30-100)
- Processes players in configurable batches for optimal performance
- Includes comprehensive error handling and logging

**Key Features:**
- Bulk data fetching to minimize database queries
- Batch processing for memory efficiency
- Automatic retry on rate limiting
- Detailed logging for monitoring and debugging

#### 4. `calculate_nba_team_astro_scores.js`
Calculates team chemistry and influence scores based on player astro data.
- Aggregates player astro influence scores by team.
- Calculates elemental balance (Fire, Earth, Air, Water) for each team.
- Updates the `chemistry_score`, `influence_score`, and `elemental_balance` columns in `nba_teams`.

### NBA Team Chemistry Calculation

The NBA Team Chemistry Calculation analyzes team dynamics based on player astrological elements and performance metrics. This system calculates a chemistry score (0-100) that reflects how well players' astrological elements work together.

#### Key Features

- **Elemental Balance**: Calculates the distribution of astrological elements (Fire, Earth, Air, Water) across team members
- **Impact Weighting**: Players are weighted based on their impact scores and availability
- **Injury Adjustments**: Reduces weight for injured or questionable players
- **Detailed Logging**: Comprehensive logging for debugging and analysis

#### How It Works

1. **Player Element Assignment**:
   - Each player is assigned an element based on their zodiac sign
   - Fire: Aries, Leo, Sagittarius
   - Earth: Taurus, Virgo, Capricorn
   - Air: Gemini, Libra, Aquarius
   - Water: Cancer, Scorpio, Pisces

2. **Player Weighting**:
   - Base weight: 0.5 to 1.5 based on impact score (50-100)
   - Availability adjustment:
     - Active: Full weight
     - Questionable/Day-to-day: 50% weight
     - Out: 0 weight (excluded from calculation)

3. **Chemistry Calculation**:
   - Calculates elemental distribution percentages
   - Applies synergy and diversity bonuses
   - Considers team size and player weights
   - Final score is capped between 0-100

4. **Output**:
   - `chemistry_score`: Overall team chemistry (0-100)
   - `elemental_balance`: Distribution of elements (Fire, Earth, Air, Water)
   - `balance`: Overall elemental harmony (0-100)
   - `synergyBonus`: Bonus for complementary elements
   - `diversityBonus`: Bonus for element diversity

#### Usage

Run the chemistry calculation script:
```bash
node scripts/calculate_nba_team_chemistry_v2.js
```

#### Example Output
```
🏆 Top 5 Teams by Chemistry:
   1. Cavaliers: 97/100 (26 players)
      Elements - Fire: 25%, Earth: 25%, Air: 25%, Water: 25%
      Balance: 83.2, Synergy: 5.2, Diversity: 3.1
   2. Spurs: 97/100 (27 players)
      Elements - Fire: 30%, Earth: 20%, Air: 30%, Water: 20%
      Balance: 83.2, Synergy: 4.8, Diversity: 2.9
```

#### Dependencies
- `@supabase/supabase-js`: For database operations
- `dotenv`: For environment variable management
- Team chemistry utility functions

#### Notes
- Players without birth dates are excluded from calculations
- Impact scores should be between 50-100 for optimal results
- The script automatically handles database updates for team chemistry data

### Master Script: `update_nba_pipeline.js`
Runs the entire NBA data pipeline in the correct order:
1. Fetches the latest NBA data (`fetch_nba_data.js`).
2. Calculates player impact scores (`calculate_player_impact_scores.js`).
3. Syncs astrological data and scores (`sync_nba_astro_scores_fixed.js`).
4. Calculates team astro scores (`calculate_nba_team_astro_scores.js`).

**Usage:**
```bash
node scripts/update_nba_pipeline.js
```

This script ensures that all data dependencies are respected and that the database is updated in the correct order. It includes comprehensive error handling and logging to help diagnose any issues that may arise during the update process.

### Utility Scripts

#### NBA Data Pipeline (Full Bundle)
- `scripts/update_nba_pipeline.js`: **Master script to run the entire NBA data pipeline for the 2024-25 season.**

  This script:
  1. Fetches and upserts NBA teams, players, and player season stats for 2024-25 (`fetch_nba_data.js`)
  2. Calculates and updates player impact scores (`calculate_player_impact_scores.js`)

- `scripts/update-nba-astro-scores-fixed.cjs`: **Updates astrological influence scores for NBA players.**

  This script should be run after updating player stats to ensure astrological data is current:
  ```bash
  node scripts/update-nba-astro-scores-fixed.cjs
  ```
  
  **Features:**
  - Processes players in batches for efficiency
  - Updates both `nba_players` and `nba_player_season_stats_2025` tables
  - Matches players using `msf_player_id` for accurate cross-table updates
  - Provides detailed logging of updates and any missing records
  
  **Note:** Some players may show "No stats record found" if they don't have entries in the stats table for the current season.

- `scripts/sync_nba_astro_scores_fixed.js`: **Updates player astro scores**
- `scripts/calculate_nba_team_astro_scores.js`: **Calculates and updates team astro/chemistry scores**

  **Usage:**
  ```bash
  node scripts/update_nba_pipeline.js
  ```
  This will run all steps in sequence with logging. If any step fails, the script will exit and print the error.

  **Common Errors & Troubleshooting:**
  - `Could not find the 'minutes' column...`: The player stats table is missing a required column. Update your schema to match the mapping in `fetch_nba_data.js`.
  - `value too long for type character varying(10)`: One of your string columns (e.g., player_name, team_abbreviation, season) is too short. Increase the column length in Supabase.
  - `invalid input syntax for type uuid`: The script is trying to insert a string (like an MSF ID) into a UUID column. Change the column type to `text` or `varchar`.
  - `ON CONFLICT DO UPDATE command cannot affect row a second time`: There are duplicate keys in your upsert data. The script now deduplicates player stats before upsert.
  - `Cannot read properties of undefined`: The script tried to access a nested stat that was missing from the API response. The mapping now uses optional chaining (`?.`) and fallback values.
  - `Rate limited...`: The astro score script may be rate limited by external APIs. The script will retry automatically, but may take longer to complete.
  - `No astro_influence found for player undefined`: Some players may be missing astro data or have incomplete birth date info. These are logged as warnings and skipped.

  **If you encounter a new error, check the logs for details and update your schema or script mapping as needed.**

#### Player and Team Score Management
- `scripts/update_nba_scores.js`: Master script to update all NBA-related scores in the correct order:
  1. Updates player impact scores
  2. Updates team astro scores (using pre-calculated astro_influence)
  
  **Usage:**
  ```bash
  node scripts/update_nba_scores.js
  ```

#### Individual Scripts
- `scripts/recalculate_impact_scores.js`: Main script to calculate and update impact scores
- `scripts/analyze_scores.js`: Analyzes the distribution of impact scores
- `scripts/calculate_player_score.js`: Calculates score for a specific player
- `scripts/check_db_connection.js`: Verifies database connection
- `scripts/list_tables.js`: Lists available database tables
- `scripts/calculate_nba_team_astro_scores.js`: Calculates team astro scores based on player data

## Managing Team and League Keys

This project uses external API identifiers (keys) to fetch and associate data for leagues and teams. Here's how to manage them:

### League Keys
- **Location**: League keys are managed in the `leagues` table in Supabase.
- **Key Format**: Use the external API's unique identifier (e.g., TheSportsDB league ID).
- **Example for MLB**: 
  - **Key**: `4424` (TheSportsDB ID for Major League Baseball)
  - **Name**: `Major League Baseball`

### Adding a New League
1. **Find the League ID**:
   - For TheSportsDB, visit [TheSportsDB API](https://www.thesportsdb.com/api.php) and look up the league ID.
   - For other APIs, refer to their documentation.

2. **Add to Database**:
   - Insert a new record into the `leagues` table with the following fields:
     ```sql
     INSERT INTO public.leagues (id, name, key, is_active, created_at, updated_at)
     VALUES (
       gen_random_uuid(),
       'League Full Name',
       'league_api_id_here',  -- e.g., '4424' for MLB
       true,
       NOW(),
       NOW()
     );
     ```

### Team Keys
- **Location**: Team keys are stored in the `teams` table.
- **Key Format**: Use the external API's team ID (e.g., TheSportsDB team ID).
- **Association**: Each team must have a valid `league_id` that matches a record in the `leagues` table.

### Updating Keys
If you need to update a league or team key:
1. Update the `key` field in the respective table.
2. Ensure all foreign key relationships remain valid.
3. Test the data sync to confirm the new key works with the API.

### Environment Variables
For API keys used to authenticate with external services, update the `.env` file:
```env
# TheSportsDB API Key
THESPORTSDB_API_KEY=your_api_key_here

# Other API keys as needed
# THE_ODDS_API_KEY=your_odds_api_key
```

## Data Services & Backend Scripts

This project includes backend services for fetching and storing data from external APIs into Supabase.

### MLB Data Service (`src/services/theSportsDbService.ts`)

This service is responsible for fetching and managing MLB data from TheSportsDB API.

- **Functions:** Includes functions to fetch and store:
  - MLB league information
  - MLB teams
  - MLB venues
  - Players for all MLB teams
  - MLB game schedules for specified seasons
- **API Key:** Uses `THESPORTSDB_API_KEY` from the `.env` file. A public key `502451` is used as a fallback if the env var is not set, but it's recommended to use your own.
- **Usage:** Data is upserted into relevant Supabase tables (`leagues`, `teams`, `players`, `venues`, `games`).

**Manual Execution (for testing or initial population):**

Ensure your `.env` file is configured with Supabase and TheSportsDB credentials. To run the script and populate MLB data:
1. Uncomment the `runDataPopulationTasks().catch(console.error);` line at the end of `src/services/theSportsDbService.ts`.
2. Execute the script:
   ```sh
   npx tsx src/services/theSportsDbService.ts
   ```
3. Re-comment the line after execution to prevent accidental runs.

**Scheduled Updates:**
Data fetching is scheduled as follows (implementation via Supabase Edge Functions or similar is pending):
- **Venues Data:** Once per month.
- **Schedules Data:** Once per week.
- **Teams and Players Data:** Once per day.

## AI News Generation

This feature leverages AI to generate unique, SEO-optimized news articles related to MLB games by combining data from SportsRadar, astrological insights, and team/player databases. The articles are written by Anthropic's Claude Haiku 3.5 LLM.

### Architecture Overview

1.  **Data Ingestion:**
    *   MLB news (previews, recaps, analysis) is fetched from the **SportsRadar API**.
    *   Relevant astrological data is retrieved from the project's internal **Astrology API**.
    *   Team and player statistics are pulled from the **local database**.
2.  **Content Generation (Backend Service):**
    *   A backend service (e.g., Node.js script, serverless function) orchestrates the process.
    *   It constructs detailed prompts for the **Anthropic Claude API**, including:
        *   Raw sports news.
        *   Astrological insights for the game date/teams/players.
        *   Relevant team/player data.
        *   SEO keywords and desired article tone.
    *   The LLM generates the article content, title, subheading, and potentially suggestions for a feature image.
3.  **Article Storage:**
    *   Generated articles are stored (e.g., in a Supabase database table or as Markdown files in the repository).
    *   The schema includes fields for title, slug, HTML content, feature image URL, SEO metadata, and publication date.
4.  **Automated Publishing:**
    *   A cron job or scheduled task triggers the content generation and publishing process on a regular basis (e.g., daily).
5.  **Frontend Display:**
    *   A new `/news` page displays a list of all generated articles and allows viewing individual articles.
    *   A "Featured Article" section on the Dashboard highlights the latest or a specific article with its image, title, and a link.

## Team Chemistry Feature

The Team Chemistry feature analyzes player astrological data to calculate team compatibility and performance metrics. This helps provide deeper insights into team dynamics and potential performance.

### Current Implementation

The team chemistry system is already set up and running with the following components:

1. **Database Table**: `team_chemistry` table is created with all necessary fields
2. **Data Population**: Team chemistry scores have been calculated and stored
3. **Frontend Integration**: Team pages display the chemistry scores and analysis

### Updating Team Chemistry

To update the team chemistry data with the latest player information:

```bash
node scripts/update-player-scores.js
```

This script will:
- Update player impact and astro influence scores
- Recalculate team chemistry metrics
- Update the team_chemistry table with fresh data

### Viewing Team Chemistry

- Navigate to any team's page to view their chemistry score and analysis
- Scores range from 0-100, with higher numbers indicating better team chemistry
- Detailed metrics include:
  - Elemental balance (fire, earth, air, water)
  - Aspect harmony (challenging and harmonious aspects)
  - Last updated timestamp

### Environment Variables

The following environment variables must be set in your `.env` file for this feature to function:

*   `ANTHROPIC_API_KEY`: Your API key for Anthropic Claude.
*   `SPORTS_RADAR_NEWS_API_KEY`: Your API key for SportsRadar (specifically for news endpoints).
*   `(Other relevant keys for Astrology API and Database if they are not already listed)`

### Data Flow

```
SportsRadar API --(MLB News)--> \
                                 \
Astrology API --(Astro Data)--> ---- Backend Service ----(Prompt)----> Anthropic API (Claude)
                                 /                                      |
Database --(Team/Player Data)--> /                                       |
                                                                        |
                                     <----(Generated Article)------------/
                                                                        |
                                                                        V
                                                                  Article Storage
                                                                        |
                                                                        V
                                                         Frontend (News Page, Dashboard)
```

### Future Enhancements for AI News

*   Integration with AI image generation for feature images.
*   Advanced SEO optimization techniques.
*   User feedback mechanism for article quality.
*   Personalized news feeds based on user preferences.

## TODO / Future Enhancements

- **Implement Scheduled Data Updates:** Set up Supabase Edge Functions (or other cron mechanism) to automate data fetching from TheSportsDB and other APIs according to the defined schedules.
- **Move Hardcoded API Key:** Ensure the TheSportsDB API key is exclusively managed via the `.env` file and remove the hardcoded fallback from `src/services/theSportsDbService.ts`.
- **Expand Data Services:** Develop similar data fetching services for other sports (NBA, NFL, Boxing) using relevant APIs.
- **Refine Error Handling & Logging:** Enhance error handling and logging in all data services for better monitoring and debugging.
- **Address Lint Issues:** Resolve any remaining TypeScript lint issues (e.g., the 'Type instantiation is excessively deep' in `src/lib/supabase.ts`).
- **Frontend Development:** Continue development of the Astro frontend application to display and utilize the fetched data.
- **Comprehensive Database Schema Documentation:** Add more details about each table and its columns in this README or a separate `DATABASE.md`.

## Project Structure (Simplified)

```
/astro-bet-advisor
|-- .env                 # Local environment variables (gitignored)
|-- .env.example         # Example environment file (if provided)
|-- package.json
|-- tsconfig.json
|-- astro.config.mjs     # Astro configuration (if applicable)
|-- public/
|   |-- ...              # Static assets
|-- src/
|   |-- components/      # UI components
|   |-- layouts/         # Astro layouts
|   |-- pages/           # Astro pages
|   |-- lib/
|   |   |-- supabase.ts  # Supabase client setup and helper functions
|   |-- services/
|   |   |-- theSportsDbService.ts # Service for TheSportsDB API interaction
|   |-- types/
|   |   |-- database.types.ts # Auto-generated Supabase schema types
|   |   |-- index.d.ts        # Custom global type definitions
|-- README.md
```

## Team Chemistry Implementation

The Full Moon Odds includes a robust team chemistry system that analyzes the elemental balance of teams to provide insights into their performance. Here's how it works:

### Key Features

1. **Unified Chemistry Fetching**
   - Single `fetchTeamChemistry` function handles all team types (NBA, MLB, etc.)
   - Multiple fallback strategies to find chemistry data
   - Comprehensive error handling and logging

2. **Data Sources**
   - Primary: `team_chemistry` table in Supabase
   - Fallback: Team-specific tables (e.g., `nba_teams`)
   - Default values when no data is available

3. **Elemental Balance**
   - Each team is scored across four elements: Fire, Earth, Air, and Water
   - Balance score indicates overall team harmony
   - Scores are normalized between 0-100

### Adding New Teams

To add chemistry data for new teams:

1. **Add to team_chemistry table**
   ```sql
   INSERT INTO team_chemistry (
     team_id, 
     team_name,
     team_abbreviation,
     score,
     elements,
     calculated_at
   ) VALUES (
     'team-uuid-or-external-id',
     'Team Name',
     'TEA',
     75,
     '{"fire": 70, "earth": 65, "air": 80, "water": 75, "balance": 72}',
     NOW()
   );
   ```

2. **Alternative: Use External ID**
   - For MLB teams, you can use the external_id from the teams table
   - The system will automatically match using either UUID or external_id

3. **Fallback Logic**
   The system tries these methods in order:
   1. Team UUID in team_chemistry
   2. External ID in team_chemistry (for MLB teams)
   3. Team abbreviation in team_chemistry
   4. Default values if no match found

### Debugging

Enable debug logging by adding these console.log statements in the code:

```typescript
console.log('[fetchTeamChemistry] Team data:', {
  teamId,
  teamName: teamData.name,
  leagueId: teamData.league_id,
  externalId: teamData.external_id,
  abbreviation: teamData.abbreviation
});
```

## Database Schema Overview

This section outlines the structure and relationships of the core database tables used in the Full Moon Odds application.

### Core Entities and Their Relationships:

1.  **`leagues`**:
    *   **Purpose**: Stores information about different sports leagues (e.g., MLB, NBA).
    *   **Primary Key**: `id` (UUID).
    *   **Key Columns**: `key` (unique text identifier like "MLB"), `name`, `sport_type`.
    *   **Connected to**:
        *   `teams` (one league has many teams) via `teams.league_id`.
        *   `games` (one league has many games) via `games.league_id`.

2.  **`teams`**:
    *   **Purpose**: Stores information about individual sports teams.
    *   **Primary Key**: `id` (UUID).
    *   **Foreign Key**: `league_id` REFERENCES `leagues(id)`.
    *   **Key Columns**: `name`.
    *   **Connected to**:
        *   `players` via `players.team_id`.
        *   `games` (as `home_team_id` and `away_team_id`) via `games.home_team_id` and `games.away_team_id`.
        *   `sport_type` (TEXT): Enum-like field to indicate the sport (e.g., 'baseball_mlb', 'basketball_nba').

### Frontend Data Hydration: The `Game` Type

While the database tables store raw, normalized data, the frontend application (particularly components like `GameCard`) often requires a more denormalized and augmented data structure. This is primarily represented by the `Game` interface defined in `src/types/index.ts`.

**Key characteristics of the frontend `Game` type:**

*   **Data Aggregation**: Instances of the `Game` type are typically constructed by combining data from multiple database tables:
    *   Core game details from the `games` table.
    *   League information (like `league_name`) by joining with the `leagues` table via `league_id`.
    *   Full `home_team` and `away_team` objects by joining with the `teams` table via `home_team_id` and `away_team_id` respectively. These team objects include details like name, city, logo, and team colors (`primary_color`, `secondary_color`).
*   **Derived Fields**: The `Game` interface includes fields that are derived or calculated for UI purposes:
    *   `start_time`: An ISO string combining `game_date` and `game_time_utc` for easier date/time manipulation.
    *   `sport`: A simplified `Sport` enum value (e.g., 'mlb', 'nba') derived from `sport_type` or the linked league's key.
    *   `league_name`: The name of the league.
    *   `home_team_name`, `away_team_name`: Names of the home and away teams.
    *   Astrological data fields (e.g., `sun_sign_influence`, `moon_phase_effect`) are also part of this interface, populated by astrological calculation services.

**Data Fetching and Mapping:**

*   The `useUpcomingGames` hook (`src/hooks/useUpcomingGames.ts`) is a primary example of where this data aggregation and mapping occurs. It fetches data using Supabase queries that join the necessary tables and then maps the results to the `Game[]` type.
*   Individual pages like `LeaguePage.tsx` may perform similar direct Supabase queries and mapping logic to prepare data for `GameCard` components.
*   The `Team` type used within the `Game` object (and also by the `useTeams` hook) is aligned with the `teams` table schema but also ensures fields like `primary_color` and `secondary_color` are available for UI styling.

3.  **`players`**:
    *   **Purpose**: Stores information about individual players.
    *   **Primary Key**: `id` (UUID).
    *   **Foreign Key**: `team_id` REFERENCES `teams(id)`.
    *   **Key Columns**: `external_id`, `first_name`, `last_name`, `position`.
    *   **Connected to**:
        *   `baseball_stats` via `baseball_stats.player_id`.

4.  **`games`**:
    *   **Purpose**: Stores information about specific games or matches.
    *   **Primary Key**: `id` (UUID).
    *   **Foreign Keys**:
        *   `league_id` REFERENCES `leagues(id)`.
        *   `home_team_id` REFERENCES `teams(id)`.
        *   `away_team_id` REFERENCES `teams(id)`.
        *   `venue_id` REFERENCES `venues(id)` (optional).
    *   **Key Columns**: `external_id`, `game_date`, `status`, `home_team_score`, `away_team_score`.

5.  **`baseball_stats`**:
    *   **Purpose**: Stores detailed baseball statistics for players.
    *   **Primary Key**: `id` (BIGSERIAL).
    *   **Foreign Keys**:
        *   `player_id` REFERENCES `players(id)`.
        *   `team_id` REFERENCES `teams(id)`.
    *   **Key Columns**: `player_external_id`, `season`, `team_abbreviation`, and various stat fields.
    *   **Unique Constraints**: `(player_id, season, team_id)` and `(player_external_id, season, team_abbreviation)`.

### Mapping Tables:

*   **Purpose**: Tables like `league_mappings`, `team_mappings`, `player_mappings`, and `venue_mappings` link external API IDs to your internal database UUIDs. This is crucial for data synchronization.
*   **Structure**: Typically `external_id` (PK), `internal_id` (FK to the main table's `id`).

### Summary of Connections:

*   A `league` has many `teams`.
*   A `team` belongs to one `league` and has many `players`.
*   A `player` belongs to one `team` (at a time) and has `baseball_stats` records.
*   A `game` belongs to a `league` and involves a `home_team` and an `away_team`.
*   `baseball_stats` are linked to a specific `player` and the `team` they played for in a given `season`.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details (if one exists).

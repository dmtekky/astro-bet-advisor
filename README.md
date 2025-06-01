# Astro Bet Advisor

A web-based tool that helps users make informed sports betting decisions by analyzing odds data, astrological factors, and comprehensive sports statistics.

## Features

- Dashboard with tabs for different sports (NBA, MLB, NFL, Boxing planned).
- Player and team cards displaying betting odds.
- Astrological insights for players.
- **Comprehensive MLB Data Integration:** Fetches and stores MLB teams, players, venues, and game schedules from TheSportsDB.
- Data caching and storage in Supabase for optimal performance and historical analysis.

## Technologies Used

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui (Assumed based on typical Astro setups, adjust if different)
- **Data Management**: Supabase (PostgreSQL), Tanstack React Query (Assumed for frontend data fetching)
- **Backend Scripting**: Node.js, TypeScript, tsx
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

## Database Schema Overview

This section outlines the structure and relationships of the core database tables used in the Astro Bet Advisor application.

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

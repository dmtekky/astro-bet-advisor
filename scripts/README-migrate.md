# MLB Teams and Players Migration

This script migrates MLB teams and players data from API-SPORTS to the Supabase database.

## Prerequisites

1. Python 3.9 or higher
2. API key from API-SPORTS (https://dashboard.api-sports.io/)
3. Supabase project with the required tables

## Setup

1. Install the required dependencies:
   ```bash
   pip install -r requirements-migrate.txt
   ```

2. Create a `.env` file in the project root with the following variables:
   ```
   API_SPORTS_KEY=your_api_sports_key
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Running the Migration

1. Make the script executable:
   ```bash
   chmod +x migrate_mlb_teams_players.py
   ```

2. Run the migration script:
   ```bash
   cd /path/to/astro-bet-advisor/scripts
   python migrate_mlb_teams_players.py
   ```

## What the Script Does

1. Fetches all MLB teams from API-SPORTS
2. For each team:
   - Tries to find an existing team by external_id
   - If not found, tries to find by name
   - If still not found, creates a new team
   - Updates the team with the latest data from the API
3. For each player on the team:
   - Tries to find an existing player by external_id
   - Updates the player's information if found
   - Creates a new player if not found
   - Maintains the relationship with the team

## Logging

The script logs its progress to stdout. You can redirect the output to a file:

```bash
python migrate_mlb_teams_players.py > migration.log 2>&1
```

## Error Handling

The script is designed to be idempotent and can be safely run multiple times. It will:
- Skip teams/players that already exist
- Update any changed information
- Continue processing even if some items fail

## Notes

- The script uses the 2024 MLB season by default. Change the `season` parameter in the `main()` function if needed.
- API rate limits may apply. The script includes basic error handling for rate limiting.
- The script preserves existing player data while updating team references.

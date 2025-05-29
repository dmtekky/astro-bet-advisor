# API-Sports Player Statistics Integration

This document explains how to use the new API-Sports integration to fetch player statistics for your MLB players.

## Overview

We've created a two-step process to fetch player statistics from API-Sports:

1. **Player Mapping**: First, we create a mapping between your existing players and API-Sports player IDs
2. **Stats Fetching**: Then, we use this mapping to fetch and store player statistics

## Setup

### 1. Run the SQL Migration

The SQL migration creates the necessary tables and functions:

```bash
cd supabase
supabase db push migrations/20250527_player_stats_tables.sql
```

This creates:
- `player_api_mapping` table: Maps your players to API-Sports players
- `player_stats` table: Stores detailed player statistics
- `player_stats_view`: A view joining players with their stats
- Helper functions for querying stats

### 2. Deploy the Supabase Edge Functions

```bash
cd supabase/functions
supabase functions deploy api-sports-player-mapper --project-ref awoxkynorbspcrrggbca
supabase functions deploy api-sports-player-stats --project-ref awoxkynorbspcrrggbca
```

## Usage

### Step 1: Create Player Mappings

First, run the player mapper to create mappings between your players and API-Sports players:

```
https://awoxkynorbspcrrggbca.functions.supabase.co/api-sports-player-mapper
```

This will process all MLB teams. To process a specific team:

```
https://awoxkynorbspcrrggbca.functions.supabase.co/api-sports-player-mapper?team=1
```

The mapper uses fuzzy name matching to find the best match for each player.

### Step 2: Fetch Player Statistics

Once mappings are created, fetch player statistics:

```
https://awoxkynorbspcrrggbca.functions.supabase.co/api-sports-player-stats
```

For a specific player:

```
https://awoxkynorbspcrrggbca.functions.supabase.co/api-sports-player-stats?player_id=123
```

For a specific team:

```
https://awoxkynorbspcrrggbca.functions.supabase.co/api-sports-player-stats?team_id=456
```

### Scheduling Updates

For automatic updates, you can schedule these functions to run daily:

1. Player mapper: Once per week (mappings don't change often)
2. Player stats: Daily (to get the latest stats)

## Data Structure

### Player Stats Table

The `player_stats` table includes:

- **Basic Info**: player_id, season, position
- **Batting Stats**: at_bats, hits, runs, home_runs, rbi, batting_average, etc.
- **Pitching Stats**: wins, losses, era, innings_pitched, strikeouts, etc.
- **Fielding Stats**: putouts, assists, errors, fielding_percentage

### Querying Stats

Use the `player_stats_view` to easily query player stats:

```sql
-- Get all players with their stats
SELECT * FROM player_stats_view;

-- Get stats for a specific team
SELECT * FROM get_team_player_stats(123);
```

## Troubleshooting

- If player mappings are incorrect, you can manually update them in the `player_api_mapping` table
- To force an update of all stats, add `?force=true` to the player stats URL
- Check function logs in the Supabase dashboard for detailed error information

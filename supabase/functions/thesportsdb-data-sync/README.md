# TheSportsDB Data Sync Edge Function

This Edge Function syncs MLB data from TheSportsDB API to your Supabase database.

## Prerequisites

- Node.js 16+
- Supabase CLI
- A Supabase project with the required tables

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   VITE_SPORTSDB_API_KEY=your_thesportsdb_api_key
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy thesportsdb-data-sync --no-verify-jwt
   ```

## Usage

### Manual Trigger

To manually trigger the data sync, make a POST request to the function URL:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/thesportsdb-data-sync
```

### Testing Locally

1. Start the local development server:
   ```bash
   supabase functions serve thesportsdb-data-sync --no-verify-jwt
   ```

2. Test the function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/thesportsdb-data-sync
   ```

## Available Endpoints

- `GET /` - Returns a simple status message
- `POST /` - Triggers the data sync
- `POST /?initial=true` - Performs an initial data load

## Logs

View function logs:

```bash
supabase functions logs thesportsdb-data-sync
```

## Database Schema

Make sure your Supabase database has the following tables:

- `teams` - Stores MLB teams
- `players` - Stores player information
- `games` - Stores game schedules and results
## Troubleshooting

### Missing Environment Variables

Make sure all required environment variables are set in your `.env` file and in your Supabase project settings.

### Database Permissions

Ensure your Supabase RLS (Row Level Security) policies allow the function to read/write to the required tables.

### API Rate Limiting

TheSportsDB API has rate limits. If you encounter rate limiting issues, consider adding delays between requests.

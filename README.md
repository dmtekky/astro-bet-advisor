
# Sports Betting Assistant App

A web-based tool that helps users make informed sports betting decisions by analyzing odds data and astrological factors.

## Features

- Dashboard with tabs for different sports (NBA, MLB, NFL, Boxing)
- Player and team cards displaying betting odds
- Astrological insights for players
- Data caching in Supabase for optimal performance

## Technologies Used

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Data Management**: Tanstack React Query, Supabase
- **APIs**: The Odds API, Sports Game Odds API, Swiss Ephemeris

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A Supabase account

### Setup

1. Clone the repository:
```sh
git clone <repository-url>
cd sports-betting-assistant
```

2. Install dependencies:
```sh
npm install
```

3. Connect to Supabase:
   - Create a Supabase project at https://supabase.com/
   - Update `src/lib/supabase.ts` with your Supabase credentials
   - Set up the required database tables (see Database Setup below)

4. Start the development server:
```sh
npm run dev
```

5. Open your browser at http://localhost:8080

### Database Setup

Create the following tables in your Supabase project:

1. **Players**:
   - id (uuid, primary key)
   - name (text)
   - team (text)
   - position (text)
   - birthDate (date)
   - image (text, URL)
   - sport (text)

2. **Teams**:
   - id (uuid, primary key)
   - name (text)
   - abbreviation (text)
   - logo (text, URL)
   - sport (text)

3. **BettingOdds**:
   - id (uuid, primary key)
   - playerId (uuid, foreign key)
   - teamId (uuid, foreign key)
   - odds (numeric)
   - type (text)
   - bookmaker (text)
   - timestamp (timestamptz)

4. **AstrologicalData**:
   - id (uuid, primary key)
   - playerId (uuid, foreign key)
   - favorability (integer)
   - influences (text[])
   - details (text)
   - timestamp (timestamptz)

## API Integration

1. **The Odds API**: Used for retrieving betting odds from various bookmakers
2. **Sports Game Odds API**: Alternative source for betting odds
3. **Swiss Ephemeris**: Used for astrological calculations

## License

This project is licensed under the MIT License - see the LICENSE file for details.


# Sports Betting Astrological Analysis System

This system calculates astrological influences on sports players to assist with betting decisions. It uses Swiss Ephemeris for astronomical calculations and stores data in Supabase.

## Components

1. **Python Ephemeris Calculator** (`scripts/computeEphemeris.py`)
   - Generates daily ephemeris data for 2025
   - Calculates moon phases, planetary positions, retrograde status, and aspects
   - Stores data in Supabase 'ephemeris' table

2. **JavaScript Astrological Calculator** (`src/lib/astroCalc.js`)
   - Calculates astrological impacts for players based on birth dates
   - Determines favorability scores based on multiple factors
   - Interfaces with Supabase for data storage/retrieval

3. **Data Hooks** (`src/hooks/useSportsData.ts`)
   - React Query hooks for fetching and calculating astrological data
   - Efficient data fetching with caching and revalidation

4. **Edge Function** (`supabase/functions/update-ephemeris/index.ts`)
   - Serverless function to trigger ephemeris updates
   - Can be scheduled or manually triggered

## Setup Instructions

### Prerequisites
- Python 3.7+ with pyswisseph package installed
- Swiss Ephemeris files (can be downloaded from https://www.astro.com/ftp/swisseph/)
- Supabase account and project

### Installation

1. **Install Python dependencies**
   ```
   pip install pyswisseph supabase
   ```

2. **Set up Swiss Ephemeris**
   - Download ephemeris files from astro.com
   - Update the path in computeEphemeris.py to point to your files

3. **Generate ephemeris data**
   ```
   python scripts/computeEphemeris.py
   ```
   
4. **Deploy edge function**
   ```
   npx supabase functions deploy update-ephemeris
   ```

5. **Set up cron job** (requires database admin access)
   - Run the SQL in scripts/setup-cron-job.sql

## Usage

To calculate astrological influences for a player:

```javascript
import { calculateAstrologicalInfluence } from '@/lib/astroCalc';

// Get astrological data for a player
const astroData = await calculateAstrologicalInfluence(player);
console.log(`Favorability score: ${astroData.score}/100`);
console.log(`Key influences: ${astroData.influences.join(', ')}`);
```

Or using React hooks:

```javascript
import { useAstrologicalData } from '@/hooks/useSportsData';

function PlayerComponent({ playerId }) {
  const { data: astroData, isLoading } = useAstrologicalData(playerId);
  
  if (isLoading) return <p>Loading astrological data...</p>;
  
  return (
    <div>
      <h3>Astrological Favorability: {astroData?.favorability}/100</h3>
      <ul>
        {astroData?.influences?.map(influence => (
          <li key={influence}>{influence}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Maintenance

- Ephemeris data should be regenerated yearly
- The system handles player birth dates at noon when exact birth time is unknown
- Favorability scores range from 0-100, with 50 being neutral

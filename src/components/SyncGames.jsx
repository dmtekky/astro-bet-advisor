import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

/**
 * Component for syncing NBA and MLB games from The Odds API
 * This provides a UI for manually triggering the sync process
 */
export default function SyncGames() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Function to sync NBA games
  const syncNbaGames = async () => {
    try {
      setSyncing(true);
      setError(null);
      setResult(null);

      // 1. Get the API key from environment variables
      const API_KEY = import.meta.env.VITE_THE_ODDS_API_KEY;
      if (!API_KEY) {
        throw new Error('API key is missing. Please check your environment variables.');
      }

      // 2. Fetch NBA games from The Odds API
      console.log('Fetching NBA games from The Odds API...');
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const games = await response.json();
      console.log(`Found ${games.length} NBA games`);

      // 3. Store raw response in cached_odds
      const { error: cacheError } = await supabase
        .from('cached_odds')
        .upsert({
          sport: 'basketball_nba',
          data: games,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'sport'
        });

      if (cacheError) {
        console.error('Error caching odds:', cacheError);
      }

      // 4. Process games for schedules table
      const processedGames = games.map(game => ({
        // Store the API id in external_id for traceability
        external_id: game.id,
        // Use the API id as schedules.id only if it is a valid UUID
        id: /^[0-9a-fA-F-]{36}$/.test(game.id) ? game.id : undefined,
        sport: 'nba',
        home_team: game.home_team,
        away_team: game.away_team,
        game_time: game.commence_time,
        status: 'scheduled',
        last_updated: new Date().toISOString()
      }));

      // 5. Upsert to schedules table
      const { error: upsertError } = await supabase
        .from('schedules')
        .upsert(processedGames, { onConflict: 'espn_id' });

      if (upsertError) {
        throw new Error(`Error upserting games: ${upsertError.message}`);
      }

      // 6. Fetch MLB games
      console.log('Fetching MLB games from The Odds API...');
      const mlbResponse = await fetch(
        `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso`
      );

      if (!mlbResponse.ok) {
        const errorData = await mlbResponse.json().catch(() => ({}));
        throw new Error(`API Error: ${mlbResponse.status} - ${errorData.message || mlbResponse.statusText}`);
      }

      const mlbGames = await mlbResponse.json();
      console.log(`Found ${mlbGames.length} MLB games`);

      // 7. Store MLB raw response in cached_odds
      const { error: mlbCacheError } = await supabase
        .from('cached_odds')
        .upsert({
          sport: 'baseball_mlb',
          data: mlbGames,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'sport'
        });

      if (mlbCacheError) {
        console.error('Error caching MLB odds:', mlbCacheError);
      }

      // 8. Process MLB games for schedules table
      const processedMlbGames = mlbGames.map(game => ({
        // Store the API id in external_id for traceability
        external_id: game.id,
        // Use the API id as schedules.id only if it is a valid UUID
        id: /^[0-9a-fA-F-]{36}$/.test(game.id) ? game.id : undefined,
        sport: 'mlb',
        home_team: game.home_team,
        away_team: game.away_team,
        game_time: game.commence_time,
        status: 'scheduled',
        last_updated: new Date().toISOString()
      }));

      // 9. Upsert MLB games to schedules table
      const { error: mlbUpsertError } = await supabase
        .from('schedules')
        .upsert(processedMlbGames, { onConflict: 'espn_id' });

      if (mlbUpsertError) {
        throw new Error(`Error upserting MLB games: ${mlbUpsertError.message}`);
      }

      // Success!
      setResult({
        nba: {
          gameCount: games.length,
          success: true
        },
        mlb: {
          gameCount: mlbGames.length,
          success: true
        }
      });
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Sync NBA & MLB Games</h2>
      <p className="text-sm text-gray-500">
        This will fetch the latest NBA and MLB games from The Odds API and store them in Supabase.
        Run this once per week to keep your game data up-to-date while minimizing API calls.
      </p>
      
      <Button 
        onClick={syncNbaGames} 
        disabled={syncing}
        className="w-full"
      >
        {syncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing Games...
          </>
        ) : (
          'Sync NBA & MLB Games'
        )}
      </Button>
      
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {result && (
        <Alert variant="success" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            <p>Successfully synced:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>{result.nba.gameCount} NBA games</li>
              <li>{result.mlb.gameCount} MLB games</li>
            </ul>
            <p className="mt-2 text-sm">Last updated: {new Date().toLocaleString()}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

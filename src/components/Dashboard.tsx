import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { calculateAstrologicalImpact } from '@/lib/astroFormula';
import { fetchOdds } from '@/lib/oddsApi';

interface Game {
  homeTeam: string;
  awayTeam: string;
  odds: {
    home: number;
    away: number;
  };
  astroImpact: number;
}

export const Dashboard = () => {
  const [sport, setSport] = useState('nba');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const sports = [
    { value: 'nba', label: 'NBA' },
    { value: 'mlb', label: 'MLB' },
    { value: 'nfl', label: 'NFL' },
    { value: 'boxing', label: 'Boxing' },
  ];

  useEffect(() => {
    fetchGames();
  }, [sport, date]);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const odds = await fetchOdds(sport);
      
      // If no games found, show a message
      if (odds.length === 0) {
        setError(`No games found for ${sport.toUpperCase()} on ${date}`);
        setGames([]);
        return;
      }

      const gamesWithAstro = await Promise.all(
        odds.map(async (game) => {
          try {
            const astroImpact = await calculateAstrologicalImpact(
              [
                { name: game.home_team, birth_date: '', sport, win_shares: 0 },
                { name: game.away_team, birth_date: '', sport, win_shares: 0 }
              ],
              {
                moon_phase: 0.5,
                moon_sign: 'Cancer',
                sun_sign: 'Leo',
                mercury_sign: 'Gemini',
                venus_sign: 'Taurus',
                mars_sign: 'Aries',
                jupiter_sign: 'Sagittarius',
                saturn_sign: 'Capricorn',
                mercury_retrograde: false,
                aspects: {
                  sun_mars: null,
                  sun_saturn: null,
                  sun_jupiter: 'trine'
                }
              },
              date
            );

            return {
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              odds: {
                home: game.bookmakers[0].markets[0].outcomes[0].price,
                away: game.bookmakers[0].markets[0].outcomes[1].price
              },
              astroImpact
            };
          } catch (astroError) {
            console.error(`Error calculating astro impact for game ${game.home_team} vs ${game.away_team}:`, astroError);
            return null;
          }
        })
      );

      // Filter out any games that failed to calculate astro impact
      const validGames = gamesWithAstro.filter((game): game is Game => game !== null);
      setGames(validGames);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error fetching games",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4 mb-6">
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger>
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sportOption) => (
              <SelectItem key={sportOption.value} value={sportOption.value}>
                {sportOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button onClick={fetchGames} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Games'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <Button onClick={fetchGames}>Try Again</Button>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No games found for {sport.toUpperCase()} on {date}</p>
          <Button onClick={fetchGames}>Refresh</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>
                  {game.homeTeam} vs {game.awayTeam}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Home Odds</span>
                    <span>{game.odds.home.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Away Odds</span>
                    <span>{game.odds.away.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Astro Impact</span>
                    <span className={`font-bold ${
                      game.astroImpact > 60 ? 'text-green-600' :
                      game.astroImpact < 40 ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {game.astroImpact.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

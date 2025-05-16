import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Clock, Zap, BarChart2, CalendarDays, Clock3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchOdds } from '@/lib/oddsApi';
import AstroStatus from '../AstroStatus';
import NextEvent from '../NextEvent';
import EventHistory from '../EventHistory';
import CosmicHeadlines from '../CosmicHeadlines';
import GameCard from '../GameCard';

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  commencing_at: string;
  bookmakers: Array<{
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
  oas?: number;
}

// Map URL sport params to API sport keys
const SPORT_MAPPING: Record<string, string> = {
  nba: 'basketball_nba',
  mlb: 'baseball_mlb',
  nfl: 'americanfootball_nfl',
  boxing: 'boxing',
  soccer: 'soccer',
  ncaa: 'college_football',
};

const EnhancedDashboard = () => {
  const [searchParams] = useSearchParams();
  const [sport, setSport] = useState('basketball_nba');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Sync URL parameter with component state
  useEffect(() => {
    const urlSport = searchParams.get('sport') || 'nba';
    const apiSport = SPORT_MAPPING[urlSport] || 'basketball_nba';
    setSport(apiSport);
  }, [searchParams]);

  const sports = [
    { value: 'basketball_nba', label: 'NBA' },
    { value: 'baseball_mlb', label: 'MLB' },
    { value: 'americanfootball_nfl', label: 'NFL' },
    { value: 'boxing', label: 'Boxing' },
    { value: 'soccer', label: 'Soccer', disabled: true },
    { value: 'college_football', label: 'NCAA Football', disabled: true },
  ];

  useEffect(() => {
    fetchGames();
  }, [sport]);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const odds = await fetchOdds(sport);
      
      if (!odds || odds.length === 0) {
        setError(`No games found for ${sport.split('_').pop()?.toUpperCase()}`);
        setGames([]);
        return;
      }

      // Transform the odds data to match our Game interface and add mock OAS
      const gamesWithOAS = odds.map(game => ({
        id: `${game.sport_key}_${game.commencing_at}_${game.home_team}_vs_${game.away_team}`.toLowerCase().replace(/\s+/g, '_'),
        sport_key: game.sport_key,
        sport_title: game.sport_title,
        home_team: game.home_team,
        away_team: game.away_team,
        commence_time: game.commencing_at,
        commencing_at: game.commencing_at,
        bookmakers: game.bookmakers || [],
        oas: Math.floor(Math.random() * 100) // Random OAS between 0-100 for demo
      }));

      setGames(gamesWithOAS);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Full Moon Odds</h1>
          <p className="text-gray-600">Your astrological edge in sports betting</p>
        </header>

        {/* Sport Tabs */}
        <Tabs 
          defaultValue={sport} 
          onValueChange={(value) => !sports.find(s => s.value === value)?.disabled && setSport(value)}
          className="w-full"
        >
          <ScrollArea className="w-full">
            <div className="pb-2">
              <TabsList className="inline-flex w-max bg-gray-200 p-1.5 rounded-xl">
                {sports.map((s) => (
                  <TabsTrigger 
                    key={s.value}
                    value={s.value}
                    disabled={s.disabled}
                    className={`px-6 py-2 rounded-lg transition-all ${s.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-indigo-600'}`}
                  >
                    {s.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </div>
          </ScrollArea>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Games */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Today's Games</CardTitle>
                    <CardDescription>{formatDate(new Date().toISOString())}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-500">
                    {error}
                  </div>
                ) : games.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {games.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No games scheduled for today.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cosmic Headlines */}
            <CosmicHeadlines />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Astro Status */}
            <AstroStatus />

            {/* Next Event */}
            <NextEvent />

            {/* Event History */}
            <EventHistory />

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Active Streak</span>
                  </div>
                  <span className="font-bold">5 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Win Rate</span>
                  </div>
                  <span className="font-bold">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="text-sm">This Month</span>
                  </div>
                  <span className="font-bold text-green-600">+$1,245</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;

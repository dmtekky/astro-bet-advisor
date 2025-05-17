import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { Calendar, BarChart2, CalendarDays, Clock3 } from 'lucide-react';
import { useCurrentEphemeris, useFormulaWeights } from '@/hooks/useFormulaData';
import { fetchGames } from '@/lib/games';
import { supabase } from '@/lib/supabase';
import type { Sport } from '@/types/sports';
import { SPORTS } from '@/types/sports';

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  logo?: string;
  abbreviation?: string;
  created_at?: string;
  external_id?: string;
  sport?: string;
  updated_at?: string;
}

interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  start_time: string;
  odds?: string | number;
  oas?: string | number;
  home_team?: Team;
  away_team?: Team;
  created_at?: string;
  external_id?: string;
  score_away?: number;
  score_home?: number;
  sport?: string;
  status?: string;
  updated_at?: string;
}



const LEAGUE_ICONS: Record<string, string> = {
  nba: '🏀',
  nfl: '🏈',
  mlb: '⚾',
  nhl: '🏒',
  epl: '⚽',
};

const LEAGUE_NAMES: Record<string, string> = {
  nba: 'NBA',
  nfl: 'NFL',
  mlb: 'MLB',
  nhl: 'NHL',
  epl: 'Premier League',
};

const EnhancedDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sport, setSport] = useState('basketball_nba');
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: ephemeris, isLoading: isLoadingEphemeris } = useCurrentEphemeris();
  const { data: weights, isLoading: isLoadingWeights } = useFormulaWeights(sport);

  const loadGames = async (sportKey: string) => {
    try {
      setLoading(true);
      
      if (!sportKey) return;
      
      // First, load teams if not already loaded
      if (teams.length === 0) {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('sport', sportKey.split('_')[0]);
          
        if (teamsError) throw teamsError;
        if (teamsData) {
          const typedTeams: Team[] = teamsData.map(team => ({
            ...team,
            // Ensure required fields have default values
            wins: (team as any).wins || 0,
            losses: (team as any).losses || 0,
            // Ensure optional fields are properly typed
            abbreviation: (team as any).abbreviation || '',
            created_at: (team as any).created_at,
            external_id: (team as any).external_id || '',
            sport: (team as any).sport || sportKey.split('_')[0],
            updated_at: (team as any).updated_at,
            logo: (team as any).logo
          }));
          setTeams(typedTeams);
        }
      }
      
      // Then load games
      const gamesData = await fetchGames(sportKey as Sport['key']);
      
      // Transform games with team data
      const transformedGames: Game[] = gamesData.map((game: any) => ({
        ...game,
        home_team: teams.find(t => t.id === game.home_team_id) || { 
          id: game.home_team_id, 
          name: 'Unknown Team',
          wins: 0,
          losses: 0
        },
        away_team: teams.find(t => t.id === game.away_team_id) || { 
          id: game.away_team_id,
          name: 'Unknown Team',
          wins: 0,
          losses: 0
        },
        odds: game.odds || 'N/A',
        oas: game.oas || 0,
        start_time: game.commencing_at || game.start_time
      }));
      
      setGames(transformedGames);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadGames(sport);
  }, [sport]);

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : teamId;
  };

  const getTeamLogo = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.logo || `https://via.placeholder.com/40?text=${teamId.substring(0, 2).toUpperCase()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Full Moon Odds</h1>
          <p className="text-gray-600">Your astrological edge in sports betting</p>
        </header>

        {/* Sport Selection */}
        <div className="flex flex-wrap justify-center gap-2">
          {SPORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSport(s.key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sport === s.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="upcoming">
              <CalendarDays className="w-4 h-4 mr-2" />
              Upcoming Games
            </TabsTrigger>
            <TabsTrigger value="standings">
              <BarChart2 className="w-4 h-4 mr-2" />
              Standings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <ScrollArea className="h-[600px] rounded-md border p-4">
              <div className="space-y-4">
                {games.length === 0 ? (
                  <p className="text-center text-gray-500">No upcoming games found</p>
                ) : (
                  games.map((game) => (
                    <Card key={game.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <img 
                              src={getTeamLogo(game.home_team_id)} 
                              alt={getTeamName(game.home_team_id)}
                              className="w-8 h-8 rounded-full"
                            />
                            <span>{getTeamName(game.home_team_id)}</span>
                          </div>
                          <span className="mx-2">vs</span>
                          <div className="flex items-center space-x-2">
                            <span>{getTeamName(game.away_team_id)}</span>
                            <img 
                              src={getTeamLogo(game.away_team_id)} 
                              alt={getTeamName(game.away_team_id)}
                              className="w-8 h-8 rounded-full"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(game.start_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <Clock3 className="w-4 h-4 mr-1" />
                            {format(new Date(game.start_time), 'h:mm a')}
                          </div>
                          {game.odds && (
                            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              Odds: {game.odds}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teams
                    .sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses))
                    .map((team, index) => (
                      <div 
                        key={team.id} 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-500 w-6">{index + 1}</span>
                          <img 
                            src={team.logo || `https://via.placeholder.com/40?text=${team.name.substring(0, 2).toUpperCase()}`} 
                            alt={team.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <div className="flex space-x-4">
                          <span className="text-green-600">{team.wins} W</span>
                          <span className="text-red-600">{team.losses} L</span>
                          <span className="font-medium">
                            {team.wins + team.losses > 0 
                              ? ((team.wins / (team.wins + team.losses)) * 100).toFixed(1) + '%'
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedDashboard;

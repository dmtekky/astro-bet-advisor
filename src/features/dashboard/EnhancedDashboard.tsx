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
import { GameCard } from './GameCard';

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
  home_team: Team;
  away_team: Team;
  start_time: string;
  odds?: string | number;
  oas?: string | number;
  status?: string;
  league?: string;
  sport?: string;
  created_at?: string;
  external_id?: string;
  score_away?: number;
  score_home?: number;
  updated_at?: string;
  home_team_abbreviation?: string;
  away_team_abbreviation?: string;
  sport_key?: string;
  commencing_at?: string;
  // Required by GameCard component
  astroEdge: number;
  astroInfluence: string;
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
      console.log(`Loading games for sport: ${sportKey}`);
      
      if (!sportKey) {
        console.error('No sport key provided');
        return;
      }
      
      // Skip loading teams for now since we'll use the team names directly from the game
      // This simplifies the data flow since we don't have team IDs in the schedules table
      
      try {
        // Load games
        const gamesData = await fetchGames(sportKey as Sport['key']);
        console.log(`Fetched ${gamesData.length} games`);
        
        if (!gamesData || gamesData.length === 0) {
          console.warn('No games found for sport:', sportKey);
          setGames([]);
          setError('No games found for the selected sport.');
          return;
        }
        
        // Transform games with team data
        const transformedGames: Game[] = gamesData.map((game: any) => {
          // Create team objects directly from game data
          const homeTeam: Team = {
            id: game.home_team_id || `home_${game.id}`,
            name: game.home_team || 'Home Team',
            wins: 0,
            losses: 0,
            abbreviation: game.home_team_abbreviation || 
                        (typeof game.home_team === 'string' ? game.home_team.substring(0, 3).toUpperCase() : 'HT'),
            logo: game.home_team_logo
          };
          
          const awayTeam: Team = {
            id: game.away_team_id || `away_${game.id}`,
            name: game.away_team || 'Away Team',
            wins: 0,
            losses: 0,
            abbreviation: game.away_team_abbreviation || 
                        (typeof game.away_team === 'string' ? game.away_team.substring(0, 3).toUpperCase() : 'AT'),
            logo: game.away_team_logo
          };
          
          // Format the game data
          return {
            ...game,
            id: game.id,
            home_team: homeTeam,
            away_team: awayTeam,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            odds: game.odds || 'N/A',
            oas: game.oas || 0,
            start_time: game.commence_time || game.start_time,
            league: game.league || 
                  (game.sport_key ? game.sport_key.toUpperCase() : 
                  (sportKey.includes('_') ? sportKey.split('_')[1].toUpperCase() : sportKey.toUpperCase())),
            sport: game.sport_key || sportKey,
            status: game.status || 'scheduled',
            // Ensure we have all required fields
            home_team_abbreviation: homeTeam.abbreviation,
            away_team_abbreviation: awayTeam.abbreviation
          };
        });
        
        console.log('Transformed games:', transformedGames);
        setGames(transformedGames);
        setError(null);
      } catch (fetchError) {
        console.error('Error in fetchGames:', fetchError);
        setError('Failed to load game data. Please try again later.');
        setGames([]);
      }
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

  // DEBUG: Log all games and their IDs/teams before rendering
  console.log('DASHBOARD GAMES DATA:', games.map((g, idx) => ({
    idx,
    id: g?.id,
    home_team: typeof g.home_team === 'object' ? g.home_team.name : g.home_team,
    away_team: typeof g.away_team === 'object' ? g.away_team.name : g.away_team,
    start_time: g.start_time,
    league: g.league,
  })));

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
                  games
                    // Ensure we have a valid game ID before mapping
                    .filter(game => {
                      const isValid = game?.id?.toString()?.trim()?.length > 0;
                      if (!isValid) {
                        console.warn('Skipping game with invalid ID:', game);
                      }
                      return isValid;
                    })
                    .map((game, idx) => {
                      // Generate a stable ID if not present
                      const gameId = game.id?.toString()?.trim() || 
                        `game_${game.home_team_id}_${game.away_team_id}_${game.start_time || Date.now()}`;
                      // DEBUG: Log which GameCard is being rendered and with what data
                      console.log(`RENDERING GAMECARD idx=${idx}`, {
                        id: gameId,
                        home_team: typeof game.home_team === 'object' ? game.home_team.name : game.home_team,
                        away_team: typeof game.away_team === 'object' ? game.away_team.name : game.away_team,
                        start_time: game.start_time,
                        league: game.league,
                      });
                      
                      // Create a properly formatted game object that matches the Game interface
                      const formattedGame: Game = {
                        id: gameId,
                        home_team_id: game.home_team_id || `home_${gameId}`,
                        away_team_id: game.away_team_id || `away_${gameId}`,
                        start_time: game.start_time || game.commencing_at || new Date().toISOString(),
                        odds: game.odds || 'N/A',
                        oas: game.oas || 0,
                        status: game.status || 'scheduled',
                        league: game.league || game.sport?.toUpperCase(),
                        sport: game.sport,
                        home_team: (game.home_team && typeof game.home_team === 'object') ? {
                          id: game.home_team.id || game.home_team_id || `home_${gameId}`,
                          name: game.home_team.name || 'Home Team',
                          wins: typeof game.home_team.wins === 'number' ? game.home_team.wins : 0,
                          losses: typeof game.home_team.losses === 'number' ? game.home_team.losses : 0,
                          abbreviation: game.home_team.abbreviation || game.home_team_abbreviation || 'HOM',
                          logo: game.home_team.logo
                        } : {
                          id: game.home_team_id || `home_${gameId}`,
                          name: 'Home Team',
                          wins: 0,
                          losses: 0,
                          abbreviation: game.home_team_abbreviation || 'HOM'
                        },
                        away_team: (game.away_team && typeof game.away_team === 'object') ? {
                          id: game.away_team.id || game.away_team_id || `away_${gameId}`,
                          name: game.away_team.name || 'Away Team',
                          wins: typeof game.away_team.wins === 'number' ? game.away_team.wins : 0,
                          losses: typeof game.away_team.losses === 'number' ? game.away_team.losses : 0,
                          abbreviation: game.away_team.abbreviation || game.away_team_abbreviation || 'AWY',
                          logo: game.away_team.logo
                        } : {
                          id: game.away_team_id || `away_${gameId}`,
                          name: 'Away Team',
                          wins: 0,
                          losses: 0,
                          abbreviation: game.away_team_abbreviation || 'AWY'
                        },
                        // Add required astro properties with default values
                        astroEdge: typeof game.astroEdge === 'number' ? game.astroEdge : 0,
                        astroInfluence: game.astroInfluence || 'Neutral'
                      };
                    
                    return (
                      <GameCard
                        key={game.id}
                        game={formattedGame}
                        className="w-full"
                      />
                    );
                  })
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

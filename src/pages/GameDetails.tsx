import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft, Home, Info } from 'lucide-react';
import type { Game, Team, Player, PlayerSeasonStats, Aspect, AspectType, CelestialBody as GlobalCelestialBody } from '@/types'; 
import { useAstroData } from '@/hooks/useAstroData';
import { calculatePlayerImpactScore } from '@/utils/playerAnalysis';
import { GamePredictionData, createDefaultPredictionData, createDefaultCelestialBody } from '@/types/gamePredictions';
import { predictGameOutcome } from '@/utils/sportsPredictions';
import type { AstroData, ZodiacSign } from '@/types/astrology';

interface DetailedGame extends Omit<Game, 'league'> {
  home_team: Team | null;
  away_team: Team | null;
  venue: any | null;
  league: any | null;
}

interface PlayerDisplayData extends Player {
  seasonStats?: PlayerSeasonStats | null;
  impactScore?: number;
}

const GameDetails: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get game from location state if available (when navigating from GameCard)
  const locationGame = location.state?.game as DetailedGame | undefined;
  
  const [game, setGame] = useState<DetailedGame | null>(locationGame || null);
  const [loading, setLoading] = useState(!locationGame); // If we have the game from location, we don't need to load
  const [error, setError] = useState<string | null>(null);
  const [homeTeamRoster, setHomeTeamRoster] = useState<PlayerDisplayData[]>([]);
  const [awayTeamRoster, setAwayTeamRoster] = useState<PlayerDisplayData[]>([]);
  const [homePlayerStats, setHomePlayerStats] = useState<Record<string, PlayerSeasonStats>>({}); 
  const [awayPlayerStats, setAwayPlayerStats] = useState<Record<string, PlayerSeasonStats>>({}); 
  const [rostersLoading, setRostersLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null); // For new data fetching errors

  const TARGET_SEASON = 2025;
  
  // Fetch game data if not available from location state
  useEffect(() => {
    // Skip fetch if we already have the game from location state
    if (locationGame) {
      return;
    }

    const fetchGameDetails = async () => {
      if (!gameId) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
          .eq('id', gameId);
          
        if (error) {
          console.error('Error fetching game details:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.error('No game found with ID:', gameId);
          throw new Error('Game not found');
        }
        
        setGame(data[0] as unknown as DetailedGame);
      } catch (err: any) {
        console.error('Error fetching game details:', err);
        setError(err.message || 'Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId, locationGame]);

  // Effect to fetch team rosters
  useEffect(() => {
    const fetchRosters = async () => {
      if (!game || !game.home_team_id || !game.away_team_id) {
        if (game && (!game.home_team_id || !game.away_team_id)) {
            // Game loaded but team IDs are missing
            setDataFetchError('Game data is missing team IDs for roster fetching.');
            setRostersLoading(false);
        }
        // If game is null, main loading is still in progress or gameId was invalid
        return;
      }

      setRostersLoading(true);
      setDataFetchError(null); // Clear previous specific errors
      try {
        // console.log(`Fetching rosters for home: ${game.home_team_id}, away: ${game.away_team_id}`);
        const [homeRosterResult, awayRosterResult] = await Promise.all([
          supabase.from('players').select('*').eq('current_team_id', game.home_team_id),
          supabase.from('players').select('*').eq('current_team_id', game.away_team_id),
        ]);

        if (homeRosterResult.error) throw new Error(`Home roster: ${homeRosterResult.error.message}`);
        if (awayRosterResult.error) throw new Error(`Away roster: ${awayRosterResult.error.message}`);

        setHomeTeamRoster(homeRosterResult.data as PlayerDisplayData[]);
        setAwayTeamRoster(awayRosterResult.data as PlayerDisplayData[]);
        // console.log('Rosters fetched:', homeRosterResult.data, awayRosterResult.data);
      } catch (err: any) {
        console.error('Error fetching team rosters:', err);
        setDataFetchError(err.message || 'Failed to load team rosters');
      } finally {
        setRostersLoading(false);
      }
    };

    if (game) { // Only attempt to fetch if game details are present
        fetchRosters();
    }
  }, [game]); // Depends on the game object (which includes home_team_id and away_team_id)

  // Effect to fetch player season stats
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (rostersLoading || (homeTeamRoster.length === 0 && awayTeamRoster.length === 0)) {
        // If rosters are still loading, wait.
        // If rosters are done loading (rostersLoading is false) and both are empty, then no stats to fetch.
        if (!rostersLoading) {
            setStatsLoading(false);
        }
        return;
      }

      setStatsLoading(true);
      setDataFetchError(null); // Clear previous specific errors
      try {
        const playerIds = [...homeTeamRoster, ...awayTeamRoster].map(p => p.id).filter(id => id); // Ensure IDs are valid
        if (playerIds.length === 0) {
          // console.log('No player IDs to fetch stats for.');
          setStatsLoading(false);
          return;
        }
        // console.log(`Fetching stats for ${playerIds.length} players for season ${TARGET_SEASON}`);

        const { data: statsData, error: statsError } = await supabase
          .from('player_season_stats')
          .select('*')
          .in('player_id', playerIds)
          .eq('season', TARGET_SEASON);

        if (statsError) throw statsError;

        const statsMapHome: Record<string, PlayerSeasonStats> = {};
        const statsMapAway: Record<string, PlayerSeasonStats> = {};

        (statsData as PlayerSeasonStats[]).forEach(stat => {
          if (homeTeamRoster.some(p => p.id === stat.player_id)) {
            statsMapHome[stat.player_id] = stat;
            setHomeTeamRoster(prevRoster => 
              prevRoster.map(p => 
                p.id === stat.player_id 
                  ? { ...p, seasonStats: stat, impactScore: calculatePlayerImpactScore(stat) } 
                  : p
              )
            );
          } else if (awayTeamRoster.some(p => p.id === stat.player_id)) {
            statsMapAway[stat.player_id] = stat;
            setAwayTeamRoster(prevRoster => 
              prevRoster.map(p => 
                p.id === stat.player_id 
                  ? { ...p, seasonStats: stat, impactScore: calculatePlayerImpactScore(stat) } 
                  : p
              )
            );
          }
        });
        setHomePlayerStats(statsMapHome);
        setAwayPlayerStats(statsMapAway);
        // console.log('Player stats fetched and mapped:', statsMapHome, statsMapAway);
      } catch (err: any) {
        console.error('Error fetching player season stats:', err);
        setDataFetchError(err.message || 'Failed to load player season stats');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchPlayerStats();
  }, [homeTeamRoster, awayTeamRoster, rostersLoading, TARGET_SEASON]); // Depends on rosters and their loading state
  
  // Fetch astrological data
  const { astroData, loading: astroLoading } = useAstroData(
    game?.start_time
  );
  
  // Generate game prediction
  const gamePrediction = useMemo(() => {
    if (!game || !astroData) return null;
    
    // Create a simplified game object
    const simplifiedGame: Game = {
      id: game.id,
      sport: game.sport,
      home_team_id: game.home_team_id,
      away_team_id: game.away_team_id,
      start_time: game.start_time,
      status: game.status,
      league: game.league?.name || '',
    };
    
    // Create prediction data with proper handling of API response format
    const predictionData: GamePredictionData = {
      ...createDefaultPredictionData(),
      date: astroData.date || new Date().toISOString(),
      queryTime: astroData.queryTime || new Date().toISOString(),
      observer: {
        latitude: astroData.observer?.latitude || 0,
        longitude: astroData.observer?.longitude || 0,
        timezone: astroData.observer?.timezone || 'UTC',
        altitude: 0, // astroData.observer from useAstroData does not provide altitude
      },
      // Handle sun data from different sources
      sun: (() => {
        const sunData = astroData.planets?.sun;
        if (!sunData) return createDefaultCelestialBody('Sun');
        return {
          name: 'Sun',
          sign: (sunData.sign || 'Aries') as ZodiacSign,
          longitude: sunData.longitude || 0,
          latitude: 0,
          distance: 1,
          speed: 0,
          degree: sunData.degree || 0,
          minute: 0,
          house: 1,
          retrograde: Boolean(sunData.retrograde),
          declination: 0,
          rightAscension: 0,
          phase: 0,
          phaseValue: 0,
          phase_name: `Sun in ${sunData.sign}`,
          magnitude: 0,
          illumination: 1,
          dignity: {
            score: 0,
            status: {
              ruler: false,
              exaltation: false,
              detriment: false,
              fall: false,
              triplicity: false,
              term: false,
              face: false,
            },
            essentialScore: 0,
            accidentalScore: 0,
            mutualReception: [],
          }
        };
      })(),
      // Handle moon data from different sources
      moon: (() => {
        const moonData = astroData.planets?.moon;
        if (!moonData) return createDefaultCelestialBody('Moon');
        return {
          name: 'Moon',
          sign: (moonData.sign || 'Aries') as ZodiacSign,
          longitude: moonData.longitude || 0,
          latitude: 0,
          distance: 1,
          speed: 0,
          degree: moonData.degree || 0,
          minute: 0,
          house: 1,
          retrograde: Boolean(moonData.retrograde),
          declination: 0,
          rightAscension: 0,
          phase: 0,
          phaseValue: 0,
          phase_name: astroData.moonPhase?.name || 'New Moon',
          magnitude: 0,
          illumination: astroData.moonPhase?.illumination || 0,
          dignity: {
            score: 0,
            status: {
              ruler: false,
              exaltation: false,
              detriment: false,
              fall: false,
              triplicity: false,
              term: false,
              face: false,
            },
            essentialScore: 0,
            accidentalScore: 0,
            mutualReception: [],
          }
        };
      })(),
      planets: astroData.planets || {},
      aspects: convertHookAspectsToPredictionAspects(astroData.aspects || []),
      moonPhase: {
        name: astroData.moonPhase?.name || 'New Moon',
        value: 0, // Default value if not available
        illumination: astroData.moonPhase?.illumination || 0
      },
      // Handle elements data from different API formats
      elements: (() => {
        // If we have the expected format, use it directly
        if (astroData.elements?.fire?.score !== undefined) {
          return astroData.elements;
        }
        
        // If we have percentages format, convert it
        const anyAstroData = astroData as any;
        if (anyAstroData.elements?.percentages) {
          const percentages = anyAstroData.elements.percentages;
          return {
            fire: { score: percentages.fire || 0, planets: [] },
            earth: { score: percentages.earth || 0, planets: [] },
            water: { score: percentages.water || 0, planets: [] },
            air: { score: percentages.air || 0, planets: [] }
          };
        }
        
        // If we have counts format, convert it
        if (anyAstroData.elements?.counts) {
          const counts = anyAstroData.elements.counts;
          const total = (counts.fire || 0) + (counts.earth || 0) + (counts.water || 0) + (counts.air || 0) || 1;
          return {
            fire: { score: (counts.fire || 0) / total, planets: [] },
            earth: { score: (counts.earth || 0) / total, planets: [] },
            water: { score: (counts.water || 0) / total, planets: [] },
            air: { score: (counts.air || 0) / total, planets: [] }
          };
        }
        
        // Default fallback
        return {
          fire: { score: 0.25, planets: [] },
          earth: { score: 0.25, planets: [] },
          water: { score: 0.25, planets: [] },
          air: { score: 0.25, planets: [] }
        };
      })()
    };
    
    // Ensure home_team and away_team are properly typed as Team or undefined
    const homeTeam = game.home_team as Team | undefined;
    const awayTeam = game.away_team as Team | undefined;
    
    return predictGameOutcome(simplifiedGame, homeTeam, awayTeam, predictionData);
  }, [game, astroData]);
  
  // Handle loading state
  if (loading) {
    return (
      <DashboardLayout>
        <LoadingScreen fullScreen={false} message="Loading game details..." />
      </DashboardLayout>
    );
  }
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 rounded-xl bg-slate-700" />
            <Skeleton className="h-64 rounded-xl bg-slate-700" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/"><Home className="h-3.5 w-3.5 mr-1" /> Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Game Details</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          
          <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-200 mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <Card className="bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-4">
                <Info className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-200 mb-2">Unable to load game details</h2>
              <p className="text-slate-400 mb-6">We couldn't load the game details you're looking for.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline" className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
                  Try Again
                </Button>
                <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild><Link to="/dashboard">
                  Return to Dashboard
                </Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  // Handle not found state
  if (!game) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/"><Home className="h-3.5 w-3.5 mr-1" /> Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Game Not Found</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Card className="bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold text-slate-200 mb-2">Game Not Found</h2>
              <p className="text-slate-400 mb-6">The game you're looking for could not be found.</p>
              <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild><Link to="/dashboard">
                Return to Dashboard
              </Link></Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  // Sort players by impact score to get top players
  const getTopPlayers = (roster: PlayerDisplayData[], count: number = 3) => {
    return roster
      .filter(player => player.impactScore !== undefined)
      .sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))
      .slice(0, count);
  };

  const topHomePlayers = getTopPlayers(homeTeamRoster);
  const topAwayPlayers = getTopPlayers(awayTeamRoster);

  // Main render
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 min-h-screen">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/"><Home className="h-3.5 w-3.5 mr-1" /> Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Game Details</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Team Info and Top Players Section */}
        {game && game.home_team && game.away_team && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            {/* Home Team Column */}
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-16 w-16">
                  {game.home_team.logo_url ? <AvatarImage src={game.home_team.logo_url} alt={`${game.home_team.name} logo`} /> : null}
                  <AvatarFallback>{game.home_team?.name?.substring(0,2).toUpperCase() || 'HT'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {game.home_team ? (
                      <Link to={`/teams/${game.home_team.id}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm">
                        {game.home_team.name}
                      </Link>
                    ) : (
                      <Skeleton className="h-8 w-32" />
                    )}
                  </CardTitle>
                  <CardDescription>Home Team</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-lg font-semibold mb-2">Top Players (Impact Score):</h4>
                {topHomePlayers.length > 0 ? (
                  <ul className="space-y-1">
                    {topHomePlayers.map(player => (
                      <li key={player.id} className="flex justify-between">
                        <span>{player.name}</span>
                        <span className="font-semibold">{player.impactScore?.toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No player impact data available.</p>
                )}
              </CardContent>
            </Card>

            {/* Away Team Column */}
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-16 w-16">
                  {game.away_team.logo_url ? <AvatarImage src={game.away_team.logo_url} alt={`${game.away_team.name} logo`} /> : null}
                  <AvatarFallback>{game.away_team?.name?.substring(0,2).toUpperCase() || 'AT'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {game.away_team ? (
                      <Link to={`/teams/${game.away_team.id}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm">
                        {game.away_team.name}
                      </Link>
                    ) : (
                      <Skeleton className="h-8 w-32" />
                    )}
                  </CardTitle>
                  <CardDescription>Away Team</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-lg font-semibold mb-2">Top Players (Impact Score):</h4>
                {topAwayPlayers.length > 0 ? (
                  <ul className="space-y-1">
                    {topAwayPlayers.map(player => (
                      <li key={player.id} className="flex justify-between">
                        <span>{player.name}</span>
                        <span className="font-semibold">{player.impactScore?.toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No player impact data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Venue Information */}
        {game && game.home_team && (
          <div className="my-8">
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  {/* Venue Image/Map Section */}
                  <div className="bg-slate-200 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-800/50"></div>
                    <div className="relative z-10 text-center p-4">
                      <h3 className="text-white text-2xl font-bold drop-shadow-md">
                        {game.home_team?.venue_name || 'Stadium'}
                      </h3>
                      <p className="text-white/90 text-sm mt-1 drop-shadow-md">
                        {game.home_team?.venue_city || 'Location'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Game Details Section */}
                  <div className="p-6 flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Game Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-medium">Date:</span>
                        <span className="text-slate-800">
                          {game.start_time
                            ? new Date(game.start_time).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })
                            : 'TBD'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-medium">Time:</span>
                        <span className="text-slate-800">
                          {game.start_time
                            ? new Date(game.start_time).toLocaleTimeString(undefined, {
                                hour: '2-digit', minute: '2-digit'
                              })
                            : 'TBD'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-medium">Status:</span>
                        <span className="text-slate-800">{game.status || 'Scheduled'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-medium">League:</span>
                        <span className="text-slate-800">{game.league?.name || 'MLB'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Astrological Prediction */}
                  <div className="p-6 bg-indigo-50 border-l border-indigo-100">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-indigo-800">Astrological Prediction</h3>
                    {astroLoading ? (
                      <div className="flex flex-col items-center justify-center h-24">
                        <Skeleton className="h-8 w-8 rounded-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-1" />
                      </div>
                    ) : astroData && gamePrediction ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-indigo-700 font-medium">Prediction:</span>
                          <span className="text-indigo-900 font-semibold">{gamePrediction.prediction}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700 font-medium">Moon Phase:</span>
                          <span className="text-indigo-900">{astroData.moonPhase?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700 font-medium">Confidence:</span>
                          <span className="text-indigo-900 font-semibold">{`${Math.round(gamePrediction.confidence * 100)}%`}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-600">No astrological data available.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Game Info and Team Matchup Section */} 
        {game && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            {/* Home Team Card */} 
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {game.home_team?.logo_url ? <AvatarImage src={game.home_team.logo_url} alt={`${game.home_team.name} logo`} /> : null}
                    <AvatarFallback>{game.home_team?.name?.substring(0,2).toUpperCase() || 'HT'}</AvatarFallback>
                  </Avatar>
                  <CardTitle>
                    {game.home_team ? (
                      <Link to={`/teams/${game.home_team.id}`} className="hover:underline">
                        {game.home_team.name}
                      </Link>
                    ) : 'Home Team'}
                  </CardTitle>
                </div>
                <CardDescription>Home Team</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-base font-semibold mb-3 pb-1 border-b">Top Players</h4>
                {topHomePlayers.length > 0 ? (
                  <div className="space-y-3">
                    {topHomePlayers.map(player => (
                      <Link to={`/players/${player.id}`} key={player.id} className="block">
                        <div className="flex items-center hover:bg-slate-50 p-2 rounded-md transition-colors">
                          <Avatar className="h-8 w-8 mr-3">
                            {player.headshot_url ? <AvatarImage src={player.headshot_url} alt={player.name} /> : null}
                            <AvatarFallback>{player.name?.substring(0,2).toUpperCase() || 'P'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.position || 'N/A'}</div>
                          </div>
                          <div className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {player.impactScore?.toFixed(0) || 'N/A'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No player impact data available.</p>
                )}
              </CardContent>
            </Card>

            {/* Away Team Card */} 
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {game.away_team?.logo_url ? <AvatarImage src={game.away_team.logo_url} alt={`${game.away_team.name} logo`} /> : null}
                    <AvatarFallback>{game.away_team?.name?.substring(0,2).toUpperCase() || 'AT'}</AvatarFallback>
                  </Avatar>
                  <CardTitle>
                    {game.away_team ? (
                      <Link to={`/teams/${game.away_team.id}`} className="hover:underline">
                        {game.away_team.name}
                      </Link>
                    ) : 'Away Team'}
                  </CardTitle>
                </div>
                <CardDescription>Away Team</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-base font-semibold mb-3 pb-1 border-b">Top Players</h4>
                {topAwayPlayers.length > 0 ? (
                  <div className="space-y-3">
                    {topAwayPlayers.map(player => (
                      <Link to={`/players/${player.id}`} key={player.id} className="block">
                        <div className="flex items-center hover:bg-slate-50 p-2 rounded-md transition-colors">
                          <Avatar className="h-8 w-8 mr-3">
                            {player.headshot_url ? <AvatarImage src={player.headshot_url} alt={player.name} /> : null}
                            <AvatarFallback>{player.name?.substring(0,2).toUpperCase() || 'P'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.position || 'N/A'}</div>
                          </div>
                          <div className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {player.impactScore?.toFixed(0) || 'N/A'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No player impact data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-start items-center my-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Type for aspects as returned by useAstroData hook
interface HookTransformedAspect {
  planets: (GlobalCelestialBody & { interpretation?: string })[]; 
  type: string; 
  angle: number;
  orb: number;
  influence: string; 
  applying: boolean;
  interpretation?: string;
  [key: string]: any; // Allow other properties that might come from the hook
}

// Helper function to convert aspects from useAstroData format to GamePredictionData format
const convertHookAspectsToPredictionAspects = (hookAspects: HookTransformedAspect[]): Aspect[] => {
  return hookAspects.map(hookAspect => {
    let fromPlanet = 'Unknown';
    let toPlanet = 'Unknown';

    if (hookAspect.planets && hookAspect.planets.length >= 1) {
      fromPlanet = hookAspect.planets[0].name;
      if (hookAspect.planets.length >= 2) {
        toPlanet = hookAspect.planets[1].name;
      } else {
        // Handle aspects to points like Ascendant if planets array has only one item
        // For now, if only one planet, maybe it's an aspect to a house cusp or similar?
        // Or it's an error in data. For safety, mark 'to' as unknown or specific point if identifiable.
        toPlanet = 'Point'; // Placeholder, adjust if more context is available
      }
    }
    
    // Ensure the aspect type from the hook is a valid AspectType
    const aspectType = hookAspect.type.toLowerCase() as AspectType;
    const validAspectTypes: AspectType[] = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
    if (!validAspectTypes.includes(aspectType)) {
        // console.warn(`Invalid aspect type received: ${hookAspect.type}`);
        // Skip this aspect or handle as a generic aspect if necessary
        // For now, we'll create it but type safety might be an issue if not a valid AspectType
    }

    return {
      from: fromPlanet,
      to: toPlanet,
      type: aspectType,
      orb: hookAspect.orb,
      influence: {
        description: hookAspect.influence, // This is a string from the hook
        strength: 0.5, // Default strength, can be refined based on orb or type
        area: [],      // Default area
      },
      exact: Math.abs(hookAspect.orb) < 1, // A common definition for 'exact'
      // 'applying' property from hookAspect can also be used for 'exact' or a new field if needed
    };
  }).filter(aspect => aspect.from !== 'Unknown' && aspect.to !== 'Unknown'); // Filter out aspects where planets couldn't be determined
};

export default GameDetails;

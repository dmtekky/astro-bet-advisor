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
  
  const [game, setGame] = useState<DetailedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeTeamRoster, setHomeTeamRoster] = useState<PlayerDisplayData[]>([]);
  const [awayTeamRoster, setAwayTeamRoster] = useState<PlayerDisplayData[]>([]);
  const [homePlayerStats, setHomePlayerStats] = useState<Record<string, PlayerSeasonStats>>({}); 
  const [awayPlayerStats, setAwayPlayerStats] = useState<Record<string, PlayerSeasonStats>>({}); 
  const [rostersLoading, setRostersLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null); // For new data fetching errors

  const TARGET_SEASON = 2025;
  
  // Fetch game data
  useEffect(() => {
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
          .eq('id', gameId)
          .single();
          
        if (error) throw error;
        
        setGame(data as unknown as DetailedGame);
      } catch (err: any) {
        console.error('Error fetching game details:', err);
        setError(err.message || 'Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId]);

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
          supabase.from('players').select('*').eq('team_id', game.home_team_id),
          supabase.from('players').select('*').eq('team_id', game.away_team_id),
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
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Skeleton className="h-5 w-16 bg-slate-700" />
            <Skeleton className="h-5 w-5 bg-slate-700 rounded-full" />
            <Skeleton className="h-5 w-24 bg-slate-700" />
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
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

        {/* Game Header with Teams */}
        {game && game.home_team && game.away_team && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
            <div className="flex flex-col items-center">
              {/* Teams Row */}
              <div className="flex items-center justify-between w-full max-w-4xl">
                {/* Home Team */}
                <div className="flex flex-col items-center text-center w-1/3">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3">
                    {game.home_team.logo_url || game.home_team.logo ? (
                      <img 
                        src={game.home_team.logo_url || game.home_team.logo} 
                        alt={`${game.home_team.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-400">
                          {game.home_team.abbreviation || game.home_team.name?.substring(0,2).toUpperCase() || 'HT'}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold" style={{ color: game.home_team.primary_color }}>
                    {game.home_team.name}
                  </h2>
                  {game.home_team.record && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {game.home_team.record}
                    </p>
                  )}
                </div>

                {/* VS Badge */}
                <div className="flex flex-col items-center justify-center px-4">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-xs font-medium px-3 py-1 rounded-full mb-2">
                    {game.status || 'SCHEDULED'}
                  </div>
                  <div className="text-4xl font-extrabold text-slate-700 dark:text-slate-200">
                    VS
                  </div>
                  {game.start_time && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {new Date(game.start_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center text-center w-1/3">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3">
                    {game.away_team.logo_url || game.away_team.logo ? (
                      <img 
                        src={game.away_team.logo_url || game.away_team.logo} 
                        alt={`${game.away_team.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-400">
                          {game.away_team.abbreviation || game.away_team.name?.substring(0,2).toUpperCase() || 'AT'}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold" style={{ color: game.away_team.primary_color }}>
                    {game.away_team.name}
                  </h2>
                  {game.away_team.record && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {game.away_team.record}
                    </p>
                  )}
                </div>
              </div>

              {/* Venue and Time */}
              {game.venue?.name && (
                <div className="mt-6 text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {game.venue.name}
                    {game.venue.city && ` • ${game.venue.city}${game.venue.state ? `, ${game.venue.state}` : ''}`}
                  </p>
                  {game.venue.capacity && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Capacity: {game.venue.capacity.toLocaleString()}
                      {game.venue.surface && ` • ${game.venue.surface}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Impact Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Player Impact</CardTitle>
                <CardDescription>Top performers from both teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...(topHomePlayers.slice(0,3)), ...(topAwayPlayers.slice(0,3))].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...(topHomePlayers.slice(0,3)), ...(topAwayPlayers.slice(0,3))].map((player) => (
                        <div key={player.id} className="flex items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="relative w-12 h-12 flex-shrink-0 mr-3">
                            {player.image ? (
                              <img 
                                src={player.image} 
                                alt={player.name}
                                className="w-full h-full rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="text-sm font-medium text-slate-400">
                                  {player.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {player.impactScore?.toFixed(0) || '--'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate">{player.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {player.position || 'Player'}
                              {player.team_id && teamMap[player.team_id]?.abbreviation && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {teamMap[player.team_id].abbreviation}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No player impact data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Details Card */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Game Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Venue</h4>
                      <p className="text-sm">
                        {game?.venue?.name || 'TBD'}
                      </p>
                      {game?.venue?.city && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {game.venue.city}{game.venue.state ? `, ${game.venue.state}` : ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date & Time</h4>
                      <p className="text-sm">
                        {game?.start_time ? (
                          new Date(game.start_time).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : 'TBD'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {game?.status || 'Scheduled'}
                      </p>
                    </div>
                    {game?.venue?.surface && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Surface</h4>
                        <p className="text-sm">{game.venue.surface}</p>
                      </div>
                    )}
                    {game?.venue?.capacity && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Capacity</h4>
                        <p className="text-sm">{game.venue.capacity.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather Card */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Weather Forecast</CardTitle>
                <CardDescription>Game day conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-4xl font-light text-blue-500 mr-4">72°</div>
                  <div>
                    <div className="font-medium">Sunny</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Feels like 75°</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Wind: 5 mph • Humidity: 45%
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                  Weather data will be available closer to game time.
                </div>
              </CardContent>
            </Card>

            {/* Astrological Insights */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Astrological Insights</CardTitle>
                <CardDescription>Cosmic influences</CardDescription>
              </CardHeader>
              <CardContent>
                {astroLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : astroData && gamePrediction ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">Game Prediction</div>
                      <div className="text-lg font-semibold">{gamePrediction.prediction}</div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-300">Confidence</span>
                          <span className="font-medium">{Math.round(gamePrediction.confidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full" 
                            style={{ width: `${Math.round(gamePrediction.confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Moon Phase</h4>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center mr-2">
                            <div 
                              className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600"
                              style={{
                                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)',
                                background: `radial-gradient(circle at 50% 50%, transparent 50%, transparent ${50 - (astroData.moonPhase?.illumination || 0) * 50}%, var(--tw-bg-opacity) ${50 - (astroData.moonPhase?.illumination || 0) * 50}%)`,
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{astroData.moonPhase?.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {Math.round((astroData.moonPhase?.illumination || 0) * 100)}% illuminated
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sun Sign</h4>
                        <div className="text-sm">
                          {astroData.planets?.sun?.sign || 'Unknown'}
                        </div>
                      </div>

                      {astroData.dominantElement && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Dominant Element</h4>
                          <div className="text-sm capitalize">
                            {astroData.dominantElement.toLowerCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No astrological data available
                  </div>
                )}
                <div className="mt-4 text-xs text-slate-400 dark:text-slate-500 italic">
                  Astrological insights are for entertainment purposes only.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Game Info and Astro Prediction Section */} 
        {game && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            {/* Game Information Card */} 
            <Card>
              <CardHeader>
                <CardTitle>Game Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4 items-center">
                  <div className="text-center flex-1">
                    <h3 className="font-semibold">
                      {game.home_team ? (
                        <Link to={`/teams/${game.home_team.id}`} className="hover:underline">
                          {game.home_team.name}
                        </Link>
                      ) : 'Home Team'}
                    </h3>
                  </div>
                  <div className="text-center px-2 text-muted-foreground">vs</div>
                  <div className="text-center flex-1">
                    <h3 className="font-semibold">
                      {game.away_team ? (
                        <Link to={`/teams/${game.away_team.id}`} className="hover:underline">
                          {game.away_team.name}
                        </Link>
                      ) : 'Away Team'}
                    </h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-2">
                  <strong>Status:</strong> {game.status || 'N/A'}
                </p>
                <p className="text-muted-foreground text-sm mb-2">
                  <strong>Start Time:</strong>{' '}
                  {game.start_time
                    ? new Date(game.start_time).toLocaleString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'N/A'}
                </p>
                <p className="text-muted-foreground text-sm mb-2">
                  <strong>League:</strong> {game.league?.name || 'N/A'}
                </p>
                <p className="text-muted-foreground text-sm">
                  <strong>Venue:</strong> {game.venue?.name || 'N/A'}
                </p>
              </CardContent>
            </Card>

            {/* Astrological Prediction Card */} 
            <Card>
              <CardHeader>
                <CardTitle>Astrological Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                {astroLoading ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Skeleton className="h-12 w-12 rounded-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : astroData && gamePrediction ? (
                  <div>
                    <p className="mb-3">
                      <strong>Prediction:</strong> {gamePrediction.prediction}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Moon Phase:</strong> {astroData.moonPhase?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Sun Sign:</strong> {astroData.planets?.sun?.sign || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Confidence:</strong> {`${Math.round(gamePrediction.confidence * 100)}%`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No astrological data or prediction available.</p>
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

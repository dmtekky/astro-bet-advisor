import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Sport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { fetchGamesFromOddsAPI, fetchStandings } from '@/services/sportsDataService';
import { getTeamLogo } from '@/utils/teamUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { GamesSectionSkeleton } from '@/components/ui/skeletons/GameCardSkeleton';
import { TeamsSectionSkeleton } from '@/components/ui/skeletons/TeamCardSkeleton';
import type { Team } from '@/types/supabase';

interface UIGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  odds?: {
    home: number;
    away: number;
    draw?: number;
  };
}

const LeaguePage: React.FC = () => {
  const { leagueId: leagueIdParam } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  
  // Carousel settings for the games slider
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };
  
  // Define valid league IDs
  const validLeagueIds: Sport[] = ['nba', 'mlb', 'nfl', 'nhl', 'soccer', 'tennis', 'mma', 'ncaa', 'ncaab', 'ncaaf', 'golf', 'esports', 'cfl', 'boxing'];
  
  // Ensure leagueId is a valid Sport type or default to 'nba'
  const leagueId: Sport = validLeagueIds.includes(leagueIdParam as Sport) 
    ? (leagueIdParam as Sport) 
    : 'nba';
    
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<UIGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [astrologyData] = useState<string>('Loading astrological data...');
  const [astroOutlook] = useState<string>('Loading astrological outlook...');
  const [retryCount, setRetryCount] = useState(0);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!leagueId) {
        setError('Invalid league ID');
        setLoading(false);
        return;
      }

      // Fetch teams and games in parallel
      const [teamsData, gamesData] = await Promise.all([
        fetchStandings(leagueId as Sport),
        fetchGamesFromOddsAPI(leagueId as Sport)
      ]);
      
      setTeams(teamsData);
      
      // Map games to UI format
      const formattedGames: UIGame[] = gamesData.map((game: any) => {
        // Find the best odds from all bookmakers
        const bestOdds = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h')?.outcomes || [];
        
        return {
          id: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeTeamId: game.home_team_id || '',
          awayTeamId: game.away_team_id || '',
          gameTime: new Date(game.commence_time).toLocaleString(),
          status: 'scheduled',
          odds: {
            home: bestOdds.find((o: any) => o.name === game.home_team)?.price,
            away: bestOdds.find((o: any) => o.name === game.away_team)?.price,
            draw: bestOdds.find((o: any) => o.name === 'Draw')?.price
          }
        };
      });
      
      setGames(formattedGames);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load league data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handlers for navigation
  const handleTeamClick = React.useCallback((teamId: string) => {
    navigate(`/team/${teamId}`);
  }, [navigate]);

  const handleGameClick = React.useCallback((gameId: string) => {
    navigate(`/game/${gameId}`);
  }, [navigate]);

  const LEAGUE_NAMES: Record<Sport, string> = {
    nba: 'NBA',
    mlb: 'MLB',
    nfl: 'NFL',
    nhl: 'NHL',
    soccer: 'Soccer',
    tennis: 'Tennis',
    mma: 'MMA',
    ncaa: 'NCAA',
    ncaab: 'NCAA Basketball',
    ncaaf: 'NCAA Football',
    golf: 'Golf',
    esports: 'eSports',
    cfl: 'CFL',
    boxing: 'Boxing'
  } as const;

  const LEAGUE_EMOJIS: Record<Sport, string> = {
    nba: '🏀',
    mlb: '⚾',
    nfl: '🏈',
    nhl: '🏒',
    soccer: '⚽',
    tennis: '🎾',
    mma: '🥋',
    ncaa: '🏈',
    ncaab: '🏀',
    ncaaf: '🏈',
    golf: '⛳',
    esports: '🎮',
    cfl: '🏈',
    boxing: '🥊'
  } as const;

  // Show full page skeleton only on initial load
  if (loading && (!teams.length || !games.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8">
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <Skeleton className="h-12 w-12 rounded-full mr-4" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <GamesSectionSkeleton />
          </div>
          
          <div>
            <Skeleton className="h-8 w-48 mb-6" />
            <TeamsSectionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <div className="flex flex-col space-y-4">
              <AlertDescription>{error}</AlertDescription>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="w-fit"
              >
                Retry
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (leagueId && ['soccer', 'ncaa'].includes(leagueId)) {
    const launchDate = new Date('2025-06-01');
    const today = new Date();
    const daysLeft = Math.ceil((launchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const sortedTeams = [...teams].sort((a, b) => {
      const aWinPct = a.win_percentage ?? 0;
      const bWinPct = b.win_percentage ?? 0;
      return bWinPct - aWinPct;
    });

    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* League Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {LEAGUE_EMOJIS[leagueId as Sport] || '🏆'} {LEAGUE_NAMES[leagueId as Sport] || 'League'}
            </h1>
            <p className="text-gray-600">Astrological insights for {LEAGUE_NAMES[leagueId as Sport] || 'this league'}</p>
          </div>
          <div className="text-5xl font-bold text-yellow-400 mb-8">
            {daysLeft} Days Until Launch
          </div>
          <p className="text-gray-400">Check back on June 1, 2025</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* League Header */}
        <div className="flex items-center mb-8">
          <span className="text-4xl mr-4">{LEAGUE_EMOJIS[leagueId as Sport] || '🏆'}</span>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {LEAGUE_NAMES[leagueId as Sport] || 'League'} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Latest odds and astrological insights for {LEAGUE_NAMES[leagueId as Sport] || 'the league'}
            </p>
          </div>
        </div>

        {/* Games Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Upcoming Games</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All Games →
            </button>
          </div>
          {loading ? (
            <GamesSectionSkeleton />
          ) : games.length > 0 ? (
            <Slider {...carouselSettings}>
              {games.map((game) => (
                <div key={game.id} className="px-2">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-colors">
                    <div className="text-center mb-2">
                      <div className="text-sm text-muted-foreground">
                        {game.gameTime}
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {game.homeTeam} vs {game.awayTeam}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Astro Score:</span>{' '}
                        <span className="font-medium">
                          N/A
                        </span>
                      </div>
                      <Link 
                        to={`/game/${game.id}`}
                        className="text-sm text-blue-500 hover:underline flex items-center"
                      >
                        View Details <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Astro Score</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          N/A
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Odds</div>
                        <div className={`text-lg font-bold text-red-500`}>
                          N/A
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/game/${game.id}`}
                      className="mt-4 block w-full text-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2 px-4 rounded-md transition-colors"
                    >
                      View Matchup Details
                    </Link>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="text-center py-8 bg-gray-900/50 rounded-lg border border-dashed border-gray-800">
              <p className="text-muted-foreground">No upcoming games scheduled</p>
            </div>
          )}
        </div>

        {/* Astrology Insights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Astrological Outlook</h2>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            {loading ? (
              <div className="text-muted-foreground">Loading astrological data...</div>
            ) : astroOutlook ? (
              <div>
                <p className="mb-4 text-foreground">{astroOutlook}</p>
                <div className="mt-4 p-4 bg-yellow-900/20 border-l-4 border-yellow-400/80">
                  <p className="text-yellow-400">
                    <span className="font-semibold">Astro Tip:</span> {astrologyData}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No astrological data available</p>
            )}
          </div>
        </div>

        {/* Teams Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Teams in {leagueId ? LEAGUE_NAMES[leagueId] : 'League'}
            </h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All Teams →
            </button>
          </div>
          {loading ? (
            <TeamsSectionSkeleton />
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teams.map((team) => (
                <Link 
                  key={team.id} 
                  to={`/team/${team.id}`}
                  className="block hover:opacity-90 transition-opacity group"
                >
                  <Card className="h-full bg-gray-900/50 border border-gray-800 hover:border-blue-500/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {team.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Record:</span>
                        <span className="font-medium text-foreground">{team.wins || 0}-{team.losses || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Win %:</span>
                        <span className="font-medium text-foreground">
                          {typeof team.win_percentage === 'number' 
                            ? (team.win_percentage * 100).toFixed(1) + '%' 
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground group-hover:text-blue-400 transition-colors">View Team</span>
                          <span className="text-blue-500 opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all">→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-900/50 rounded-lg border border-dashed border-gray-800">
              <p className="text-muted-foreground">No teams found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;

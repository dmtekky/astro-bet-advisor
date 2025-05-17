import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sport } from '@/types';
import Slider from 'react-slick';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, Info, ArrowRight } from 'lucide-react';
import { getMockEvents } from '@/mocks/mockEvents';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  win_pct: number;
}

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  odds?: number;
  oas?: number;
}

const LeaguePage: React.FC = () => {
  const { leagueId: leagueIdParam } = useParams<{ leagueId: string }>();
  // Ensure leagueId is a valid Sport type or default to 'nba'
  const leagueId = (['nba', 'mlb', 'nfl', 'boxing', 'soccer', 'ncaa'].includes(leagueIdParam || '') 
    ? leagueIdParam 
    : 'nba') as Sport;
    
  const [teams, setTeams] = useState<Team[]>([]);
  // Define a custom game type for the UI
  interface UIGame {
    id: string;
    sport: Sport;
    home_team: string;
    away_team: string;
    commence_time: string;
    oas?: number;
    odds?: number;
    home_team_id: string;
    away_team_id: string;
    start_time: string;
    status: string;
  }

  const [upcomingGames, setUpcomingGames] = useState<UIGame[]>([]);
  const [astrologyData] = useState<string>('Astrological conditions are favorable for high-scoring games today with strong offensive performances likely.');
  const [astroOutlook] = useState<string>('The Moon in Aries brings high energy and competitive spirit. Mars trine Jupiter enhances physical performance and endurance.');
  const [loading, setLoading] = useState(false);

  const LEAGUE_NAMES: Record<string, string> = {
    nba: 'NBA',
    mlb: 'MLB',
    nfl: 'NFL',
    boxing: 'Boxing',
    soccer: 'Soccer',
    ncaa: 'NCAA Football'
  };

  const LEAGUE_ICONS: Record<string, string> = {
    nba: '🏀',
    mlb: '⚾',
    nfl: '🏈',
    boxing: '🥊',
    soccer: '⚽',
    ncaa: '🏈'
  };

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      
      try {
        // Generate mock teams based on the league
        const mockTeams = Array.from({ length: 8 }, (_, i) => ({
          id: `${leagueId}-team-${i + 1}`,
          name: `${leagueId.toUpperCase()} Team ${String.fromCharCode(65 + i)}`,
          abbreviation: `${leagueId.toUpperCase().slice(0, 3)}${i + 1}`,
          sport: leagueId,
          wins: Math.floor(Math.random() * 30) + 10,
          losses: Math.floor(Math.random() * 20) + 5,
          win_pct: parseFloat((Math.random() * 0.5 + 0.3).toFixed(3)), // Between 0.3 and 0.8
        }));
        
        // Get mock games for the current league
        const mockGames = getMockEvents(leagueId);
        
        // Map mock games to our UI game type
        const formattedGames: UIGame[] = mockGames.map(game => ({
          id: game.id,
          sport: game.sport,
          home_team_id: game.home_team_id,
          away_team_id: game.away_team_id,
          start_time: game.start_time,
          status: 'scheduled',
          home_team: game.home_team,
          away_team: game.away_team,
          commence_time: game.commence_time || game.start_time,
          oas: game.oas,
          odds: game.odds
        }));
        
        setTeams(mockTeams);
        setUpcomingGames(formattedGames);
      } catch (error) {
        console.error('Error loading mock data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [leagueId]);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="animate-pulse">Loading {LEAGUE_NAMES[leagueId || 'nba']} data...</div>
    </div>;
  }

  if (['soccer', 'ncaa'].includes(leagueId || '')) {
    const launchDate = new Date('2025-06-01');
    const today = new Date();
    const daysLeft = Math.ceil((launchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const sortedTeams = [...teams].sort((a, b) => (b.win_pct || 0) - (a.win_pct || 0));

    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* League Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {LEAGUE_ICONS[leagueId] || '🏆'} {LEAGUE_NAMES[leagueId] || 'League'}
            </h1>
            <p className="text-gray-600">Astrological insights for {LEAGUE_NAMES[leagueId] || 'this league'}</p>
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
          <span className="text-4xl mr-4">{LEAGUE_ICONS[leagueId] || '🏆'}</span>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {LEAGUE_NAMES[leagueId] || 'League'} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Latest odds and astrological insights for {LEAGUE_NAMES[leagueId] || 'the league'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg bg-gray-800/50" />
              ))}
            </div>
          ) : upcomingGames.length > 0 ? (
            <Slider {...carouselSettings}>
              {upcomingGames.map((game) => (
                <div key={game.id} className="px-2">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-colors">
                    <div className="text-center mb-2">
                      <div className="text-sm text-muted-foreground">
                        {game.commence_time ? (
                          <>
                            {new Date(game.commence_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' at '}
                            {new Date(game.commence_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        ) : 'TBD'}
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {game.home_team} vs {game.away_team}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Astro Score:</span>{' '}
                        <span className="font-medium">
                          {game.oas ? `${game.oas.toFixed(1)}/10` : 'N/A'}
                        </span>
                      </div>
                      <Link 
                        to={`/event/${game.id}`}
                        className="text-sm text-blue-500 hover:underline flex items-center"
                      >
                        View Details <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Astro Score</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {game.oas ? game.oas.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Odds</div>
                        <div className={`text-lg font-bold ${
                          game.odds && game.odds > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {game.odds ? (game.odds > 0 ? `+${game.odds}` : game.odds) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/event/${game.id}`}
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
            <h2 className="text-2xl font-bold text-foreground">Teams in {LEAGUE_NAMES[leagueId] || 'League'}</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All Teams →
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg bg-gray-800/50" />
              ))}
            </div>
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
                          {team.win_pct ? (team.win_pct * 100).toFixed(1) + '%' : 'N/A'}
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

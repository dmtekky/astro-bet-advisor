import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchOdds } from '@/lib/oddsApi';
import Slider from 'react-slick';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const { leagueId } = useParams<{ leagueId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [astrologyData, setAstrologyData] = useState<string>('');
  const [astroOutlook, setAstroOutlook] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
    const fetchData = async () => {
      // Fetch latest astrological data for outlook
      try {
        const { fetchLatestAstrologicalData } = await import('@/lib/supabase');
        const astro = await fetchLatestAstrologicalData();
        if (astro) {
          // Simple outlook logic (customize as needed)
          let outlook = '';
          if (astro.moon_sign) outlook += `Moon in ${astro.moon_sign}. `;
          if (astro.mercury_retrograde) outlook += 'Mercury is retrograde. '; 
          if (astro.sun_mars_transit) outlook += `Sun-Mars Transit: ${astro.sun_mars_transit}. `;
          setAstroOutlook(outlook.trim());
        }
      } catch (e) { setAstroOutlook(''); }
    
      try {
        setLoading(true);
        
        // Simulate fetching data for demo
        // In a real app, you would fetch from your API/Supabase
        const mockTeams = [
          { id: '1', name: 'Team A', wins: 12, losses: 3, win_pct: 0.8 },
          { id: '2', name: 'Team B', wins: 10, losses: 5, win_pct: 0.667 },
          { id: '3', name: 'Team C', wins: 9, losses: 6, win_pct: 0.6 },
          { id: '4', name: 'Team D', wins: 8, losses: 7, win_pct: 0.533 },
          { id: '5', name: 'Team E', wins: 7, losses: 8, win_pct: 0.467 },
        ];
        
        const mockGames = [
          { 
            id: '1', 
            home_team: 'Team A', 
            away_team: 'Team B', 
            commence_time: new Date(Date.now() + 86400000).toISOString(),
            odds: 150,
            oas: 7.8
          },
          { 
            id: '2', 
            home_team: 'Team C', 
            away_team: 'Team D', 
            commence_time: new Date(Date.now() + 172800000).toISOString(),
            odds: -110,
            oas: 6.2
          },
        ];
        
        const mockAstroData = "Jupiter in Cancer is creating favorable conditions for teams with strong defensive strategies this week.";
        
        setTeams(mockTeams);
        setUpcomingGames(mockGames);
        setAstrologyData(mockAstroData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* League Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {LEAGUE_ICONS[leagueId] || '🏆'} {LEAGUE_NAMES[leagueId] || 'League'}
          </h1>
          <p className="text-gray-600">Astrological insights for {LEAGUE_NAMES[leagueId] || 'this league'}</p>
        </div>

        {/* Games Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
          {loading ? (
            <div>Loading games...</div>
          ) : upcomingGames.length > 0 ? (
            <Slider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={Math.min(upcomingGames.length, 3)}
              slidesToScroll={1}
              responsive={[
                {
                  breakpoint: 1024,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                  },
                },
                {
                  breakpoint: 640,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                  },
                },
              ]}
              className="mb-8"
            >
              {upcomingGames.map((game) => (
                <div key={game.id} className="px-2">
                  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <div className="text-center mb-2">
                      <div className="text-sm text-gray-500">
                        {new Date(game.commence_time).toLocaleDateString()}
                      </div>
                      <div className="text-lg font-semibold">
                        {game.home_team} vs {game.away_team}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm">
                        <div className="font-medium">Astro Score:</div>
                        <div className="text-2xl font-bold text-yellow-500">
                          {game.oas ? game.oas.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Odds:</div>
                        <div className="text-lg font-bold">
                          {game.odds ? `+${game.odds}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/event/${game.id}`}
                      className="mt-4 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No upcoming games scheduled</p>
            </div>
          )}
        </div>

        {/* Astrology Insights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Astrological Outlook</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            {loading ? (
              <div>Loading astrological data...</div>
            ) : astroOutlook ? (
              <div>
                <p className="mb-4">{astroOutlook}</p>
                <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                  <p className="text-yellow-700">
                    <span className="font-semibold">Astro Tip:</span> {astrologyData}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No astrological data available</p>
            )}
          </div>
        </div>

        {/* Teams Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Teams in {LEAGUE_NAMES[leagueId] || 'League'}</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teams.map((team) => (
                <Link 
                  key={team.id} 
                  to={`/team/${team.id}`}
                  className="block hover:opacity-90 transition-opacity"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">
                        {team.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Record:</span>
                        <span className="font-medium">{team.wins || 0}-{team.losses || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Win %:</span>
                        <span className="font-medium">
                          {team.win_pct ? (team.win_pct * 100).toFixed(1) + '%' : 'N/A'}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">View Team</span>
                          <span className="text-blue-600">→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No teams found in this league</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;

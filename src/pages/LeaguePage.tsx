import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchOdds } from '@/lib/oddsApi';
import Slider from 'react-slick';
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
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 text-center">
        <div className="max-w-4xl mx-auto mt-20 p-8 bg-gray-800 rounded-xl shadow-2xl">
          <h1 className="text-4xl font-bold mb-6">
            {LEAGUE_ICONS[leagueId || '']} {LEAGUE_NAMES[leagueId || '']} Coming Soon!
          </h1>
          <p className="text-xl mb-8">We're working hard to bring you {LEAGUE_NAMES[leagueId || '']} insights.</p>
          <div className="text-5xl font-bold text-yellow-400 mb-8">
            {daysLeft} Days Until Launch
          </div>
          <p className="text-gray-400">Check back on June 1, 2025</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      {/* League Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {LEAGUE_ICONS[leagueId || '']} {LEAGUE_NAMES[leagueId || '']} Dashboard
        </h1>
        <p className="text-lg md:text-xl text-gray-300">Astrological insights and betting analysis</p>
      </div>

      {/* Astrological Outlook */}
      <section className="max-w-7xl mx-auto mb-12 p-6 bg-gray-800 bg-opacity-50 rounded-xl backdrop-blur-sm border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">✨ League Astrological Outlook</h2>
        <p className="text-lg">{astrologyData || 'Loading astrological data...'}</p>
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Standings */}
        <div className="lg:col-span-1 bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center">🏆 Standings</h2>
          <div className="space-y-4">
            {teams.map((team, index) => (
              <div key={team.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="font-bold w-6 text-center">{index + 1}</span>
                  <span>{team.name}</span>
                </div>
                <span className="font-mono">{(team.win_pct * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Games Carousel */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">📅 Upcoming Games</h2>
          <Slider {...carouselSettings} className="rounded-xl overflow-hidden">
            {upcomingGames.map((game) => (
              <div key={game.id} className="p-4">
                <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl border border-gray-700">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-400">
                      {new Date(game.commence_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center text-center">
                    <div className="text-lg font-semibold">{game.away_team}</div>
                    <div className="text-4xl py-4">vs</div>
                    <div className="text-lg font-semibold">{game.home_team}</div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Odds</div>
                      <div className="text-xl font-bold">{game.odds ? `${game.odds > 0 ? '+' : ''}${game.odds}` : 'N/A'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">OAS</div>
                      <div className="text-xl font-bold">{game.oas ? game.oas.toFixed(1) : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;

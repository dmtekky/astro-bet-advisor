import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from './GameCard';
import LoadingSpinner from './LoadingSpinner';
import SportTabs from './SportTabs';
import AstroStatus from './AstroStatus';
import NextEvent from './NextEvent';
import EventHistory from './EventHistory';
import CosmicHeadlines from './CosmicHeadlines';
import { supabase } from '../lib/supabase';
import { fetchOdds } from '../lib/oddsApi';
import { fetchPlayerProps } from '../lib/sportsGameOdds';
import { calculateOAS } from '../lib/formula.tsx';

function GamesSection() {
  const [sport, setSport] = useState('NBA');
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [astroData, setAstroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const sportKey = sport === 'NBA' ? 'basketball_nba' : 
                        sport === 'MLB' ? 'baseball_mlb' : 
                        sport === 'NFL' ? 'americanfootball_nfl' :
                        'basketball_nba'; // Default to NBA if no match
        
        // Fetch data in parallel
        const [oddsData, playersData, astro] = await Promise.all([
          fetchOdds(sportKey).catch(err => {
            console.error('Error fetching odds:', err);
            return [];
          }),
          supabase.from('players').select('*').eq('sport', sport).then(({ data }) => data || []),
          supabase.from('astrological_data').select('*').eq('date', new Date().toISOString().split('T')[0])
            .single()
            .then(({ data }) => data || {})
        ]);

        // Fetch player props if we have players
        let playerProps = {};
        if (playersData?.length > 0) {
          try {
            playerProps = await fetchPlayerProps(sport, playersData.map(p => p.id));
          } catch (err) {
            console.error('Error fetching player props:', err);
          }
        }

        // Calculate OAS for each game
        const gamesWithOAS = oddsData.map(game => ({
          ...game,
          oas: calculateOAS(game, playersData || [], astro, playerProps)
        }));

        setGames(gamesWithOAS);
        setPlayers(playersData || []);
        setAstroData(astro || {});
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sport]);

  const handleSportChange = (newSport) => {
    setSport(newSport);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <SportTabs activeSport={sport} onSportChange={handleSportChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Games */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Today's Games</h2>
            {games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No games scheduled for today</p>
              </div>
            )}
          </div>

          {/* Cosmic Headlines */}
          <CosmicHeadlines />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <NextEvent />
          <AstroStatus />
          <EventHistory />
        </div>
      </div>
    </div>
  );
}

export default GamesSection;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchOdds } from '@/lib/oddsApi';
// import { calculateATR, calculateOAS } from '@/lib/formula'; // Uncomment and use real formulas if available
import { Chart, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const placeholderLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/NBA_Boston_Celtics.svg/1200px-NBA_Boston_Celtics.svg.png';

function TeamPage() {
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [astroData, setAstroData] = useState(null);
  const [atr, setATR] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [forecast, setForecast] = useState('');
  const [forecastDate, setForecastDate] = useState('');
  const [fanPoll, setFanPoll] = useState({ yes: 0, no: 0 });
  const [fanVote, setFanVote] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch team, players, games, astro data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch team info
      const { data: teamData } = await supabase.from('teams').select('*').eq('id', teamId).single();
      setTeam(teamData);
      // Fetch players
      const { data: playerData } = await supabase.from('players').select('*').eq('team_id', teamId).limit(5);
      setPlayers(playerData || []);
      // Fetch upcoming games
      const { data: scheduleData } = await supabase.from('schedules').select('*').or(`home_team.eq.${teamId},away_team.eq.${teamId}`).order('game_date', { ascending: true }).limit(5);
      setGames(scheduleData || []);
      // Fetch astrological data (latest)
      const { data: astro } = await supabase.from('astrological_data').select('*').order('date', { ascending: false }).limit(1).single();
      setAstroData(astro);
      // Calculate ATR (mock formula for now)
      setATR(Math.floor(Math.random() * 40) + 60); // 60-100
      // Timeline mock data
      setTimelineData({
        labels: ['Apr 16', 'Apr 23', 'Apr 30', 'May 7', 'May 14'],
        datasets: [
          {
            label: 'Wins',
            data: [1, 0, 1, 1, 0],
            backgroundColor: 'rgba(34,197,94,0.7)'
          },
          {
            label: 'Losses',
            data: [0, 1, 0, 0, 1],
            backgroundColor: 'rgba(239,68,68,0.7)'
          },
          {
            label: 'Full Moon',
            data: [0, 1, 0, 0, 1],
            backgroundColor: 'rgba(168,85,247,0.3)'
          }
        ]
      });
      // Mock leaderboard
      setLeaderboard([
        { name: 'LunarLarry', correct: 12 },
        { name: 'AstroAmy', correct: 10 },
        { name: 'CelestialSam', correct: 9 },
        { name: 'MoonshotMike', correct: 8 },
        { name: 'StarrySue', correct: 7 }
      ]);
      setLoading(false);
    }
    fetchData();
  }, [teamId]);

  // Astrological Forecast (mock)
  useEffect(() => {
    if (forecastDate) {
      setForecast(`On ${forecastDate}, Venus in Gemini may boost team communication and synergy.`);
    }
  }, [forecastDate]);

  // Fan Poll voting
  const handleVote = (vote) => {
    setFanVote(vote);
    setFanPoll((prev) => vote === 'yes' ? { ...prev, yes: prev.yes + 1 } : { ...prev, no: prev.no + 1 });
    // TODO: Persist to Supabase fan_polls
  };

  if (loading) return <div className="text-center py-12 text-lg">Loading...</div>;
  if (!team) return <div className="text-center py-12 text-lg text-gray-500">No data available</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 text-white pb-16">
      {/* Banner */}
      <div className="relative h-56 md:h-72 flex items-center justify-center bg-gradient-to-r from-indigo-900 to-purple-900 shadow-xl">
        <img src={placeholderLogo} alt="Team Logo" className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center opacity-30"></div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-20">
          <div className="text-2xl md:text-3xl font-bold drop-shadow-lg">{team.name}</div>
          <div className="mt-2 text-lg md:text-xl font-medium text-indigo-100 drop-shadow">{team.name}: Favored Under a {astroData?.moon_phase || 'Mystic'} Moon</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-0 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Stats & ATR */}
        <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">Record</div>
              <div className="text-2xl font-bold">{team.wins || 42}-{team.losses || 20}</div>
            </div>
            <div>
              <div className="text-lg font-semibold">ATR</div>
              <div className="text-2xl font-bold text-green-400">{atr}</div>
              <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${atr}%` }}></div>
              </div>
            </div>
          </div>
          <div className="text-gray-300 mt-2">Recent Form: <span className="font-semibold text-white">W W L W L</span></div>
        </div>

        {/* Key Players */}
        <div className="bg-white/10 rounded-xl shadow-lg p-6">
          <div className="text-lg font-semibold mb-4">Key Players</div>
          <div className="space-y-4">
            {players.map((player) => (
              <div key={player.id} className="flex items-center space-x-4">
                <div className="bg-indigo-100 text-indigo-800 rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl">{player.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <div className="font-semibold text-white">{player.name}</div>
                  <div className="text-gray-300 text-sm">{player.birth_date} • {player.position || 'Player'}</div>
                  <div className="text-indigo-300 text-xs mt-1">{player.name.split(' ')[0]}, Capricorn: Strong leadership under Jupiter in Cancer</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Games */}
      <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
        <div className="bg-white/10 rounded-xl shadow-lg p-6">
          <div className="text-lg font-semibold mb-4">Upcoming Games</div>
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="bg-white/20 rounded-lg shadow p-4 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">vs {game.home_team === teamId ? game.away_team : game.home_team}</div>
                    <div className="text-gray-300 text-xs">{new Date(game.commence_time).toLocaleDateString()} • {new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-200 text-indigo-900 px-2 py-1 rounded-full text-xs font-bold">Odds: +120</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${atr > 70 ? 'bg-green-200 text-green-900' : atr < 50 ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'}`}>{atr > 70 ? 'Favorable Bet' : atr < 50 ? 'Risky Bet' : 'Neutral'}</span>
                  </div>
                </div>
                <div className="text-xs text-indigo-200">OAS: {Math.floor(Math.random() * 11) - 5}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Celestial Performance Timeline */}
        <div className="bg-white/10 rounded-xl shadow-lg p-6">
          <div className="text-lg font-semibold mb-4">Celestial Performance Timeline</div>
          {timelineData ? (
            <Bar data={timelineData} />
          ) : (
            <div className="text-gray-300">No data available</div>
          )}
        </div>
      </div>

      {/* Astrological Forecast, Fan Poll, Leaderboard */}
      <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-0">
        {/* Astrological Forecast */}
        <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col">
          <div className="text-lg font-semibold mb-4">Astrological Forecast</div>
          <input type="date" className="rounded px-2 py-1 text-black mb-2" value={forecastDate} onChange={e => setForecastDate(e.target.value)} />
          <div className="text-indigo-200 min-h-[48px]">{forecast}</div>
        </div>
        {/* Cosmic Fan Poll */}
        <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col">
          <div className="text-lg font-semibold mb-4">Cosmic Fan Poll</div>
          <div className="mb-2 text-indigo-200">Will the Full Moon boost the team’s defense?</div>
          <div className="flex space-x-2 mb-4">
            <button className={`flex-1 rounded py-2 font-bold ${fanVote === 'yes' ? 'bg-green-500' : 'bg-green-200 text-green-900'}`} onClick={() => handleVote('yes')}>Yes</button>
            <button className={`flex-1 rounded py-2 font-bold ${fanVote === 'no' ? 'bg-red-500' : 'bg-red-200 text-red-900'}`} onClick={() => handleVote('no')}>No</button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <div className="w-1/2 bg-green-200 h-4 rounded-full relative">
              <div className="bg-green-500 h-4 rounded-full absolute left-0 top-0" style={{ width: `${fanPoll.yes / (fanPoll.yes + fanPoll.no + 1) * 100}%` }}></div>
            </div>
            <div className="w-1/2 bg-red-200 h-4 rounded-full relative">
              <div className="bg-red-500 h-4 rounded-full absolute left-0 top-0" style={{ width: `${fanPoll.no / (fanPoll.yes + fanPoll.no + 1) * 100}%` }}></div>
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-200">Yes: {fanPoll.yes}</span>
            <span className="text-red-200">No: {fanPoll.no}</span>
          </div>
        </div>
        {/* Lunar Leaderboard */}
        <div className="bg-white/10 rounded-xl shadow-lg p-6">
          <div className="text-lg font-semibold mb-4">Lunar Leaderboard</div>
          <ol className="space-y-2">
            {leaderboard.map((fan, idx) => (
              <li key={fan.name} className="flex items-center space-x-2">
                <span className="text-xl font-bold text-indigo-300">#{idx + 1}</span>
                <span className="font-semibold text-white">{fan.name}</span>
                <span className="ml-auto text-indigo-200 text-xs">{fan.correct} correct predictions</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default TeamPage;

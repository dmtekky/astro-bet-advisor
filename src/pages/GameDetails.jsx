import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function GameDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { game } = location.state || {};

  if (!game) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No game data available</p>
      </div>
    );
  }

  const { 
    home_team, 
    away_team, 
    commence_time, 
    bookmakers, 
    oas,
    key_players = [] 
  } = game;

  const odds = bookmakers?.[0]?.markets?.[0]?.outcomes || [];
  const gameTime = new Date(commence_time).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {away_team} @ {home_team}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Game Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{gameTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Venue</p>
              <p className="font-medium">Staples Center, Los Angeles</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Odds</h3>
          <div className="space-y-3">
            {odds.map((outcome, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{outcome.name}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  outcome.price > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {outcome.price > 0 ? `+${outcome.price}` : outcome.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Astrological Analysis */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Astrological Analysis</h2>
          
          <div className="bg-indigo-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Astrological Advantage</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                oas > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {oas > 0 ? `${home_team} +${oas.toFixed(1)}` : `${away_team} ${oas.toFixed(1)}`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full ${
                  oas > 0 ? 'bg-green-500' : 'bg-red-500'
                }`} 
                style={{ width: `${Math.min(100, Math.abs(oas) * 10)}%` }}
              ></div>
            </div>
          </div>

          <h3 className="font-semibold mb-3">Key Influences</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Moon in Aries favors aggressive play styles</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✗</span>
              <span>Mercury retrograde may affect team communication</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Mars trine Jupiter increases scoring potential</span>
            </li>
          </ul>
        </div>

        {/* Key Players */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Key Players</h2>
          <div className="space-y-4">
            {key_players.length > 0 ? (
              key_players.map((player, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-100 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3">
                    {player.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-500">{player.position} • {player.team}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{player.win_shares || 'N/A'} WS</p>
                    <p className="text-xs text-gray-500">Birth: {player.birth_date || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No player data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Betting Recommendations */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Betting Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-800 mb-2">Best Bet</h3>
            <p className="text-green-700">Over {Math.round((oas + 200) / 10) * 0.5 + 200} Points</p>
            <p className="text-sm text-green-600 mt-1">High confidence (82%)</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">Value Pick</h3>
            <p className="text-blue-700">{oas > 0 ? home_team : away_team} ML</p>
            <p className="text-sm text-blue-600 mt-1">Medium confidence (68%)</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-semibold text-purple-800 mb-2">Prop to Watch</h3>
            <p className="text-purple-700">Player Points Over 25.5</p>
            <p className="text-sm text-purple-600 mt-1">Based on Mars influence</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameDetails;

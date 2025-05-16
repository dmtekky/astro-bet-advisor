import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function GameCard({ game }) {
  const navigate = useNavigate();
  
  if (!game) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Game data unavailable</p>
      </Card>
    );
  }

  const { home_team, away_team, commence_time, bookmakers, oas } = game;
  const odds = bookmakers?.[0]?.markets?.[0]?.outcomes || [];
  const gameTime = new Date(commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const gameDate = new Date(commence_time).toLocaleDateString();

  const handleCardClick = () => {
    navigate(`/event/${game.id}`, { state: { game } });
  };

  // Format OAS for display
  const formattedOas = oas?.toFixed(1) || '0.0';
  const oasValue = parseFloat(formattedOas);
  const oasPercentage = Math.min(100, Math.max(0, 50 + (oasValue * 10))); // Scale -5 to +5 to 0-100%
  
  // Determine OAS color
  let oasColor = 'bg-gray-500';
  if (oasValue > 0) {
    oasColor = oasValue > 3 ? 'bg-green-500' : 'bg-green-300';
  } else if (oasValue < 0) {
    oasColor = oasValue < -3 ? 'bg-red-500' : 'bg-red-300';
  }

  return (
    <Card 
      onClick={handleCardClick}
      className="hover:shadow-lg transition-shadow duration-300 cursor-pointer hover:border-indigo-300"
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">{gameDate} • {gameTime}</div>
          <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
            {game.sport_title || 'Game'}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">{home_team}</div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              odds[0]?.price > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {odds[0]?.price > 0 ? `+${odds[0]?.price}` : odds[0]?.price}
            </span>
          </div>
          
          <div className="text-center text-gray-500 text-sm">vs</div>
          
          <div className="flex justify-between items-center">
            <div className="font-medium">{away_team}</div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              odds[1]?.price > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {odds[1]?.price > 0 ? `+${odds[1]?.price}` : odds[1]?.price}
            </span>
          </div>
        </div>
        
        {oas !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Astro Advantage</span>
              <span className={`text-sm font-semibold ${
                oasValue > 0 ? 'text-green-600' : oasValue < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {oasValue > 0 ? '+' : ''}{formattedOas}
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">-5.0</div>
                <div className="text-xs text-gray-500">0.0</div>
                <div className="text-xs text-gray-500">+5.0</div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 mt-1">
                <div 
                  style={{ width: `${oasPercentage}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${oasColor}`}
                ></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GameCard;

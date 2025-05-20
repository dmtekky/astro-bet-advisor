import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useEffect, useState } from 'react';
import { fetchLatestAstrologicalData } from '@/lib/supabase';
import { calculateAIS } from '@/lib/formula';
import AstroLegend from './AstroLegend';

function GameCard({ game }) {
  const navigate = useNavigate();
  
  if (!game) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Game data unavailable</p>
      </Card>
    );
  }

  const { home_team, away_team, commence_time, bookmakers, oas: propOAS } = game;
  const [oas, setOAS] = useState(propOAS);
  const [oasLoading, setOASLoading] = useState(false);
  const [oasError, setOASError] = useState('');

  useEffect(() => {
    if (propOAS !== undefined) return;
    setOASLoading(true);
    fetchLatestAstrologicalData().then(async (astro) => {
      if (!astro) {
        setOASError('No astrological data');
        setOASLoading(false);
        return;
      }
      // Example: Use calculateAIS for home team (customize as needed)
      try {
        // You may want to fetch team/player info for a more accurate OAS
        // This is a placeholder using a mock player
        const player = { id: '1', birth_date: '1990-01-01', name: home_team, team_id: '' };
        const ephemeris = {
          date: astro.date,
          moon_phase: Number(astro.moon_phase) || 0,
          moon_sign: astro.moon_sign || '',
          mercury_sign: astro.mercury_sign || '',
          mercury_retrograde: astro.mercury_retrograde ?? false,
          venus_sign: astro.venus_sign || '',
          mars_sign: astro.mars_sign || '',
          jupiter_sign: astro.jupiter_sign || '',
          sun_sign: '',
          saturn_sign: '',
          sun_mars_aspect: 0,
          sun_saturn_aspect: 0,
          sun_jupiter_aspect: 0
        };
        const ais = await calculateAIS(player, ephemeris);
        setOAS(Number((ais.score * 10 - 5).toFixed(1))); // Example: scale to -5 to +5
      } catch (e) {
        setOASError('Astro calc error');
      }
      setOASLoading(false);
    });
  }, [propOAS, home_team]);
  const odds = bookmakers?.[0]?.markets?.[0]?.outcomes || [];
  const gameTime = new Date(commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const gameDate = new Date(commence_time).toLocaleDateString();

  const handleCardClick = () => {
    navigate(`/event/${game.id}`, { state: { game } });
  };

  // Format OAS for display
  const formattedOas = oas !== undefined ? oas?.toFixed(1) : '0.0';
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
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Astro Advantage
              <span className="relative group cursor-pointer">
                <svg width="16" height="16" fill="currentColor" className="inline ml-1 text-indigo-400"><circle cx="8" cy="8" r="8" /></svg>
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white text-gray-700 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-200">
                  Odds Adjustment Score (OAS) reflects the current astrological influence on this matchup. Higher values favor the home team; lower values favor the away team. See legend below.
                </span>
              </span>
            </span>
            {oasLoading ? (
              <span className="text-xs text-indigo-500">Calculating...</span>
            ) : oasError ? (
              <span className="text-xs text-red-500">{oasError}</span>
            ) : (
              <span className={`text-sm font-semibold ${
                oasValue > 0 ? 'text-green-600' : oasValue < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {oasValue > 0 ? '+' : ''}{formattedOas}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className={`h-2 rounded ${oasValue > 3 ? 'bg-green-500' : oasValue > 0 ? 'bg-green-300' : oasValue < -3 ? 'bg-red-500' : oasValue < 0 ? 'bg-red-300' : 'bg-gray-400'}`}
              style={{ width: `${oasPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
      <AstroLegend />
    </Card>
  );
}

export default GameCard;

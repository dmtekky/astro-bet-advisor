import React, { useEffect, useState } from 'react';
import { fetchLatestAstrologicalData, AstrologicalData } from '@/lib/supabase';
import { calculateAIS, Player } from '@/lib/formula';

interface AstroTeamSectionProps {
  teamId?: string;
}

export default function AstroTeamSection({ teamId }: AstroTeamSectionProps) {
  const [astroData, setAstroData] = useState<AstrologicalData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [atr, setATR] = useState<number | null>(null);
  const [playerAnalysis, setPlayerAnalysis] = useState<{ name: string; sign: string; summary: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const astro = await fetchLatestAstrologicalData();
      setAstroData(astro);
      // Fetch players for the team from Supabase
      // (replace with real query as needed)
      const { data: playerData } = await fetch('/api/players?teamId=' + teamId).then(res => res.json());
      setPlayers(playerData || []);
      setLoading(false);
    }
    fetchData();
  }, [teamId]);

  useEffect(() => {
    async function analyzePlayers() {
      if (!astroData || players.length === 0) return;
      let totalScore = 0;
      const analysis = await Promise.all(players.map(async (player) => {
        // Map astrological data to Ephemeris type, fill missing fields with defaults
        const ephemeris = {
          date: astroData.date,
          moon_phase: Number(astroData.moon_phase) || 0,
          moon_sign: astroData.moon_sign || '',
          mercury_sign: astroData.mercury_sign || '',
          mercury_retrograde: astroData.mercury_retrograde ?? false,
          venus_sign: astroData.venus_sign || '',
          mars_sign: astroData.mars_sign || '',
          jupiter_sign: astroData.jupiter_sign || '',
          sun_sign: '', // Not in astrological_data, fallback
          saturn_sign: '', // Not in astrological_data, fallback
          sun_mars_aspect: 0, // Not in astrological_data, fallback
          sun_saturn_aspect: 0, // Not in astrological_data, fallback
          sun_jupiter_aspect: 0 // Not in astrological_data, fallback
        };
        const ais = await calculateAIS(player, ephemeris);
        totalScore += ais.score;
        return {
          name: player.name,
          sign: player.birth_date ? player.birth_date.split('-')[1] : 'Unknown',
          summary: `AIS: ${(ais.score * 100).toFixed(1)}`
        };
      }));
      setATR(Math.round((totalScore / players.length) * 100));
      setPlayerAnalysis(analysis);
    }
    analyzePlayers();
  }, [astroData, players]);

  if (loading) return <div>Loading astrological team analysis...</div>;
  if (!astroData) return <div>No astrological data. Please run <code>node scripts/computeEphemeris.js</code>.</div>;
  if (!players.length) return <div>No players found for this team.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Astrological Team Rating (ATR): {atr ?? 'N/A'}</h2>
      <div className="mb-4 text-gray-400">Calculated from current astrological influences and player profiles.</div>
      <h3 className="text-lg font-semibold mb-2">Player Astrological Analysis:</h3>
      <ul className="space-y-1">
        {playerAnalysis.map((p) => (
          <li key={p.name} className="text-gray-200">{p.name}, {p.sign}: {p.summary}</li>
        ))}
      </ul>
    </div>
  );
}

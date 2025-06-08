import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchNbaPlayerById } from '../lib/supabase';
import type { NbaPlayer } from '../types/nba.types';

const NbaPlayerDetailPage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<NbaPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNbaPlayerById(playerId || '')
      .then(setPlayer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!player) return <div>Player not found.</div>;

  return (
    <div>
      <h1>{player.first_name} {player.last_name}</h1>
      <p>Team ID: {player.team_id}</p>
      <p>Position: {player.primary_position}</p>
      <p>Jersey: {player.jersey_number}</p>
      <p>Birth: {player.birth_date} ({player.birth_city}, {player.birth_country})</p>
      <p>Height: {player.height} | Weight: {player.weight}</p>
      <p>College: {player.college}</p>
      <p>Rookie: {player.rookie ? 'Yes' : 'No'} | Active: {player.active ? 'Yes' : 'No'}</p>
      <Link to="/nba/players">Back to Players</Link>
    </div>
  );
};

export default NbaPlayerDetailPage;

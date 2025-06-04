import React, { useEffect, useState } from 'react';
import { fetchNbaPlayers } from '../lib/supabase';
import type { NbaPlayer } from '../types/nba.types';
import { Link } from 'react-router-dom';

const NbaPlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<NbaPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNbaPlayers()
      .then(setPlayers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading NBA players...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>NBA Players</h1>
      <ul>
        {players.map(player => (
          <li key={player.external_player_id}>
            <Link to={`/nba/players/${player.external_player_id}`}>
              {player.first_name} {player.last_name} ({player.team_id})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NbaPlayersPage;

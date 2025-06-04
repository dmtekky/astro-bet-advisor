import React, { useEffect, useState } from 'react';
import { fetchNbaTeams } from '../lib/supabase';
import type { NbaTeam } from '../types/nba.types';
import { Link } from 'react-router-dom';

const NbaTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<NbaTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNbaTeams()
      .then(setTeams)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading NBA teams...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>NBA Teams</h1>
      <ul>
        {teams.map(team => (
          <li key={team.external_team_id}>
            <Link to={`/teams/${team.id}`}>
              {team.city} {team.name} ({team.abbreviation})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NbaTeamsPage;

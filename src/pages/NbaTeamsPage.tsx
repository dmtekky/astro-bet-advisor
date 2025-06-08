import React, { useEffect, useState } from 'react';
import { fetchNbaTeamsWithChemistry, type TeamWithChemistry } from '../lib/supabase';
import { Link } from 'react-router-dom';

const NbaTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamWithChemistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNbaTeamsWithChemistry()
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
          <li key={team.id}>
            <Link to={`/teams/${team.id}`}>
              {team.city} {team.name} ({team.abbreviation})
              {/* Display chemistry score */}
              {team.team_chemistry && typeof team.team_chemistry.overall_score === 'number' ? 
                ` - Chemistry: ${team.team_chemistry.overall_score.toFixed(0)}/100` : 
                ' - Chemistry: N/A'}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NbaTeamsPage;

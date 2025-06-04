import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchNbaTeams, fetchNbaPlayers } from '../lib/supabase';
import type { NbaTeam, NbaPlayer } from '../types/nba.types';

const NbaTeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<NbaTeam | null>(null);
  const [players, setPlayers] = useState<NbaPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.log(`[NbaTeamDetailPage] teamId from URL: ${teamId}, type: ${typeof teamId}`);
      try {
        const teams = await fetchNbaTeams();
        console.log('[NbaTeamDetailPage] Fetched teams:', teams.map(t => ({ id: t.id, external_team_id: t.external_team_id, name: t.name })));
        
        const foundTeam = teams.find(t => {
          const matchById = String(t.id) === teamId;
          const matchByExternalId = t.external_team_id === teamId;
          if (matchById) console.log(`[NbaTeamDetailPage] Matched team ${t.name} by id: ${t.id} === ${teamId}`);
          if (matchByExternalId) console.log(`[NbaTeamDetailPage] Matched team ${t.name} by external_team_id: ${t.external_team_id} === ${teamId}`);
          return matchById || matchByExternalId;
        });
        
        if (!foundTeam) {
          console.log(`[NbaTeamDetailPage] Team not found for teamId: ${teamId}`);
        }
        setTeam(foundTeam || null);
        
        // If we found a team, filter players by the team's external_team_id
        if (foundTeam) {
          const allPlayers = await fetchNbaPlayers();
          setPlayers(allPlayers.filter(p => p.team_id === foundTeam.external_team_id));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [teamId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!team) return <div>Team not found.</div>;

  return (
    <div>
      <h1>{team.city} {team.name} ({team.abbreviation})</h1>
      <p>Conference: {team.conference} | Division: {team.division}</p>
      <h2>Roster</h2>
      <ul>
        {players.map(player => (
          <li key={player.external_player_id}>
            <Link to={`/nba/players/${player.external_player_id}`}>
              {player.first_name} {player.last_name} ({player.primary_position})
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/nba/teams">Back to Teams</Link>
    </div>
  );
};

export default NbaTeamDetailPage;

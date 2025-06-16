import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchMlbTeams, fetchMlbGames } from '@/lib/mlbCache';
import type { Team } from '@/types/dashboard';
import type { Game } from '@/types/dashboard';

interface ExtendedTeam extends Team {
  venue?: string;
  venue_name?: string;
  venue_city?: string;
  venue_state?: string;
  venue_capacity?: number;
  venue_surface?: string;
  venue_zip?: string;
  venue_latitude?: number;
  venue_longitude?: number;
}

interface GameWithTeams extends Game {
  home_team_data: ExtendedTeam;
  away_team_data: ExtendedTeam;
}

const MlbTeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<ExtendedTeam | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<GameWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch teams and games
        const [teamsData, gamesData] = await Promise.all([
          fetchMlbTeams(),
          fetchMlbGames()
        ]);

        // Find the specific team
        const foundTeam = teamsData.find(t => t.id === teamId) as ExtendedTeam;
        if (!foundTeam) {
          throw new Error('Team not found');
        }
        setTeam(foundTeam);

        // Filter games for this team and enrich with team data
        const teamGames = gamesData
          .filter(game => game.home_team_id === teamId || game.away_team_id === teamId)
          .map(game => {
            const homeTeam = teamsData.find(t => t.id === game.home_team_id) as ExtendedTeam;
            const awayTeam = teamsData.find(t => t.id === game.away_team_id) as ExtendedTeam;
            return {
              ...game,
              home_team_data: homeTeam,
              away_team_data: awayTeam
            };
          }) as GameWithTeams[];
        setUpcomingGames(teamGames);

      } catch (err) {
        console.error('[MlbTeamDetailPage] Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadData();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Team not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{team.name}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p>{team.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                <p>{team.venue_name || team.venue}</p>
              </div>
              {team.venue_capacity && (
                <div>
                  <p className="text-sm text-muted-foreground">Venue Capacity</p>
                  <p>{team.venue_capacity.toLocaleString()}</p>
                </div>
              )}
              {team.venue_surface && (
                <div>
                  <p className="text-sm text-muted-foreground">Playing Surface</p>
                  <p>{team.venue_surface}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingGames.map((game) => (
          <Card key={game.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {game.home_team_data.name} vs {game.away_team_data.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {new Date(game.game_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MlbTeamDetailPage; 
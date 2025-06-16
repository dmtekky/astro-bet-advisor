import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchMlbTeams } from '@/lib/mlbCache';
import type { Team } from '@/types/dashboard';

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

const MlbTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<ExtendedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const teamsData = await fetchMlbTeams();
        setTeams(teamsData as ExtendedTeam[]);

      } catch (err) {
        console.error('[MlbTeamsPage] Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">MLB Teams</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Link key={team.id} to={`/mlb/team/${team.id}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {team.logo_url && (
                    <img 
                      src={team.logo_url} 
                      alt={`${team.name} logo`} 
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  {team.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {team.city}, {team.venue_name || team.venue}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MlbTeamsPage; 
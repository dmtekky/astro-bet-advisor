import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GameCard } from '@/components/games/GameCard';
import type { Team } from '@/types/dashboard';
import type { Game } from '@/types/dashboard';
import { fetchMlbTeams, fetchMlbGames } from '@/lib/mlbCache';

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

interface ExtendedGame extends Game {
  home_team: ExtendedTeam;
  away_team: ExtendedTeam;
}

const MLBLeaguePage: React.FC = () => {
  const [teams, setTeams] = useState<ExtendedTeam[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<ExtendedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch teams and games using the cache functions
        const [teamsData, gamesData] = await Promise.all([
          fetchMlbTeams(),
          fetchMlbGames()
        ]);

        setTeams(teamsData as ExtendedTeam[]);
        setUpcomingGames(gamesData as ExtendedGame[]);

      } catch (err) {
        console.error('[MLBLeaguePage] Error:', err);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {teams.map((team) => (
          <Link key={team.id} to={`/team/${team.id}`}>
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

      <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            homeTeam={game.home_team}
            awayTeam={game.away_team}
            defaultLogo="/placeholder-team.png"
          />
        ))}
      </div>
    </div>
  );
};

export default MLBLeaguePage; 
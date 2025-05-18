import React from 'react';
import { useParams } from 'react-router-dom';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import { groupGamesByDate, formatGameDate, formatGameTime } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Team = {
  id: string;
  name: string;
  logo?: string;
};

// Mock team data - replace with actual data from your API
const MOCK_TEAMS: Record<string, Team> = {
  lal: { id: 'lal', name: 'Los Angeles Lakers', logo: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg' },
  gsw: { id: 'gsw', name: 'Golden State Warriors', logo: 'https://cdn.nba.com/logos/nba/1610612744/primary/G/logo.svg' },
  bos: { id: 'bos', name: 'Boston Celtics', logo: 'https://cdn.nba.com/logos/nba/1610612738/primary/B/logo.svg' },
  mia: { id: 'mia', name: 'Miami Heat', logo: 'https://cdn.nba.com/logos/nba/1610612748/primary/HEI/logo.svg' },
  bkn: { id: 'bkn', name: 'Brooklyn Nets', logo: 'https://cdn.nba.com/logos/nba/1610612751/primary/BKN/logo.svg' },
};

const UpcomingGames: React.FC = () => {
  const { sport = 'basketball' } = useParams<{ sport?: string }>();
  const { games, loading, error } = useUpcomingGames(sport);
  const groupedGames = groupGamesByDate(games);

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center text-red-500">
          Error loading games: {error.message}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">No Upcoming Games</h1>
        <p className="text-muted-foreground">
          There are no scheduled games in the next 16 days.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Games</h1>
      
      <div className="space-y-8">
        {groupedGames.map(({ date, games: dateGames }) => (
          <div key={date.toString()} className="space-y-4">
            <h2 className="text-xl font-semibold">
              {formatGameDate(date.toString())}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dateGames.map((game) => {
                const homeTeam = MOCK_TEAMS[game.home_team_id];
                const awayTeam = MOCK_TEAMS[game.away_team_id];
                
                return (
                  <Card key={game.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium text-muted-foreground">
                        {formatGameTime(game.start_time)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {homeTeam?.logo && (
                              <img 
                                src={homeTeam.logo} 
                                alt={`${homeTeam.name} logo`} 
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <span>{homeTeam?.name || `Team ${game.home_team_id}`}</span>
                          </div>
                          <span className="font-medium">vs</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {awayTeam?.logo && (
                              <img 
                                src={awayTeam.logo} 
                                alt={`${awayTeam.name} logo`} 
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <span>{awayTeam?.name || `Team ${game.away_team_id}`}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {game.venue}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingGames;

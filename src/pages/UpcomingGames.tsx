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

// Default logos for different sports
const DEFAULT_LOGOS: Record<string, string> = {
  soccer: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  basketball: 'https://cdn-icons-png.flaticon.com/512/33/33682.png',
  football: 'https://cdn-icons-png.flaticon.com/512/1/1322.png',
  baseball: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  hockey: 'https://cdn-icons-png.flaticon.com/512/33/33618.png',
};

const UpcomingGames: React.FC = () => {
  const { sport = 'soccer' } = useParams<{ sport?: string }>();
  // Fetch more games (up to 30) for the upcoming games page
  const { games, loading, error } = useUpcomingGames(sport, 30);
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
                // Use the actual team names from the game data
                const sportType = sport.includes('soccer') ? 'soccer' : 
                                 sport.includes('basketball') ? 'basketball' : 
                                 sport.includes('football') ? 'football' : 
                                 sport.includes('baseball') ? 'baseball' : 
                                 sport.includes('hockey') ? 'hockey' : 'soccer';
                
                const defaultLogo = DEFAULT_LOGOS[sportType] || DEFAULT_LOGOS.soccer;
                
                return (
                  <Card key={game.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium text-muted-foreground">
                        {formatGameTime(game.startTime)}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">{game.league}</div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={defaultLogo} 
                              alt={`${game.homeTeam} logo`} 
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div>
                              <span className="font-medium">{game.homeTeam}</span>
                              {game.homeRecord && (
                                <div className="text-xs text-muted-foreground">{game.homeRecord}</div>
                              )}
                            </div>
                          </div>
                          <div className="font-medium text-sm bg-muted px-2 py-1 rounded">
                            {game.homeOdds.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={defaultLogo} 
                              alt={`${game.awayTeam} logo`} 
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div>
                              <span className="font-medium">{game.awayTeam}</span>
                              {game.awayRecord && (
                                <div className="text-xs text-muted-foreground">{game.awayRecord}</div>
                              )}
                            </div>
                          </div>
                          <div className="font-medium text-sm bg-muted px-2 py-1 rounded">
                            {game.awayOdds.toFixed(2)}
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

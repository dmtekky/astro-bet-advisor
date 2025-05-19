import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  logo?: string;
  abbreviation?: string;
}

export interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team: Team | string;
  away_team: Team | string;
  start_time: string;
  odds?: string | number | null;
  oas?: string | number | null;
  status?: string;
  league?: string;
  sport?: string;
  astroEdge: number;
  astroInfluence: string;
  home_score?: number;
  away_score?: number;
}

interface GameCardProps {
  game: Game;
  className?: string;
  astroEdge?: number; // Astro Edge as a percentage (0-100)
}

export const GameCard: React.FC<GameCardProps> = ({ game, className, astroEdge = 0 }) => {
  const startTime = new Date(game.start_time);
  const isLive = new Date() > startTime && new Date() < new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
  const isToday = startTime.toDateString() === new Date().toDateString();
  
  // Use only the ID from the game prop - it should be the database ID
  const gameId = game.id;
  
  if (!gameId) {
    console.error('Game ID is missing in GameCard:', game);
    return null; // Don't render the card if there's no ID
  }

  // Helper to get team name
  const getTeamName = (team: Team | string): string => {
    if (typeof team === 'string') return team;
    return team.name || 'Unknown Team';
  };

  // Helper to get team wins/losses
  const getTeamRecord = (team: Team | string) => {
    if (typeof team === 'string') return { wins: 0, losses: 0 };
    return { wins: team.wins || 0, losses: team.losses || 0 };
  };

  // Helper for team logo
  const TeamLogo = ({ team, className = '' }: { team: Team | string; className?: string }) => {
    const teamName = getTeamName(team);
    return (
      <div className={`flex items-center ${className}`}>
        {typeof team !== 'string' && team.logo ? (
          <img 
            src={team.logo} 
            alt={teamName}
            className="w-8 h-8 mr-2 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/40?text=${teamName.substring(0, 2).toUpperCase()}`;
            }}
          />
        ) : (
          <div className="w-8 h-8 mr-2 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {teamName.substring(0, 2).toUpperCase()}
          </div>
        )}
        <span className="font-medium">{teamName}</span>
      </div>
    );
  };

  // Helper for team record
  const TeamRecord = ({ team }: { team: Team | string }) => {
    const { wins, losses } = getTeamRecord(team);
    return (
      <span className="text-xs text-muted-foreground">
        {wins}-{losses}
      </span>
    );
  };

  return (
    <Link to={`/event/${gameId}`} className="block">
      <Card className={cn("flex flex-col bg-gray-900/50 border-gray-800 hover:border-blue-500/30 transition-colors h-full", className)}>
        <div className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {game.league || game.sport?.toUpperCase() || 'GAME'}
                </span>
              </div>
              <div className="flex items-center">
                <Badge variant={isLive ? "destructive" : "secondary"} className="w-full justify-center animate-pulse">
                  {isLive ? 'LIVE' : isToday ? 'TODAY' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="grid grid-cols-3 gap-4 text-center flex-1">
              <div className="flex flex-col">
                <TeamLogo team={game.away_team} className="justify-center" />
                <div className="mt-2">
                  <TeamRecord team={game.away_team} />
                </div>
                <div className="mt-auto">
                  <Badge variant="outline" className="text-lg py-1 px-3">
                    {game.away_score ?? '--'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-xs text-muted-foreground mb-1">Spread</div>
                <div className="text-lg font-mono">--</div>
                <div className="text-xs text-muted-foreground mt-3">Total</div>
                <div className="text-lg font-mono">O/U --</div>
              </div>
              <div className="flex flex-col">
                <TeamLogo team={game.home_team} className="justify-end" />
                <div className="mt-2 flex justify-end">
                  <TeamRecord team={game.home_team} />
                </div>
                <div className="mt-auto flex justify-end">
                  <Badge variant="outline" className="text-lg py-1 px-3">
                    {game.home_score ?? '--'}
                  </Badge>
                </div>
              </div>
            </div>
            {astroEdge !== undefined && (
              <>
                <div className="flex items-center">
                  <span className="text-muted-foreground">Astro Edge</span>
                </div>
                <div className="flex items-center">
                  {astroEdge > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={astroEdge > 0 ? 'text-green-500' : 'text-red-500'}>
                    {astroEdge > 0 ? '+' : ''}{astroEdge}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Matchup Details
            </Button>
            <Button variant="outline" size="sm">
              <TrendingDown className="w-4 h-4 mr-2" />
              View Team Stats
            </Button>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
};

export const GameCardSkeleton = () => {
  return (
    <Card className="w-full bg-gray-900/50 border-gray-800 overflow-hidden">
      <div className="relative
        before:absolute before:inset-0 before:-translate-x-full
        before:bg-gradient-to-r before:from-transparent before:via-gray-700/30 before:to-transparent
        before:animate-[shimmer_2s_infinite] before:z-10">
        <CardHeader>
          <div className="h-5 w-3/4 bg-gray-800/50 rounded" />
          <div className="h-4 w-1/2 mt-2 bg-gray-800/50 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-800/50 rounded" />
            <div className="h-4 w-5/6 bg-gray-800/50 rounded" />
            <div className="h-4 w-4/6 bg-gray-800/50 rounded" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <div className="h-10 w-24 bg-gray-800/50 rounded" />
          <div className="h-10 w-24 bg-gray-800/50 rounded" />
        </CardFooter>
      </div>
    </Card>
  );
};

export default GameCard;

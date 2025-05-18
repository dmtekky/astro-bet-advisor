import React, { useState, useEffect } from 'react';
import type { GameData } from '@/types/game';
import type { Team } from '@/services/teamService';
import { fetchTeamById } from '@/services/teamService';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';



interface GameCardProps {
  game: GameData;
  className?: string;
  astroEdge?: number; // Astro Edge as a percentage (0-100)
}

export const GameCard: React.FC<GameCardProps> = ({ game, className, astroEdge = 0 }) => {
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const startTime = new Date(game.startTime);
  const isLive = new Date() > startTime && new Date() < new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
  const isToday = startTime.toDateString() === new Date().toDateString();

  useEffect(() => {
    async function fetchTeams() {
      // If homeTeam and awayTeam are IDs, fetch by ID. If they are names, you may need to adjust this logic.
      const [home, away] = await Promise.all([
        fetchTeamById(game.homeTeam),
        fetchTeamById(game.awayTeam)
      ]);
      setHomeTeam(home);
      setAwayTeam(away);
    }
    fetchTeams();
  }, [game.homeTeam, game.awayTeam]);

  // Helper for image
  const getTeamImage = (team: Team | null) => {
    return team?.logo_url || '/default-team.png';
  };

  return (
    <Card className={cn("flex flex-col bg-gray-900/50 border-gray-800 hover:border-blue-500/30 transition-colors h-full", className)}>
      <div className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{game.league}</span>
              <CardTitle className="text-lg font-medium mt-1 flex items-center gap-2">
                <img src={getTeamImage(awayTeam)} alt={awayTeam?.name} className="w-6 h-6 rounded-full object-cover inline-block mr-2" />
                {awayTeam?.display_name || awayTeam?.name || game.awayTeam}
                <span className="mx-1">@</span>
                <img src={getTeamImage(homeTeam)} alt={homeTeam?.name} className="w-6 h-6 rounded-full object-cover inline-block mr-2" />
                {homeTeam?.display_name || homeTeam?.name || game.homeTeam}
              </CardTitle>
            </div>
            <div className="w-20 text-center">
              <Badge variant={isLive ? "destructive" : "secondary"} className="w-full justify-center animate-pulse">
                {isLive ? 'LIVE' : isToday ? 'TODAY' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {isToday && ' • ' + (isLive ? 'In Progress' : 'Today')}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <div className="flex flex-col">
              <div className="text-2xl font-bold">{awayTeam?.display_name || awayTeam?.name || game.awayTeam}</div>
              <div className="text-sm text-muted-foreground">{game.awayRecord}</div>
              <div className="mt-auto">
                <Badge variant={game.awayOdds && game.awayOdds > 0 ? "default" : "outline"} className="text-lg py-1 px-3">
                  {game.awayOdds ? (game.awayOdds > 0 ? `+${game.awayOdds}` : game.awayOdds) : '--'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-muted-foreground mb-1">Spread</div>
              <div className="text-lg font-mono">{game.spread ? (game.spread > 0 ? `+${game.spread}` : game.spread) : '--'}</div>
              <div className="text-xs text-muted-foreground mt-3">Total</div>
              <div className="text-lg font-mono">O/U {game.total ?? '--'}</div>
            </div>

            <div className="flex flex-col text-right">
              <div className="text-2xl font-bold">{homeTeam?.display_name || homeTeam?.name || game.homeTeam}</div>
              <div className="text-sm text-muted-foreground">{game.homeRecord}</div>
              <div className="mt-auto flex justify-end">
                <Badge variant={game.homeOdds && game.homeOdds > 0 ? "default" : "outline"} className="text-lg py-1 px-3">
                  {game.homeOdds ? (game.homeOdds > 0 ? `+${game.homeOdds}` : game.homeOdds) : '--'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Astro Edge</span>
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
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-0 pb-4 px-6">
        <Button variant="outline" className="w-full border-blue-500/30 hover:bg-blue-500/10">
          View Matchup Details
        </Button>
      </CardFooter>
    </Card>
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

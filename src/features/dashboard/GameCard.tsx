import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample game data type
export interface GameData {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  homeOdds: number;
  awayOdds: number;
  spread: number;
  total: number;
  homeRecord: string;
  awayRecord: string;
}

// Sample game data for demonstration
export const SAMPLE_GAMES: GameData[] = [
  {
    id: 'game1',
    league: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    startTime: '2025-05-18T23:30:00',
    homeOdds: -120,
    awayOdds: +100,
    spread: -2.5,
    total: 215.5,
    homeRecord: '52-30',
    awayRecord: '48-34'
  },
  {
    id: 'game2',
    league: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'San Francisco 49ers',
    startTime: '2025-05-19T20:20:00',
    homeOdds: -150,
    awayOdds: +130,
    spread: -3.5,
    total: 48.5,
    homeRecord: '14-3',
    awayRecord: '13-4'
  },
  {
    id: 'game3',
    league: 'MLB',
    homeTeam: 'New York Yankees',
    awayTeam: 'Los Angeles Dodgers',
    startTime: '2025-05-20T19:10:00',
    homeOdds: +110,
    awayOdds: -130,
    spread: 1.5,
    total: 8.5,
    homeRecord: '28-15',
    awayRecord: '30-13'
  },
  {
    id: 'game4',
    league: 'NHL',
    homeTeam: 'Tampa Bay Lightning',
    awayTeam: 'Colorado Avalanche',
    startTime: '2025-05-21T21:00:00',
    homeOdds: -110,
    awayOdds: -110,
    spread: -1.5,
    total: 6.0,
    homeRecord: '51-23-8',
    awayRecord: '49-25-8'
  },
  {
    id: 'game5',
    league: 'NBA',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Milwaukee Bucks',
    startTime: '2025-05-22T22:00:00',
    homeOdds: -105,
    awayOdds: -115,
    spread: 1.0,
    total: 224.5,
    homeRecord: '50-32',
    awayRecord: '54-28'
  },
  {
    id: 'game6',
    league: 'NFL',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Cincinnati Bengals',
    startTime: '2025-05-23T20:15:00',
    homeOdds: -125,
    awayOdds: +105,
    spread: -2.5,
    total: 47.5,
    homeRecord: '12-5',
    awayRecord: '11-6'
  }
];

interface GameCardProps {
  game: GameData;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({ game, className }) => {
  const startTime = new Date(game.startTime);
  const isLive = new Date() > startTime && new Date() < new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
  const isToday = startTime.toDateString() === new Date().toDateString();
  
  return (
    <Card className={cn("bg-gray-900/50 border-gray-800 hover:border-blue-500/30 transition-colors", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{game.league}</span>
            <CardTitle className="text-lg font-medium mt-1">
              {game.awayTeam} @ {game.homeTeam}
            </CardTitle>
          </div>
          <Badge variant={isLive ? "destructive" : "secondary"} className="animate-pulse">
            {isLive ? 'LIVE' : isToday ? 'TODAY' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          {isToday && ' • ' + (isLive ? 'In Progress' : 'Today')}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{game.awayTeam.split(' ').pop()}</div>
            <div className="text-sm text-muted-foreground">{game.awayRecord}</div>
            <div className="mt-2">
              <Badge variant={game.awayOdds > 0 ? "default" : "outline"} className="text-lg py-1 px-3">
                {game.awayOdds > 0 ? `+${game.awayOdds}` : game.awayOdds}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-muted-foreground mb-1">Spread</div>
            <div className="text-lg font-mono">{game.spread > 0 ? `+${game.spread}` : game.spread}</div>
            <div className="text-xs text-muted-foreground mt-3">Total</div>
            <div className="text-lg font-mono">O/U {game.total}</div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{game.homeTeam.split(' ').pop()}</div>
            <div className="text-sm text-muted-foreground">{game.homeRecord}</div>
            <div className="mt-2 flex justify-end">
              <Badge variant={game.homeOdds > 0 ? "default" : "outline"} className="text-lg py-1 px-3">
                {game.homeOdds > 0 ? `+${game.homeOdds}` : game.homeOdds}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Astro Edge</span>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>+{Math.floor(Math.random() * 3) + 1}%</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
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

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Player, Team, BettingOdds, AstrologicalData, Sport } from '@/types';
import { cn } from '@/lib/utils';

interface BettingCardProps {
  type: 'player' | 'team';
  data: Player | Team;
  odds?: BettingOdds[];
  astrologyData?: AstrologicalData | null;
  isLoading: boolean;
}

const BettingCard: React.FC<BettingCardProps> = ({ type, data, odds, astrologyData, isLoading }) => {
  if (isLoading) {
    return <BettingCardSkeleton />;
  }

  const sport = data.sport;
  
  // Function to get the best odds
  const getBestOdds = () => {
    if (!odds || odds.length === 0) return null;
    
    // Sort by odds value - lower is better for American odds format
    const bestOdds = [...odds].sort((a, b) => a.odds - b.odds)[0];
    return bestOdds;
  };
  
  const bestOdds = getBestOdds();
  
  // Format odds for display (American odds format)
  const formatOdds = (odds: number) => {
    if (odds > 0) {
      return `+${odds}`;
    }
    return odds.toString();
  };
  
  // Determine if this is a player or team and get appropriate data
  const name = data.name;
  const imageUrl = type === 'player' 
    ? (data as Player).image 
    : (data as Team).logo;
  const subtitle = type === 'player' 
    ? `${(data as Player).position || ''} ${(data as Player).team || ''}` 
    : (data as Team).abbreviation;
    
  // Determine astrology rating display
  const getAstrologyRating = () => {
    if (!astrologyData) return null;
    
    const { favorability } = astrologyData;
    let color = 'bg-yellow-500';
    
    if (favorability >= 70) color = 'bg-green-500';
    else if (favorability <= 30) color = 'bg-red-500';
    
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="text-sm font-medium">Astro Rating:</div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <div 
              key={star}
              className={cn(
                "w-2 h-2 rounded-full",
                star <= Math.ceil(favorability / 20) ? color : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md", 
      `hover:border-sports-${sport} hover:border-opacity-50`
    )}>
      <CardHeader className={cn(
        "pb-2",
        `bg-sports-${sport} bg-opacity-10`
      )}>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate">
            {type === 'team' ? (
              <Link 
                to={`/team/${data.id}`}
                className="hover:underline hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </CardTitle>
          <Badge variant="outline" className={cn(
            `border-sports-${sport} text-sports-${sport}`,
            "uppercase text-xs font-bold"
          )}>
            {sport}
          </Badge>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex justify-between">
          {imageUrl ? (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
              <img 
                src={imageUrl} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <div className="text-right">
            {bestOdds ? (
              <>
                <div className="text-sm text-muted-foreground">Best Odds</div>
                <div className={cn(
                  "text-xl font-bold",
                  bestOdds.odds < 0 ? "text-red-500" : "text-green-500"
                )}>
                  {formatOdds(bestOdds.odds)}
                </div>
                <div className="text-xs text-muted-foreground">
                  via {bestOdds.bookmaker}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No odds available
              </div>
            )}
          </div>
        </div>
        
        {type === 'player' && getAstrologyRating()}
      </CardContent>
      
      <CardFooter className="bg-secondary/30 py-2 px-4 text-xs text-muted-foreground">
        {type === 'player' && astrologyData?.influences && (
          <div>
            {astrologyData.influences.slice(0, 2).join(', ')}
            {astrologyData.influences.length > 2 ? '...' : ''}
          </div>
        )}
        {(!astrologyData || !astrologyData.influences) && (
          <div>
            {type === 'player' 
              ? 'No astrological data available' 
              : `${odds?.length || 0} odds available`}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

const BettingCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-4 w-1/2 mt-1" />
    </CardHeader>
    
    <CardContent className="pt-4">
      <div className="flex justify-between">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="text-right">
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Skeleton key={star} className="w-2 h-2 rounded-full" />
          ))}
        </div>
      </div>
    </CardContent>
    
    <CardFooter className="py-2 px-4">
      <Skeleton className="h-3 w-full" />
    </CardFooter>
  </Card>
);

export default BettingCard;

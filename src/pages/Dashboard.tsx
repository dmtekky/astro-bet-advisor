
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SportsTabs from '@/features/dashboard/SportsTabs';
import BettingGrid from '@/features/dashboard/BettingGrid';
import { GameCard, SAMPLE_GAMES } from '@/features/dashboard/GameCard';
import { Sport } from '@/types';
import { useFormulaWeights } from '@/hooks/useFormulaData';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CelestialMap from '@/components/CelestialMap';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSport, setActiveSport] = useState<Sport>('nba');
  
  // Sync URL with active sport
  useEffect(() => {
    const sportParam = searchParams.get('sport') as Sport | null;
    if (sportParam) {
      setActiveSport(sportParam);
    }
  }, [searchParams]);
  
  // Get formula weights for the active sport
  const { data: formulaWeights, isLoading: isLoadingWeights } = useFormulaWeights(activeSport);
  
  const handleSportChange = (sport: Sport) => {
    setActiveSport(sport);
    // Update URL without page reload
    setSearchParams({ sport });
    
    // Notify user when weights are missing
    if (sport === 'soccer' || sport === 'ncaa') {
      toast({
        title: "Coming Soon",
        description: `${sport.toUpperCase()} betting will be available soon.`,
        variant: "default",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sports Betting Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Make informed betting decisions with odds and astrological insights
          </p>
        </div>
        
        <SportsTabs 
          activeSport={activeSport} 
          onSportChange={handleSportChange}
        >
          {activeSport === 'soccer' || activeSport === 'ncaa' ? (
            <ComingSoon sport={activeSport} />
          ) : (
            <BettingGrid sport={activeSport} />
          )}
        </SportsTabs>
        
        {/* Upcoming Games Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Upcoming Games</h2>
          <p className="text-muted-foreground">
            Today's top matchups with astrological insights
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_GAMES.slice(0, 3).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All Upcoming Games →
            </button>
          </div>
        </div>
        
        {/* Celestial Insights Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Celestial Insights</h2>
          <p className="text-muted-foreground">
            Current astrological influences that may impact today's games and betting opportunities
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Current Celestial Map</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="aspect-square max-h-[400px]">
                  <CelestialMap className="h-full w-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Hover over planets to see current astrological positions and their influences
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Astrological Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Current Planetary Alignments</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Sun in Taurus</span>
                      <span className="text-amber-400">Stable</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mercury in Gemini</span>
                      <span className="text-green-400">Favorable</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Venus in Aries</span>
                      <span className="text-amber-400">Neutral</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mars in Aquarius</span>
                      <span className="text-green-400">Strong</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <h3 className="font-medium mb-2">Today's Key Aspect</h3>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-amber-400 font-medium">Jupiter Trine Moon</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Favorable for team sports and strategic plays. Look for underdogs with strong team dynamics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const ComingSoon: React.FC<{ sport: Sport }> = ({ sport }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-24 h-24 mb-6 bg-secondary/50 rounded-full flex items-center justify-center">
        {sport === 'soccer' ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-muted-foreground" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a27.26 27.26 0 0 0 3 13.91A27.26 27.26 0 0 0 12 22" />
            <path d="M12 22a27.26 27.26 0 0 1-3-13.91A27.26 27.26 0 0 1 12 2" />
            <path d="M2 12h20" />
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-muted-foreground" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <ellipse cx="12" cy="12" rx="10" ry="7" />
            <path d="M2 12h20" />
            <path d="M12 5v14" />
            <path d="M6 8l12 8" />
            <path d="M18 8 6 16" />
          </svg>
        )}
      </div>
      
      <h2 className="text-2xl font-bold mb-2">{sport.toUpperCase()} Coming Soon</h2>
      <p className="text-muted-foreground text-center max-w-md">
        We're currently gathering data and fine-tuning our astrological models for {sport.toUpperCase()} games.
        Check back soon for comprehensive betting insights!
      </p>
    </div>
  );
};

export default Dashboard;


import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SportsTabs from '@/components/dashboard/SportsTabs';
import BettingGrid from '@/components/dashboard/BettingGrid';
import { Sport } from '@/types';
import { useFormulaWeights } from '@/hooks/useFormulaData';
import { toast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const [activeSport, setActiveSport] = useState<Sport>('nba');
  
  // Get formula weights for the active sport
  const { data: formulaWeights, isLoading: isLoadingWeights } = useFormulaWeights(activeSport);
  
  const handleSportChange = (sport: Sport) => {
    setActiveSport(sport);
    
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

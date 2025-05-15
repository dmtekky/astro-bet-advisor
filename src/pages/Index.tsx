
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SportsTabs from '@/components/dashboard/SportsTabs';
import BettingGrid from '@/components/dashboard/BettingGrid';
import { Sport } from '@/types';

const Index = () => {
  const [activeSport, setActiveSport] = useState<Sport>('nba');
  
  const handleSportChange = (sport: Sport) => {
    setActiveSport(sport);
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
          <BettingGrid sport={activeSport} />
        </SportsTabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;

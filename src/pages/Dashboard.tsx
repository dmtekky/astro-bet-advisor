import React, { useState } from 'react';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GamesByDate } from '@/components/games/GamesByDate';
import { useAstroGames } from '@/hooks/useAstroGames';
import { SportKey, DEFAULT_LOGOS, SPORT_OPTIONS } from '@/types/dashboard';

// Main Dashboard component



const Dashboard: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<SportKey>('basketball_nba');
  
  const { 
    gamesByDate, 
    isLoading, 
    error, 
    refetch,
    astroData
  } = useAstroGames(selectedSport);

  // Get the current sport name for display
  const currentSportName = SPORT_OPTIONS.find(
    sport => sport.value === selectedSport
  )?.label || 'Sports';

  // Display astrological information
  const renderAstroInfo = () => {
    if (!astroData) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-purple-500" />
            Astrological Influences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Moon</h3>
              <div className="text-sm">
                <Badge variant="outline" className="mr-2">
                  {astroData.moon?.sign || 'Unknown'}
                </Badge>
                <span>{astroData.moon?.phase || 'Unknown phase'}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Mercury</h3>
              <div className="text-sm">
                <Badge 
                  variant={astroData.mercury?.retrograde ? "destructive" : "outline"}
                  className="mr-2"
                >
                  {astroData.mercury?.retrograde ? 'Retrograde' : 'Direct'}
                </Badge>
                <span>in {astroData.mercury?.sign || 'Unknown'}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Elements</h3>
              <div className="flex gap-2">
                {astroData.elements && Object.entries(astroData.elements).map(([element, value]) => (
                  <Badge key={element} variant="outline">
                    {element}: {value}%
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading {currentSportName} games...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load games. Please try again later.
            <div className="mt-4">
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upcoming Games</h1>
          <p className="text-muted-foreground">
            View and analyze upcoming {currentSportName.toLowerCase()} games with astrological insights
          </p>
        </div>

        {renderAstroInfo()}

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl">Select Sport</CardTitle>
              <Tabs 
                defaultValue={selectedSport}
                onValueChange={(value) => setSelectedSport(value as SportKey)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {SPORT_OPTIONS.map((sport) => (
                    <TabsTrigger 
                      key={sport.value} 
                      value={sport.value}
                      className="flex items-center gap-2"
                    >
                      <img 
                        src={sport.icon} 
                        alt={sport.label} 
                        className="w-4 h-4 object-contain"
                      />
                      <span className="hidden sm:inline">{sport.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-8">
          {Object.keys(gamesByDate).length > 0 ? (
            <GamesByDate 
              gamesByDate={gamesByDate} 
              sport={selectedSport} 
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src={DEFAULT_LOGOS[selectedSport]} 
                    alt="No games" 
                    className="w-16 h-16 opacity-50"
                  />
                  <h3 className="text-lg font-medium">No Upcoming Games</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no {currentSportName.toLowerCase()} games scheduled at the moment. 
                    Please check back later or select a different sport.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

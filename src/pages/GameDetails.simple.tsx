import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft, Home, Info } from 'lucide-react';
import type { Game, Team } from '@/types'; 
import { useAstroData } from '@/hooks/useAstroData';
import { GamePredictionData, createDefaultPredictionData, createDefaultCelestialBody } from '@/types/gamePredictions';
import { predictGameOutcome } from '@/utils/sportsPredictions';
import type { AstroData } from '@/types/astrology';

interface DetailedGame extends Omit<Game, 'league'> {
  home_team: Team | null;
  away_team: Team | null;
  venue: any | null;
  league: any | null;
}

const GameDetails: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<DetailedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch game data
  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!gameId) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
          .eq('id', gameId)
          .single();
          
        if (error) throw error;
        
        setGame(data as unknown as DetailedGame);
      } catch (err: any) {
        console.error('Error fetching game details:', err);
        setError(err.message || 'Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId]);
  
  // Fetch astrological data
  const { astroData, loading: astroLoading } = useAstroData(
    game?.start_time,
    {
      latitude: game?.venue?.latitude || 0,
      longitude: game?.venue?.longitude || 0,
      timezone: 'UTC',
    }
  );
  
  // Generate game prediction
  const gamePrediction = useMemo(() => {
    if (!game || !astroData) return null;
    
    // Create a simplified game object
    const simplifiedGame: Game = {
      id: game.id,
      sport: game.sport,
      home_team_id: game.home_team_id,
      away_team_id: game.away_team_id,
      start_time: game.start_time,
      status: game.status,
      league: game.league?.name || '',
    };
    
    // Create prediction data
    const predictionData: GamePredictionData = {
      ...createDefaultPredictionData(),
      date: astroData.date || new Date().toISOString(),
      queryTime: astroData.queryTime || new Date().toISOString(),
      observer: {
        latitude: astroData.observer?.latitude || 0,
        longitude: astroData.observer?.longitude || 0,
        timezone: astroData.observer?.timezone || 'UTC',
        altitude: astroData.observer?.altitude || 0
      },
      sun: astroData.sun || createDefaultCelestialBody('Sun'),
      moon: astroData.moon || createDefaultCelestialBody('Moon'),
      planets: astroData.planets || {},
      aspects: astroData.aspects || [],
      moonPhase: {
        name: astroData.moonPhase?.name || 'New Moon',
        value: astroData.moonPhase?.value || 0,
        illumination: astroData.moonPhase?.illumination || 0
      },
      elements: astroData.elements || {
        fire: { score: 0, planets: [] },
        earth: { score: 0, planets: [] },
        water: { score: 0, planets: [] },
        air: { score: 0, planets: [] }
      }
    };
    
    // Ensure home_team and away_team are properly typed as Team or undefined
    const homeTeam = game.home_team as Team | undefined;
    const awayTeam = game.away_team as Team | undefined;
    
    return predictGameOutcome(simplifiedGame, homeTeam, awayTeam, predictionData);
  }, [game, astroData]);
  
  // Handle loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Skeleton className="h-5 w-16 bg-slate-700" />
            <Skeleton className="h-5 w-5 bg-slate-700 rounded-full" />
            <Skeleton className="h-5 w-24 bg-slate-700" />
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 rounded-xl bg-slate-700" />
            <Skeleton className="h-64 rounded-xl bg-slate-700" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/"><Home className="h-3.5 w-3.5 mr-1" /> Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Game Details</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          
          <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-200 mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <Card className="bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-4">
                <Info className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-200 mb-2">Unable to load game details</h2>
              <p className="text-slate-400 mb-6">We couldn't load the game details you're looking for.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline" className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
                  Try Again
                </Button>
                <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild><Link to="/dashboard">
                  Return to Dashboard
                </Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  // Handle not found state
  if (!game) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/"><Home className="h-3.5 w-3.5 mr-1" /> Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Game Not Found</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Card className="bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold text-slate-200 mb-2">Game Not Found</h2>
              <p className="text-slate-400 mb-6">The game you're looking for could not be found.</p>
              <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild><Link to="/dashboard">
                Return to Dashboard
              </Link></Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  // Main render
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/"><Home className="h-3.5 w-3.5 mr-1" /> Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Game Details</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 text-slate-200">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-200 mb-4">Game Information</h2>
              <div className="flex justify-between mb-4">
                <div className="text-center flex-1">
                  <h3 className="font-semibold text-slate-300">{game.home_team?.name}</h3>
                </div>
                <div className="text-center">vs</div>
                <div className="text-center flex-1">
                  <h3 className="font-semibold text-slate-300">{game.away_team?.name}</h3>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-sm mb-2">
                  <strong>Status:</strong> {game.status}
                </p>
                <p className="text-slate-400 text-sm mb-2">
                  <strong>Start Time:</strong> {new Date(game.start_time).toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm">
                  <strong>League:</strong> {game.league?.name || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-200 mb-4">Astrological Prediction</h2>
              {astroLoading ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Skeleton className="h-16 w-16 rounded-full bg-slate-700 mb-4" />
                  <Skeleton className="h-4 w-32 bg-slate-700" />
                </div>
              ) : astroData ? (
                <div>
                  <p className="text-slate-300 mb-4">
                    <strong>Prediction:</strong> {gamePrediction?.prediction || 'No prediction available'}
                  </p>
                  <p className="text-slate-400 text-sm mb-2">
                    <strong>Moon Phase:</strong> {astroData.moonPhase?.name || 'Unknown'}
                  </p>
                  <p className="text-slate-400 text-sm mb-2">
                    <strong>Sun Sign:</strong> {astroData.sun?.sign || 'Unknown'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    <strong>Confidence:</strong> {gamePrediction ? `${Math.round(gamePrediction.confidence * 100)}%` : 'N/A'}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No astrological data available for this game.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GameDetails;

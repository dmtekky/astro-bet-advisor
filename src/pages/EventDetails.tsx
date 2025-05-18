import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BarChart2, 
  Calendar, 
  Clock, 
  Users, 
  Zap, 
  AlertCircle, 
  Loader2, 
  ThumbsUp, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  XCircle, 
  Info 
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { getMockEventById } from '@/mocks/mockEvents';
import type { Sport } from '@/types';

interface Player {
  id: string;
  name: string;
  position: string;
  birth_date: string;
  win_shares: number;
  astro_influence: number;
  team: string;
}

interface AstroInfluence {
  aspect: string;
  influence: number;
  description: string;
}

// Generate position based on sport
const getPositionsForSport = (sport: string, count: number): string[] => {
  const positions: Record<string, string[]> = {
    nba: ['PG', 'SG', 'SF', 'PF', 'C'],
    nfl: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'],
    mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
    ncaa: ['PG', 'SG', 'SF', 'PF', 'C'],
    default: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']
  };
  
  const sportPositions = positions[sport as keyof typeof positions] || positions.default;
  return Array(count).fill('').map((_, i) => sportPositions[i % sportPositions.length]);
};

// Mock player data generator
const generateMockPlayers = (teamName: string, count: number, sport: string = 'nba'): Player[] => {
  const positions = getPositionsForSport(sport, count);
  
  return positions.map((position, i) => ({
    id: `player-${teamName}-${i + 1}`,
    name: `${teamName.split(' ').map(w => w[0]).join('')}${i + 1}`,
    position,
    birth_date: new Date(1990 + (i % 10), (i % 12) + 1, (i % 28) + 1).toISOString().split('T')[0],
    win_shares: parseFloat((Math.random() * 15 + 5).toFixed(1)),
    astro_influence: parseFloat((Math.random() * 0.7 + 0.3).toFixed(2)),
    team: teamName
  }));
};

// Mock astrological influences
const generateAstroInfluences = (sport: string = 'nba'): AstroInfluence[] => {
  const baseInfluences = [
    {
      aspect: 'Moon Phase',
      influence: 0.8,
      description: 'Waxing Gibbous - Strong positive influence on home team'
    },
    {
      aspect: 'Mercury in Virgo',
      influence: 0.6,
      description: 'Enhanced communication and strategy for both teams'
    },
    {
      aspect: 'Mars in Pisces',
      influence: 0.3,
      description: 'Slight negative impact on physical performance'
    },
    {
      aspect: 'Venus in Gemini',
      influence: 0.7,
      description: 'Improved team coordination and morale'
    }
  ];

  // Add sport-specific influences
  if (sport === 'nba') {
    baseInfluences.push({
      aspect: 'Sun Trine Mars',
      influence: 0.85,
      description: 'High energy and physical performance for basketball players'
    });
  } else if (sport === 'nfl') {
    baseInfluences.push({
      aspect: 'Mars Square Jupiter',
      influence: 0.8,
      description: 'Increased physical intensity and competitive drive'
    });
  } else if (sport === 'mlb') {
    baseInfluences.push({
      aspect: 'Mercury Trine Jupiter',
      influence: 0.75,
      description: 'Improved hand-eye coordination and timing'
    });
  } else if (sport === 'ncaa') {
    baseInfluences.push({
      aspect: 'Venus in the 5th House',
      influence: 0.7,
      description: 'Enhanced team spirit and performance under pressure'
    });
  }

  return baseInfluences;
};

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [astroInfluences, setAstroInfluences] = useState<AstroInfluence[]>([]);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        // Get the event from mock data
        const event = id ? getMockEventById(id) : null;
        
        if (!event) {
          console.error('Event not found');
          return;
        }
        
        setGame(event);
        
        // Generate mock players for home and away teams with the correct sport
        const homeTeamPlayers = generateMockPlayers(event.home_team, 5, event.sport);
        const awayTeamPlayers = generateMockPlayers(event.away_team, 5, event.sport);
        
        setHomePlayers(homeTeamPlayers);
        setAwayPlayers(awayTeamPlayers);
        
        // Generate astrological influences based on sport
        const influences = generateAstroInfluences(event.sport);
        setAstroInfluences(influences);
        
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The requested event could not be found or has expired.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const gameTime = new Date(game.commence_time || game.start_time).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const gameDate = new Date(game.commence_time || game.start_time).toLocaleDateString();
  // Ensure oas is a valid number, default to 60 if not provided (shouldn't happen with our mock data)
  const oas = typeof game.oas === 'number' ? game.oas : 60;
  const oasColor = oas >= 70 ? 'text-green-500' : oas >= 40 ? 'text-yellow-500' : 'text-red-500';

  // Determine the sport icon and color
  const getSportConfig = (sport: string) => {
    switch(sport) {
      case 'nba':
        return { color: 'from-orange-500 to-red-600', icon: '🏀' };
      case 'nfl':
        return { color: 'from-green-600 to-green-800', icon: '🏈' };
      case 'mlb':
        return { color: 'from-blue-500 to-blue-700', icon: '⚾' };
      case 'ncaa':
        return { color: 'from-purple-500 to-indigo-600', icon: '🏈' };
      default:
        return { color: 'from-gray-600 to-gray-800', icon: '🏆' };
    }
  };

  const sportConfig = getSportConfig(game.sport);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          className="mb-2 hover:bg-accent/50 transition-colors text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2 text-primary" /> 
          <span className="font-medium">Back to {game.sport.toUpperCase()}</span>
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center bg-blue-800/50 px-3 py-1 rounded-full border border-blue-700/50">
              <Clock className="h-4 w-4 mr-1.5 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">{gameTime} ET</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-3 text-blue-200">{sportConfig.icon}</span>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                  {game.home_team} vs {game.away_team}
                </h1>
                <p className="text-blue-200 text-sm mt-1">
                  {game.venue || 'Venue TBD'} • {game.location || 'Location TBD'}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-center md:text-right">
              <div className={`text-3xl font-bold ${oasColor} font-mono`}>
                {oas}%
              </div>
              <div className="text-xs text-blue-200 mt-1 font-medium">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  <BarChart2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
            <div className="absolute top-0 right-0 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-bl-lg">
              RECOMMENDED
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Recommended Bet</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Selection:</span>
                  <span className="font-semibold text-gray-800">
                    {oas >= 60 ? game.home_team : game.away_team} to Win
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div 
                        className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                        style={{ width: `${oas}%` }}
                      />
                    </div>
                    <span className="font-semibold text-green-600">{oas}%</span>
                  </div>
                </div>
                
                <div className="pt-3 mt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    {oas >= 70 ? 'Strong' : oas >= 50 ? 'Moderate' : 'Slight'} astrological advantage with multiple positive indicators.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-green-600">
                    {astroInfluences.slice(0, 2).map((influence, i) => (
                      <li key={`rec-${i}`} className="flex items-start">
                        <CheckCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                        <span>{influence.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-bl-lg">
              ALTERNATIVE
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Alternative Play</h3>
              </div>
              
              <div className="space-y-4">
                {game.odds && Math.abs(game.odds) > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">
                        {game.odds > 0 ? 'Underdog' : 'Favorite'} Spread
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Line:</span>
                      <span className="font-mono font-semibold">
                        {game.odds > 0 ? '+' : ''}{game.odds}
                      </span>
                    </div>
                    
                    <div className="pt-3 mt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        {oas >= 60 ? 'Good' : 'Fair'} value based on astrological factors and team performance metrics.
                      </p>
                      <ul className="mt-2 space-y-1 text-blue-600">
                        <li className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span>{oas >= 60 ? 'Favorable' : 'Neutral'} planetary alignments</span>
                        </li>
                        <li className="flex items-start text-sm">
                          <TrendingUp className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span>Positive momentum indicators</span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Check back closer to game time for spread recommendations</p>
                  </div>
                )}
                
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                    <ThumbsUp className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Recommended Bet</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Selection:</span>
                    <span className="font-semibold text-gray-800">
                      {oas >= 60 ? game.home_team : game.away_team} to Win
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div 
                          className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{ width: `${oas}%` }}
                        />
                      </div>
                      <span className="font-semibold text-green-600">{oas}%</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 mt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {oas >= 70 ? 'Strong' : oas >= 50 ? 'Moderate' : 'Slight'} astrological advantage with multiple positive indicators.
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-green-600">
                      {astroInfluences.slice(0, 2).map((influence, i) => (
                        <li key={`rec-${i}`} className="flex items-start">
                          <CheckCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span>{influence.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alternative Bet */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
            <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-bl-lg">
                ALTERNATIVE
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Alternative Play</h3>
                </div>
                
                <div className="space-y-4">
                  {game.odds && Math.abs(game.odds) > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold">
                          {game.odds > 0 ? 'Underdog' : 'Favorite'} Spread
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Line:</span>
                        <span className="font-mono font-semibold">
                          {game.odds > 0 ? '+' : ''}{game.odds}
                        </span>
                      </div>
                      
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          {oas >= 60 ? 'Good' : 'Fair'} value based on astrological factors and team performance metrics.
                        </p>
                        <ul className="mt-2 space-y-1 text-blue-600">
                          <li className="flex items-start text-sm">
                            <CheckCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>{oas >= 60 ? 'Favorable' : 'Neutral'} planetary alignments</span>
                          </li>
                          <li className="flex items-start text-sm">
                            <TrendingUp className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>Positive momentum indicators</span>
                          </li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Check back closer to game time for spread recommendations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bet to Avoid */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
            <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-bl-lg">
                CAUTION
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-600 mr-3">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Exercise Caution</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avoid:</span>
                    <span className="font-semibold">
                      {oas >= 50 ? game.away_team : game.home_team} Moneyline
                    </span>
                  </div>
                  
                  <div className="pt-3 mt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {oas >= 70 ? 'High' : 'Moderate'} risk based on current astrological conditions and team dynamics.
                    </p>
                    <ul className="mt-2 space-y-1 text-amber-600">
                      <li className="flex items-start text-sm">
                        <XCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                        <span>Challenging planetary alignments</span>
                      </li>
                      <li className="flex items-start text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                        <span>Potential performance volatility</span>
                      </li>
                      {oas >= 70 && (
                        <li className="flex items-start text-sm">
                          <Info className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                          <span>Consider alternative betting options</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-indigo-800">Betting Strategy</h4>
                <p className="text-xs text-indigo-700 mt-1">
                  These recommendations combine astrological analysis with statistical models. For optimal results, 
                  consider combining with your own research and bankroll management strategy. Always bet responsibly.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground py-6">
            <p>Astrological data is for entertainment purposes only. Please gamble responsibly.</p>
            <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

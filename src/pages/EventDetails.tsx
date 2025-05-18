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

// Interfaces
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
    nfl: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'],
    mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
    default: ['Player']
  };
  
  const sportPositions = positions[sport] || positions.default;
  return Array(count).fill(0).map((_, i) => sportPositions[i % sportPositions.length]);
};

// Mock player data generator
const generateMockPlayers = (teamName: string, count: number, sport: string = 'nba'): Player[] => {
  const positions = getPositionsForSport(sport, count);
  return Array(count).fill(0).map((_, i) => ({
    id: `player-${teamName.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    name: `Player ${i+1}`,
    position: positions[i],
    birth_date: new Date(1990 + i, i % 12, (i % 28) + 1).toISOString().split('T')[0],
    win_shares: 2 + Math.random() * 8,
    astro_influence: 30 + Math.random() * 70,
    team: teamName
  }));
};

// Mock astrological influences
const generateAstroInfluences = (sport: string = 'nba'): AstroInfluence[] => {
  const influences = [
    {
      aspect: 'Moon in Leo',
      influence: 75,
      description: 'Boosts confidence and performance under pressure'
    },
    {
      aspect: 'Mars trine Jupiter',
      influence: 82,
      description: 'Increases energy and competitive drive'
    },
    {
      aspect: 'Mercury direct',
      influence: 65,
      description: 'Improves decision-making and court vision'
    },
    {
      aspect: 'Venus in Pisces',
      influence: 58,
      description: 'Enhances team chemistry and cooperation'
    },
    {
      aspect: 'Saturn retrograde',
      influence: 40,
      description: 'May cause hesitation in crucial moments'
    },
    {
      aspect: 'Uranus square Sun',
      influence: 35,
      description: 'Potential for unexpected performance swings'
    }
  ];
  
  // Add sport-specific influences
  if (sport === 'nba') {
    influences.push({
      aspect: 'Jupiter in Sagittarius',
      influence: 78,
      description: 'Increases shooting accuracy and range'
    });
  } else if (sport === 'nfl') {
    influences.push({
      aspect: 'Mars in Aries',
      influence: 80,
      description: 'Boosts physical power and defensive prowess'
    });
  } else if (sport === 'mlb') {
    influences.push({
      aspect: 'Mercury in Gemini',
      influence: 72,
      description: 'Enhances pitching precision and batting eye'
    });
  }
  
  // Sort by influence (highest first)
  return influences.sort((a, b) => b.influence - a.influence);
};

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Mock game data - would be fetched from API in production
  const [game, setGame] = useState({
    id: eventId || '1',
    sport: 'nba',
    league: 'NBA',
    home_team: 'Los Angeles Lakers',
    away_team: 'Golden State Warriors',
    date: new Date().toISOString(),
    time: '7:30 PM',
    venue: 'Crypto.com Arena',
    odds: -3.5,
    over_under: 224.5
  });
  
  // Mock player data
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  
  // Mock astro influences
  const [astroInfluences, setAstroInfluences] = useState<AstroInfluence[]>([]);
  
  // Overall Astro Score (0-100)
  const [oas, setOas] = useState(65);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setHomePlayers(generateMockPlayers(game.home_team, 5, game.sport));
      setAwayPlayers(generateMockPlayers(game.away_team, 5, game.sport));
      setAstroInfluences(generateAstroInfluences(game.sport));
      setLoading(false);
    }, 1000);
  }, [game]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading astrological insights...</p>
        </div>
      </div>
    );
  }
  
  // Format date and time
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const gameTime = game.time;
  
  // Calculate player with highest astro influence
  const allPlayers = [...homePlayers, ...awayPlayers];
  const topPlayer = allPlayers.reduce((prev, current) => 
    (prev.astro_influence > current.astro_influence) ? prev : current
  );
  
  // Format the OAS (Overall Astro Score) color
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
                <h1 className="text-2xl font-bold">{game.home_team} vs {game.away_team}</h1>
                <div className="flex items-center text-muted-foreground mt-1 text-sm">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span>{formattedDate}</span>
                  <span className="mx-2">•</span>
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>{game.venue}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: Game details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Game Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">League:</span>
                        <span className="font-medium">{game.league}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Spread:</span>
                        <span className="font-medium">{game.odds > 0 ? '+' : ''}{game.odds}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Over/Under:</span>
                        <span className="font-medium">{game.over_under}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Astrological Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overall Astro Score:</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                              style={{ width: `${oas}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${oasColor}`}>{oas}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key Astrological Influences:</h4>
                        <ul className="space-y-2">
                          {astroInfluences.slice(0, 3).map((influence, idx) => (
                            <li key={idx} className="flex items-start">
                              <Zap className="h-4 w-4 text-amber-500 mt-0.5 mr-1.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium">{influence.aspect}</span>
                                <p className="text-xs text-muted-foreground">{influence.description}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Player with Highest Astro Impact:</h4>
                        <div className="flex items-center p-2 bg-accent/50 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            <span className="text-xs font-bold">{topPlayer.position}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{topPlayer.name}</div>
                            <div className="text-xs text-muted-foreground">{topPlayer.team}</div>
                          </div>
                          <div className="ml-auto flex items-center">
                            <span className="text-xs font-semibold text-amber-500">{Math.round(topPlayer.astro_influence)}%</span>
                            <Zap className="h-3 w-3 text-amber-500 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right column: Betting insights */}
              <div className="space-y-6">
                {/* Recommended Bet */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
                  <Card className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-bl-lg">
                      RECOMMENDED
                    </div>
                    <CardContent className="p-6">
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
                    </CardContent>
                  </Card>
                </div>

                {/* Alternative Bet */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
                  <Card className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-bl-lg">
                      ALTERNATIVE
                    </div>
                    <CardContent className="p-6">
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
                    </CardContent>
                  </Card>
                </div>

                {/* Bet to Avoid */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
                  <Card className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-bl-lg">
                      CAUTION
                    </div>
                    <CardContent className="p-6">
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
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-6">
          <p>Astrological data is for entertainment purposes only. Please gamble responsibly.</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

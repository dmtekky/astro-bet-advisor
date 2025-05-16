import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart2, Calendar, Clock, Users, Zap, AlertCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface Player {
  id: string;
  name: string;
  position: string;
  birth_date: string;
  win_shares: number;
  astro_influence: number;
}

interface AstroInfluence {
  aspect: string;
  influence: number;
  description: string;
}

const EventDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { game } = location.state || {};

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

  // Mock player data - replace with actual data from your API
  const homePlayers: Player[] = [
    { id: '1', name: 'Player 1', position: 'PG', birth_date: '1995-05-15', win_shares: 12.5, astro_influence: 0.8 },
    { id: '2', name: 'Player 2', position: 'SG', birth_date: '1993-08-22', win_shares: 10.2, astro_influence: 0.6 },
    { id: '3', name: 'Player 3', position: 'SF', birth_date: '1997-03-10', win_shares: 8.7, astro_influence: 0.9 },
  ];

  const awayPlayers: Player[] = [
    { id: '4', name: 'Player 4', position: 'PG', birth_date: '1994-11-05', win_shares: 9.8, astro_influence: 0.5 },
    { id: '5', name: 'Player 5', position: 'SG', birth_date: '1996-07-18', win_shares: 11.3, astro_influence: 0.7 },
    { id: '6', name: 'Player 6', position: 'SF', birth_date: '1998-01-25', win_shares: 7.9, astro_influence: 0.4 },
  ];

  const astroInfluences: AstroInfluence[] = [
    { aspect: 'Moon Phase', influence: 0.8, description: 'Waxing Gibbous - Strong positive influence on home team' },
    { aspect: 'Mercury in Virgo', influence: 0.6, description: 'Enhanced communication and strategy for both teams' },
    { aspect: 'Mars in Pisces', influence: 0.3, description: 'Slight negative impact on physical performance' },
    { aspect: 'Venus in Gemini', influence: 0.7, description: 'Improved team coordination and morale' },
  ];

  const gameTime = new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const gameDate = new Date(game.commence_time).toLocaleDateString();
  const oas = game.oas || 0;
  const oasColor = oas >= 70 ? 'text-green-500' : oas >= 40 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Game Header */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-1" />
                    <span>{gameDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-1" />
                    <span>{gameTime}</span>
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                  {game.home_team} vs {game.away_team}
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  {game.sport_title || 'Game Details'}
                </CardDescription>
              </div>
              <div className="mt-4 md:mt-0 text-center md:text-right">
                <div className="text-sm text-indigo-200 mb-1">Astro Advantage</div>
                <div className={`text-4xl font-bold ${oasColor}`}>
                  {oas}%
                </div>
                <div className="text-xs text-indigo-200 mt-1">
                  {oas >= 70 ? 'Strong' : oas >= 40 ? 'Moderate' : 'Low'} Confidence
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Odds Section */}
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Betting Odds
                </h3>
                <div className="space-y-4">
                  {game.bookmakers?.[0]?.markets?.[0]?.outcomes?.map((outcome, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-medium">{outcome.name}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        outcome.price > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {outcome.price > 0 ? `+${outcome.price}` : outcome.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Astro Analysis */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Astrological Analysis
                </h3>
                <div className="space-y-6">
                  {astroInfluences.map((influence, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{influence.aspect}</span>
                        <span className="text-gray-600">
                          {Math.round(influence.influence * 100)}% influence
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${
                              influence.influence > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${influence.influence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(influence.influence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{influence.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Team Players */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{game.home_team} Key Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {homePlayers.map((player) => (
                  <div key={player.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full h-12 w-12 flex items-center justify-center font-semibold text-lg mr-4">
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500">{player.position} • {player.birth_date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Win Shares: <span className="font-semibold">{player.win_shares}</span></div>
                      <div className="flex items-center justify-end">
                        <span className="text-xs text-gray-500 mr-2">Astro:</span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              player.astro_influence > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${player.astro_influence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {Math.round(player.astro_influence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Away Team Players */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{game.away_team} Key Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {awayPlayers.map((player) => (
                  <div key={player.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full h-12 w-12 flex items-center justify-center font-semibold text-lg mr-4">
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500">{player.position} • {player.birth_date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Win Shares: <span className="font-semibold">{player.win_shares}</span></div>
                      <div className="flex items-center justify-end">
                        <span className="text-xs text-gray-500 mr-2">Astro:</span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              player.astro_influence > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${player.astro_influence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {Math.round(player.astro_influence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting Recommendations */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Betting Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Recommended Bet</h4>
                <p className="text-green-700">
                  <span className="font-semibold">{game.home_team} to win</span> - Strong astrological advantage with {oas}% confidence
                </p>
                <div className="mt-2 text-sm text-green-600 space-y-1">
                  <p>• Favorable moon phase for home team players</p>
                  <p>• Positive planetary alignments for key players</p>
                  <p>• Historical performance under current astrological conditions is strong</p>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Alternative Bet</h4>
                <p className="text-yellow-700">
                  <span className="font-semibold">Over 215.5 points</span> - Moderate confidence in high scoring game
                </p>
                <div className="mt-2 text-sm text-yellow-600 space-y-1">
                  <p>• Offensive players have strong astrological alignments</p>
                  <p>• Defensive players show slightly weaker influences</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Avoid</h4>
                <p className="text-red-700">
                  <span className="font-semibold">Under 215.5 points</span> - Low confidence in defensive play
                </p>
                <div className="mt-2 text-sm text-red-600 space-y-1">
                  <p>• Defensive players show weak astrological influences</p>
                  <p>• Offensive alignments suggest high scoring potential</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500 py-6">
          <p>Astrological data is for entertainment purposes only. Please gamble responsibly.</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

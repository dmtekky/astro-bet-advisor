import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import GneePrediction from '@/components/game/GneePrediction';
import type { Team as TeamType } from '@/types';

// Simple player interface
interface Player {
  id: string;
  name: string;
  position?: string;
}

interface GameState {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team: any | null;
  away_team: any | null;
  venue: any | null;
  league: any | null;
  external_id: string | null;
  score_home: number | null;
  score_away: number | null;
  sport: string;
  start_time: string;
  game_date: string;
  game_time_utc: string;
  game_time_local: string;
  status: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields that might be used in the UI
  home_odds?: number;
  away_odds?: number;
  spread?: number;
  over_under?: number;
  league_name?: string;
}

// StarField component for cosmic background
const StarField = () => {
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map(star => (
        <motion.div 
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{ 
            width: star.size, 
            height: star.size, 
            top: star.top, 
            left: star.left,
            boxShadow: `0 0 ${star.size * 2}px ${star.size}px rgba(255, 255, 255, 0.7)` 
          }}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 1, 0.5, 1, 0], 
            scale: [1, 1.2, 1, 1.1, 1] 
          }}
          transition={{ 
            duration: 5 + Math.random() * 3, 
            repeat: Infinity, 
            delay: star.delay,
            ease: "easeInOut" 
          }}
        />
      ))}
    </div>
  );
};

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  // Player states (minimal implementation)
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      console.log('[GamePage] Fetching game details for gameId:', gameId);
      if (!gameId) return;
      
      try {
        setLoading(true);
        
        // Fetch game with team details
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select(`
            *,
            home_team:teams!home_team_id(*),
            away_team:teams!away_team_id(*),
            venue:venue_id(*),
            league:league_id(*)
          `)
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        
        if (gameData) {
          console.log('Raw game data from database:', gameData);
          
          // Create a safe game object with all required fields
          const safeGameData: GameState = {
            id: gameData.id,
            home_team_id: gameData.home_team_id,
            away_team_id: gameData.away_team_id,
            home_team: gameData.home_team || null,
            away_team: gameData.away_team || null,
            venue: gameData.venue || null,
            league: gameData.league || null,
            external_id: gameData.external_id || null,
            score_home: gameData.score_home || null,
            score_away: gameData.score_away || null,
            sport: gameData.sport || 'baseball',
            start_time: gameData.start_time,
            game_date: gameData.game_date,
            game_time_utc: gameData.game_time_utc,
            game_time_local: gameData.game_time_local,
            status: gameData.status || 'scheduled',
            created_at: gameData.created_at || new Date().toISOString(),
            updated_at: gameData.updated_at || new Date().toISOString()
          };
          
          // Set the game state
          setGame(safeGameData);
          
          // Fetch team rosters (minimal implementation)
          if (safeGameData.home_team?.abbreviation && safeGameData.away_team?.abbreviation) {
            console.log('[GamePage] Would fetch rosters for:', {
              home: safeGameData.home_team.abbreviation,
              away: safeGameData.away_team.abbreviation
            });
            // For now, just set empty arrays
            setHomePlayers([]);
            setAwayPlayers([]);
          }
        } else {
          console.error('Home or away team details or abbreviations are missing from gameData:', gameData);
          setHomePlayers([]);
          setAwayPlayers([]);
        }
        
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId]);
  
  // Fetch team rosters with player stats
  const fetchTeamRosters = async (homeTeamAbbr: string, awayTeamAbbr: string) => {
    try {
      console.log('[GamePage] Would fetch rosters for:', { homeTeamAbbr, awayTeamAbbr });
      
      // For now, just set empty arrays since we're not actually fetching players
      setHomePlayers([
        { id: 'player-1', name: 'Sample Player 1', position: 'P' },
        { id: 'player-2', name: 'Sample Player 2', position: 'C' },
        { id: 'player-3', name: 'Sample Player 3', position: '1B' }
      ]);
      
      setAwayPlayers([
        { id: 'player-4', name: 'Sample Player 4', position: 'P' },
        { id: 'player-5', name: 'Sample Player 5', position: 'C' },
        { id: 'player-6', name: 'Sample Player 6', position: '1B' }
      ]);
      
    } catch (error) {
      console.error('Error in fetchTeamRosters:', error);
      setHomePlayers([]);
      setAwayPlayers([]);
    }
  };
  
  // Format game date and time from game object
  const formatGameDateTime = (game: GameState): { date: string; time: string } => {
    try {
      const timestamp = game.game_time_local || game.game_time_utc || game.game_date || game.start_time;
      
      if (!timestamp) {
        console.error('No timestamp available in game data');
        return { 
          date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }), 
          time: 'Time not available' 
        };
      }
      
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp in game data:', timestamp);
        return { 
          date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }), 
          time: 'Invalid time' 
        };
      }
      
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        })
      };
    } catch (error) {
      console.error('Error formatting game date:', error);
      return { 
        date: 'Date not available',
        time: 'Time not available'
      };
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-950 to-blue-950">
        <StarField />
        <div className="container mx-auto py-8 px-4 md:px-6 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/10">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
            </Button>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg bg-white/5" />
            ))}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Skeleton className="h-64 w-full rounded-lg bg-white/5" />
          </motion.div>
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-950 to-blue-950">
        <StarField />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-white hover:bg-white/10">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
          </Button>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center py-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">Game Not Found</h2>
            <p className="text-blue-200">The requested game could not be found in this universe.</p>
            <div className="mt-8">
              <div className="h-16 w-16 rounded-full bg-yellow-300/20 mx-auto animate-pulse" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  const { home_team, away_team } = game;
  
  // Debug log the game object to see what fields are available
  console.log('Game object:', {
    game_date: game.game_date,
    game_time_local: game.game_time_local,
    game_time_utc: game.game_time_utc,
    start_time: game.start_time,
    allFields: Object.keys(game)
  });
  
  const gameDateTime = formatGameDateTime(game);
  // Use the first 3 players from each team
  const topHomePlayers = homePlayers.slice(0, 3);
  const topAwayPlayers = awayPlayers.slice(0, 3);
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 to-blue-950">
      <StarField />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6 text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> 
            Back to Games
          </Button>
        </motion.div>

        {/* Venue Information */}
        {game.venue?.name && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-sm rounded-xl p-6 mb-8 border border-indigo-500/30 shadow-lg shadow-indigo-500/20"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 bg-indigo-500/20 p-3 rounded-full">
                  <div className="h-6 w-6 bg-indigo-300 rounded-full" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1 text-white">{game.venue.name}</h2>
                  <p className="text-blue-200 flex items-center">
                    {game.venue.city}, {game.venue.state}
                  </p>
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="mt-4 md:mt-0 bg-indigo-900/50 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-medium border border-indigo-500/30 shadow-md"
              >
                <span className={`inline-block h-3 w-3 rounded-full mr-2 ${
                  game.status === 'scheduled' ? 'bg-yellow-400 animate-pulse' : 
                  game.status === 'in_progress' ? 'bg-green-400 animate-pulse' : 
                  'bg-blue-400'}`}>
                </span>
                <span className="text-white">
                  {game.status === 'scheduled' ? 'Upcoming' : 
                  game.status === 'in_progress' ? 'Live' : 
                  game.status?.replace('_', ' ').toLowerCase() || 'Scheduled'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Game Details */}
        <div className="bg-card/90 rounded-xl border mb-8 overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {game.league_name || 'Game Details'}
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-purple-600 mx-auto mb-3 rounded-full"></div>
              <div className="text-muted-foreground text-sm font-medium">
                {gameDateTime.date} • {gameDateTime.time}
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 my-8">
              {/* Home Team */}
              <div className="flex flex-col items-center">
                <Link 
                  to={`/teams/${home_team?.id}`}
                  className="group block w-full"
                >
                  <div className="relative w-32 h-32 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors duration-300 -z-10"></div>
                    <div className="w-full h-full transition-all duration-300 group-hover:scale-105">
                      <img 
                        src={home_team?.logo_url || '/team-placeholder.svg'} 
                        alt={`${home_team?.name} logo`}
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = '/team-placeholder.svg';
                        }}
                      />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold text-center text-indigo-900 transition-all duration-300" style={{ 
                    fontFamily: '"Arial Black", Impact, "Arial Narrow", Arial, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.15), -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                    fontWeight: '900'
                  }}>
                    {home_team?.name || 'HOME'}
                  </h2>
                  <p className="text-muted-foreground text-sm text-center">
                    {home_team?.record || '0-0'}
                  </p>
                  {game.score_home !== undefined && (
                    <div className="mt-2 text-3xl font-bold text-center">
                      {game.score_home}
                    </div>
                  )}
                </Link>
              </div>
              
              {/* VS */}
              <div className="my-6 md:my-0">
                <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">VS</span>
                </div>
              </div>
              
              {/* Away Team */}
              <div className="flex flex-col items-center">
                <Link 
                  to={`/teams/${away_team?.id}`}
                  className="group block w-full"
                >
                  <div className="relative w-32 h-32 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors duration-300 -z-10"></div>
                    <div className="w-full h-full transition-all duration-300 group-hover:scale-105">
                      <img 
                        src={away_team?.logo_url || '/team-placeholder.svg'} 
                        alt={`${away_team?.name} logo`}
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = '/team-placeholder.svg';
                        }}
                      />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold text-center text-indigo-900 transition-all duration-300" style={{ 
                    fontFamily: '"Arial Black", Impact, "Arial Narrow", Arial, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.15), -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                    fontWeight: '900'
                  }}>
                    {away_team?.name || 'AWAY'}
                  </h2>
                  <p className="text-muted-foreground text-sm text-center">
                    {away_team?.record || '0-0'}
                  </p>
                  {game.score_away !== undefined && (
                    <div className="mt-2 text-3xl font-bold text-center">
                      {game.score_away}
                    </div>
                  )}
                </Link>
              </div>
            </div>

            {/* Top Players Section */}

          </div>
        </div>
        
        {/* GNEE Prediction Section */}
        <section className="mt-12 mb-8">
          <GneePrediction 
            expectedWinner={home_team?.name || 'Home Team'}
            winnerLogo={home_team?.logo_url}
            topPlayers={[
              ...topHomePlayers.map(p => ({
                name: p.name,
                team: home_team?.name || 'Home Team',
                astroInfluence: 50 // Default value
              })),
              ...topAwayPlayers.map(p => ({
                name: p.name,
                team: away_team?.name || 'Away Team',
                astroInfluence: 45 // Default value
              }))
            ].sort((a, b) => b.astroInfluence - a.astroInfluence).slice(0, 3)}
            keyAspects={[
              `Strong planetary alignment favors ${home_team?.name || 'home team'} hitters tonight`,
              `${away_team?.name || 'Away team'} pitchers showing fatigue in recent charts`,
              `Venue conditions suggest higher scoring game than usual`
            ]}
            gameInsights={[
              `${home_team?.name || 'Home team'} has won 4 of their last 5 games`,
              `${away_team?.name || 'Away team'} is 3-2 on the road this season`,
              `Expected temperature: 72°F with clear skies`
            ]}
          />
        </section>
      </div>
    </div>
  );
};

export default GamePage;

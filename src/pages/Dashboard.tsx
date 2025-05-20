import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Default logos for different sports
const DEFAULT_LOGOS: Record<string, string> = {
  soccer: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  basketball: 'https://cdn-icons-png.flaticon.com/512/33/33682.png',
  football: 'https://cdn-icons-png.flaticon.com/512/1/1322.png',
  baseball: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  hockey: 'https://cdn-icons-png.flaticon.com/512/33/33618.png',
};

// Types
interface Team {
  id: string;
  name: string;
  logo_url?: string;
  city?: string;
  abbreviation?: string;
  record?: string;
  wins?: number;
  losses?: number;
  primary_color?: string;
  secondary_color?: string;
}

interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: Team;
  away_team?: Team;
  game_time_utc: string;  // Changed from start_time to game_time_utc
  game_time_local: string;
  game_date: string;
  home_score?: number;
  away_score?: number;
  status: string;
  home_odds?: number;
  away_odds?: number;
  over_under?: number;
  spread?: number;
  league_id?: string;
  venue_id?: string;
  season?: number;
  season_type?: string;
  period?: number;
  period_time_remaining?: string;
  attendance?: number;
  external_id?: number;
  broadcasters?: any[];
  notes?: string | null;
  duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

interface MoonData {
  phase: number;
  sign: string;
  icon: string;
}

interface AstroData {
  moon: MoonData;
  sun: { sign: string; element: string };
  mercury: { retrograde: boolean; sign: string };
  venus: { sign: string };
  mars: { sign: string };
  jupiter: { sign: string };
  saturn: { sign: string };
  uranus: { sign: string };
  neptune: { sign: string };
  pluto: { sign: string };
  northNode: { sign: string };
  southNode: { sign: string };
  aspects: Array<{ planet1: string; planet2: string; aspect: string }>;
  elements: { fire: number; earth: number; air: number; water: number };
  modalities: { cardinal: number; fixed: number; mutable: number };
}

// Extend the Game interface to include astro and display fields
interface GameWithAstro extends Game {
  astroEdge: number;
  astroInfluence: string;
  homeTeamName: string;
  awayTeamName: string;
  defaultLogo: string;
  start_time: string; // Alias for game_time_utc for backward compatibility
}

// GameCard props
interface GameCardProps {
  game: GameWithAstro;
}

// Utility functions
function calculateAstroEdge(game: Game, astroData: AstroData): number {
  let score = 50; // Base score
  if (astroData.moon?.phase > 0.7 || astroData.moon?.phase < 0.3) {
    score += 10; // Favor new and full moons
  }
  if (astroData.mercury?.retrograde) {
    score -= 5; // Mercury retrograde penalty
  }
  
  const homeTeamName = game.home_team?.name || '';
  const awayTeamName = game.away_team?.name || '';
  const homeTeamHash = homeTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const awayTeamHash = awayTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Add some "astrological" randomness based on team names
  score += (homeTeamHash - awayTeamHash) % 21;
  
  return Math.max(0, Math.min(100, score));
}

function calculateGameImpact(game: Game, astroData: AstroData): number {
  let score = 50; // Base score
  
  const moonSign = astroData.moon?.sign?.toLowerCase();
  if (['cancer', 'scorpio', 'pisces'].includes(moonSign)) {
    score += 5; // Favor water signs for emotional games
  }
  
  if (astroData.mercury?.retrograde) {
    score -= 7; // Communication issues during mercury retrograde
  }
  
  let gameHour = 0;
  try {
    if (game.game_time_utc) {
      gameHour = new Date(game.game_time_utc).getUTCHours();
      if (gameHour >= 12 && gameHour < 18) {
        score += 3; // Afternoon games get a slight boost
      }
    }
  } catch (e) {
    console.warn('Invalid date in calculateGameImpact:', game.game_time_utc);
  }
  
  return Math.max(0, Math.min(100, score));
}

function getAstroInfluence(edge: number, impact: number): string {
  if (edge >= 70 && impact >= 70) return 'Strong positive astrological influence';
  if (edge >= 70 && impact <= 30) return 'Favorable but challenging conditions';
  if (edge <= 30 && impact <= 30) return 'Strong negative astrological influence';
  if (edge <= 30 && impact >= 70) return 'Challenging but potentially rewarding';
  if (edge >= 60) return 'Favorable astrological conditions';
  if (edge <= 40) return 'Challenging astrological conditions';
  return 'Neutral astrological influence';
}

// Game card component
const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <img
            src={game.home_team?.logo_url || game.defaultLogo}
            alt={game.homeTeamName || 'Home Team'}
            className="w-10 h-10 rounded-full bg-gray-800 object-cover"
            onError={(e) => {
              // Fallback to default logo if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = game.defaultLogo;
            }}
          />
          <div className="text-center">
            <div className="font-semibold">{game.homeTeamName || game.home_team?.name || 'Home Team'}</div>
            <div className="text-xs text-muted-foreground">
              {game.home_team?.record ? `(${game.home_team.record})` : ''}
            </div>
          </div>
          <div className="text-center mx-2">
            <div className="text-muted-foreground text-sm">vs</div>
            <div className="text-xs text-muted-foreground">
              {game.status === 'in_progress' ? 'Live' : format(new Date(game.game_time_utc), 'h:mm a')}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{game.awayTeamName || game.away_team?.name || 'Away Team'}</div>
            <div className="text-xs text-muted-foreground">
              {game.away_team?.record ? `(${game.away_team.record})` : ''}
            </div>
          </div>
          <img
            src={game.away_team?.logo_url || game.defaultLogo}
            alt={game.awayTeamName || 'Away Team'}
            className="w-10 h-10 rounded-full bg-gray-800 object-cover"
            onError={(e) => {
              // Fallback to default logo if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = game.defaultLogo;
            }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {game.game_time_utc ? 
            (() => {
              try {
                return format(new Date(game.game_time_utc), 'PPpp');
              } catch (e) {
                console.warn('Invalid date format:', game.game_time_utc);
                return 'Date not available';
              }
            })() : 'Date not available'}
        </div>
        <div className="mt-2">
          <Badge>{game.astroInfluence}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard component
const Dashboard: React.FC = () => {
  // Mock astro data
  const { data: astroData, isLoading: astroLoading, error: astroError } = useQuery<AstroData>({
    queryKey: ['astro-data'],
    queryFn: async () => {
      // Log when astro data is being fetched
      console.log('Fetching astro data...');
      return {
        moon: { phase: 0.5, sign: 'Aries', icon: '🌓' },
        sun: { sign: 'Taurus', element: 'Earth' },
        mercury: { retrograde: false, sign: 'Taurus' },
        venus: { sign: 'Gemini' },
        mars: { sign: 'Leo' },
        jupiter: { sign: 'Pisces' },
        saturn: { sign: 'Aquarius' },
        uranus: { sign: 'Taurus' },
        neptune: { sign: 'Pisces' },
        pluto: { sign: 'Capricorn' },
        northNode: { sign: 'Taurus' },
        southNode: { sign: 'Scorpio' },
        aspects: [],
        elements: { fire: 25, earth: 25, air: 25, water: 25 },
        modalities: { cardinal: 33, fixed: 33, mutable: 34 }
      };
    }
  });

  // Fetch games from Supabase
  const { data: games = [], isLoading: gamesLoading, error: gamesError } = useQuery<Game[]>({
    queryKey: ['dashboard-games'],
    queryFn: async () => {
      try {
        // Fetch games data with proper field selection and ordering
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .order('game_time_utc', { ascending: true })
          .limit(10);
          
        if (gamesError) throw gamesError;
        if (!gamesData) return [];
        
        // Log the first game to inspect its structure
        if (gamesData.length > 0) {
          console.log('First game data structure:', gamesData[0]);
        }

        // Gather unique team IDs
        const teamIds = [...new Set([
          ...gamesData.map(game => game.home_team_id),
          ...gamesData.map(game => game.away_team_id)
        ])].filter(id => id !== null);

        // Fetch teams data
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds);
          
        if (teamsError) throw teamsError;
        
        // Create a map of teams by ID
        const teamsMap = (teamsData || []).reduce((acc, team) => {
          acc[team.id] = team;
          return acc;
        }, {} as Record<string, any>);

        // Merge team info into each game
        return gamesData.map(game => ({
          ...game,
          home_team: teamsMap[game.home_team_id] || null,
          away_team: teamsMap[game.away_team_id] || null,
        }));
      } catch (error) {
        console.error('Error fetching games:', error);
        return [];
      }
    }
  });

  // Process games with astro data and filter for active/future games
  const processedGames = useMemo(() => {
    if (!games || !astroData) return [];
    
    const now = new Date();
    
    return games
      .filter(game => {
        try {
          // Only include games that are in progress or in the future
          const gameTime = new Date(game.game_time_utc);
          // Include games from the last 4 hours to catch in-progress games
          const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
          return gameTime >= fourHoursAgo;
        } catch (e) {
          console.warn('Invalid game time:', game.game_time_utc);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by game time
        try {
          return new Date(a.game_time_utc).getTime() - new Date(b.game_time_utc).getTime();
        } catch (e) {
          return 0;
        }
      })
      .map(game => {
        // Calculate astro data once per game
        const astroEdge = calculateAstroEdge(game, astroData);
        const gameImpact = calculateGameImpact(game, astroData);
        
        // Get default logo based on sport or use baseball as default
        const defaultLogo = DEFAULT_LOGOS['baseball'];
        
        return {
          ...game,
          astroEdge,
          astroInfluence: getAstroInfluence(astroEdge, gameImpact),
          homeTeamName: game.home_team?.name || 'Home Team',
          awayTeamName: game.away_team?.name || 'Away Team',
          home_team: {
            ...game.home_team,
            logo_url: game.home_team?.logo_url || defaultLogo
          },
          away_team: {
            ...game.away_team,
            logo_url: game.away_team?.logo_url || defaultLogo
          },
          defaultLogo,
          start_time: game.game_time_utc // Alias for backward compatibility
        };
      });
  }, [games, astroData]);

  // Loading state
  if (gamesLoading || astroLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (gamesError || astroError) {
    const error = gamesError || astroError;
    return (
      <DashboardLayout>
        <div className="p-4 text-center text-red-500">
  <AlertCircle className="inline-block w-6 h-6 mr-2" />
  <div>
    <strong>{error?.message || 'Failed to load data. Please try again later.'}</strong>
    {error && (
      <pre style={{ textAlign: 'left', margin: '1em auto', background: '#2d2d2d', color: '#f87171', padding: '1em', borderRadius: '8px', maxWidth: '600px', overflowX: 'auto' }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    )}
  </div>
</div>
      </DashboardLayout>
    );
  }
  
  // Render games
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Upcoming Games</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedGames.map((game) => (
            <GameCard key={game.id} game={game as GameWithAstro} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

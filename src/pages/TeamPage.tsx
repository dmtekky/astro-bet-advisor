import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Debug log for environment variables
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY ? '***' : 'missing');
console.log('Supabase client:', supabase);
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, ChevronLeft, Calendar as CalendarIcon, Check, Info, MapPin as MapPinIcon, PlusSquare, ShieldCheck, Sparkles, Star, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import PlayerCardNew from '@/components/PlayerCardNew';
import { toast } from '../components/ui/use-toast';
import TeamRoster from '../components/TeamRoster';
import { GameCarousel } from '../components/games/GameCarousel';
import { getTeamColorStyles } from '@/utils/teamColors';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { TeamChemistryMeter } from '@/components/TeamChemistryMeter';

import { calculateImpactScore } from '../utils/calculateImpactScore';
import { calculateNbaImpactScore } from '../utils/calculateNbaImpactScore';
// Type definitions for the component
interface Team {
  id: string;
  name: string;
  logo_url: string;
  city: string;
  venue?: string;
  conference?: string;
  division?: string;
  abbreviation: string;
  primary_color: string;
  secondary_color: string;
  league_id: string;
  external_id?: string | number;
  // Additional team fields
  intFormedYear?: string | number;
  strStadium?: string;
  strDescriptionEN?: string;
  // League relationship
  league?: {
    id: string;
    name: string;
    sport?: string;
  };
  [key: string]: any; // For any additional properties
}

interface Player {
  id: string;
  player_id: string | number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  headshot_url?: string;
  position?: string;
  number?: number | string | null;
  team_id?: string | null;
  team_name?: string | null;
  birth_date?: string | null;
  is_active?: boolean;
  primary_position?: string;
  jersey_number?: string | number | null;
  birth_city?: string | null;
  birth_country?: string | null;
  birth_state?: string | null;
  height?: string | number | null;
  weight?: string | number | null;
  college?: string | null;
  rookie?: boolean | null;
  status?: string | null;
  experience?: string | number | null;
  photo_url?: string | null;
  // Stats fields
  impact_score?: number | null;
  astro_influence?: number | null;
  // Additional fields for display
  display_height?: string;
  display_weight?: string;
  age?: number | null;
  sport_type?: string | null; // To identify player's sport, e.g., 'basketball', 'baseball'

  // NBA Specific Stats (from basketball_stats)
  points_per_game?: number | null;
  assists_per_game?: number | null;
  rebounds_per_game?: number | null;
  steals_per_game?: number | null;
  blocks_per_game?: number | null;
  field_goal_percentage?: number | null;
  three_point_percentage?: number | null;
  turnovers_per_game?: number | null;
  personal_fouls_per_game?: number | null;

  [key: string]: any; // For any additional properties
} 

// Helper type for team data in games
interface GameTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo_url?: string;
  city: string;
  [key: string]: any; // For any additional properties
}

// Type for the game data from the API
interface GameData {
  id: string | number;
  game_date?: string | null;
  game_time_utc?: string | null;
  status?: string | null;
  home_team_id?: string | number | null;
  away_team_id?: string | number | null;
  home_score?: number | null;
  away_score?: number | null;
  external_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  home_team?: any | null;
  away_team?: any | null;
  league_id?: string | number | null;
  venue_id?: string | number | null;
  venue?: {
    name?: string | null;
    city?: string | null;
  } | null;
  astroInfluence?: string | null;
  astroEdge?: number | null;
  home_odds?: number | null;
  away_odds?: number | null;
  spread?: number | null;
  over_under?: number | null;
  season?: number | null;
  week?: number | null;
  [key: string]: any;
}

// Base Game interface with all possible fields
interface GameBase {
  id: string;
  game_date: string;
  game_time_utc: string;
  status: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  home_team: Team | null;
  away_team: Team | null;
  league_id: string;
  venue_id: string;
  external_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  home_odds?: number | null;
  away_odds?: number | null;
  spread?: number | null;
  over_under?: number | null;
  season?: number | null;
  week?: number | null;
  astroInfluence?: string;
  astroEdge?: number;
  venue?: {
    name?: string | null;
    city?: string | null;
  } | null;
  [key: string]: any;
}

// Type for the processed game with required fields
type Game = GameBase;

// Type for games with non-null teams for the GameCarousel
type GameWithTeams = GameBase & { 
  home_team: Team; 
  away_team: Team;
  astroInfluence: string;
  astroEdge: number;
};



// Define the interfaces for team chemistry data
interface ElementalBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
  balance: number;
}

interface AspectHarmony {
  harmonyScore: number;
  challengeScore: number;
  netHarmony: number;
}

interface TeamChemistryData {
  score: number;
  elements: ElementalBalance;
  aspects: AspectHarmony;
  calculatedAt: string;
}

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [chemistry, setChemistry] = useState<TeamChemistryData | null>({
    score: 50,
    elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
    aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
    calculatedAt: new Date().toISOString()
  });
  const [chemistryLoading, setChemistryLoading] = useState<boolean>(true);
  
  // Type for games with non-null teams for the GameCarousel
  type GameWithTeams = Game & { home_team: Team; away_team: Team };
  
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch team data
  const fetchTeamData = async (): Promise<void> => {
    if (!teamId) {
      setError('No team ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // 1. Fetch team data from the 'teams' table
      const { data: teamResult, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          logo_url,
          city,
          venue,
          conference,
          division,
          abbreviation,
          primary_color,
          secondary_color,
          league_id,
          external_id,
          intFormedYear,
          strStadium,
          strDescriptionEN,
          league:league_id(id, name, sport)
        `)
        .eq('id', teamId)
        .single();

      if (teamError) {
        throw new Error(`Error fetching team: ${teamError.message}`);
      }

      if (!teamResult) {
        throw new Error('Team not found');
      }

      // Process team data
      const currentTeam: Team = teamResult;
      setTeamData(currentTeam);

      // Rest of the function implementation...
    } catch (err: any) {
      console.error('Error in team page:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  // Zodiac sign calculation utility
  function getZodiacSign(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="container mx-auto flex flex-col items-center justify-center h-full">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <h2 className="text-xl font-semibold">Loading team data...</h2>
          </div>
        </div>
        
        <div className="container mx-auto mt-8">
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const teamColors = getTeamColorStyles(team);

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8"
      style={{ background: teamColors.gradientBg }}
    >
      <div className="container pb-12 pt-0 px-4 md:px-6 mx-auto">
        
        {/* Team Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mt-1.5"
        >
          <div className="flex-shrink-0 w-32 h-32 md:w-42 md:h-42">
            {team?.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={`${team.name} logo`} 
                className="w-full h-full object-contain" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                <span className="text-gray-600 font-bold text-2xl">{team?.abbreviation || '?'}</span>
              </div>
            )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-row items-start justify-center md:justify-start space-x-3 mb-3.5">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{team?.name}</h1>
                <p className="text-slate-500 text-sm">
                  {team?.city} • {team?.venue || 'Venue N/A'}
                </p>
              </div>
              {team?.league?.name && (
                <Badge 
                  variant="outline"
                  className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 mt-2"
                  style={{ borderColor: teamColors.secondary, color: teamColors.primary }}
                >
                  {team.league.name}
                </Badge>
              )}
            </div>
          

        </div>
      </motion.div>
      
      {/* Top Players */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="-mt-1.5 mb-8 md:mb-12"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
          <Star className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
          Top Players
        </h2>
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4 md:space-x-0 md:mx-0 md:px-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-4 md:justify-items-center md:overflow-visible">
          {topPlayers.length > 0 ? topPlayers.slice(0, 4).map(player => {
            // Calculate team average astro influence for the glow effect
            const teamAverageAstroInfluence = players.length > 0 
              ? players.reduce((sum, p) => sum + (p.astro_influence || 0), 0) / players.length 
              : 0;
              
            return (
              <PlayerCardNew
                key={player.id}
                id={player.id}
                player_id={player.player_id}
                full_name={player.full_name}
                headshot_url={player.headshot_url || undefined}
                birth_date={player.birth_date || undefined}
                primary_number={player.number?.toString() || undefined}
                primary_position={player.position || undefined}
                impact_score={player.impact_score || 0}
                astro_influence={player.astro_influence || 0}
                teamAverageAstroInfluence={teamAverageAstroInfluence}
                linkPath={`/teams/${teamId}/players/${player.id}`}
              />
            );
          }) : (
            <p className="col-span-full text-slate-500 text-center py-10">No player data available</p>
          )}
        </div>
      </motion.div>
      
      {/* Team Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 md:mb-12"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
          <Info className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
          Team Insights
        </h2>
        
        <Card className="bg-white w-full">
          <CardContent className="p-0">
            {/* Team Chemistry Meter - Full Width */}
            <div className="w-full">
              {chemistry && !chemistryLoading ? (
                <TeamChemistryMeter chemistry={chemistry} className="w-full" />
              ) : chemistryLoading ? (
                <div className="p-6 md:p-8 rounded-lg bg-slate-50 animate-pulse w-full">
                  <h3 className="font-semibold mb-4 text-slate-700 text-lg">Team Chemistry</h3>
                  <div className="w-full h-48 md:h-64 bg-slate-200 rounded-md"></div>
                </div>
              ) : (
                <div className="p-6 md:p-8 rounded-lg bg-slate-50 border border-dashed border-slate-300 w-full">
                  <h3 className="font-semibold mb-4 text-slate-700 flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-amber-500" />
                    Team Chemistry
                  </h3>
                  <p className="text-slate-600 text-base mb-4">No chemistry data is available for this team. The data needs to be generated first.</p>
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <h4 className="text-base font-medium text-amber-800 flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Admin Action Required
                    </h4>
                    <ol className="text-sm text-amber-700 list-decimal pl-5 space-y-1">
                      <li>Ensure the <code className="bg-amber-100 px-1.5 py-0.5 rounded">team_chemistry</code> table exists in the database</li>
                      <li>Run <code className="bg-amber-100 px-1.5 py-0.5 rounded">node scripts/update-player-scores.js</code> to generate chemistry data</li>
                      <li>Refresh this page to see the team chemistry meter</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Insights - Now in a row below */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 border-t border-slate-100 mt-6 md:mt-8">
              <div className="p-4 md:p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
                <h3 className="font-semibold mb-3 md:mb-4 text-slate-800 text-base md:text-lg">Season Performance</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-blue-100 bg-opacity-50 border-2 border-blue-200 mr-4">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold">{Math.floor(Math.random() * 30) + 50}%</p>
                    <p className="text-xs md:text-sm text-slate-500">Win Rate</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-50">
                <h3 className="font-semibold mb-2 text-slate-700 text-sm md:text-base">Team Strength</h3>
                <p className="text-xs md:text-sm text-slate-600">
                  {team?.name} has shown exceptional performance in {
                    team?.league?.sport?.toLowerCase() === 'baseball' ? 'pitching and home runs' :
                    team?.league?.sport?.toLowerCase() === 'basketball' ? '3-point shooting and rebounding' :
                    team?.league?.sport?.toLowerCase() === 'football' ? 'rushing and defense' :
                    'key performance metrics'
                  } this season.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-50 md:col-span-2 lg:col-span-1">
                <h3 className="font-semibold mb-2 text-slate-700 text-sm md:text-base">Cosmic Influence</h3>
                <p className="text-xs md:text-sm text-slate-600">
                  The {team?.name} are currently under the influence of {
                    ['Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'][Math.floor(Math.random() * 5)]
                  }, suggesting favorable conditions for their upcoming games, especially during {
                    ['full moon', 'waxing moon', 'new moon'][Math.floor(Math.random() * 3)]
                  } periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Upcoming Games */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8 md:mb-12 mt-8"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
          Upcoming Games
        </h2>
        
        {upcomingGames.length > 0 ? (
          <GameCarousel 
            games={upcomingGames
              .filter((game): game is GameWithTeams => (
                  !!game.home_team && 
                  !!game.away_team
                ))
                .map(game => ({
                  ...game,
                  home_team: game.home_team,
                  away_team: game.away_team,
                  astroInfluence: game.astroInfluence || ['Favorable Moon', 'Rising Mars', 'Jupiter Aligned'][Math.floor(Math.random() * 3)],
                  astroEdge: game.astroEdge || Math.random() * 15 + 5
                }))
              }
              defaultLogo="/placeholder-team.png"
              className="mt-6 -ml-5"
            />
          ) : (
            <p className="text-center py-8 text-slate-500">No upcoming games scheduled</p>
          )}
        </motion.div>
        
        {/* Team Roster */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-4 md:mb-6" 
        >
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
            <Users className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
            Team Roster
          </h2>
          
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TeamRoster 
              players={players.map(player => ({
                id: player.id,
                player_id: player.player_id,
                full_name: player.full_name,
                first_name: player.first_name,
                last_name: player.last_name,
                position: player.position,
                number: player.number,
                headshot_url: player.headshot_url,
                is_active: player.is_active,
                team_id: player.team_id,
                team_name: player.team_name,
                stats_batting_hits: player.stats_batting_hits,
                stats_batting_runs: player.stats_batting_runs,
                stats_fielding_assists: player.stats_fielding_assists,
                impact_score: player.impact_score
              }))} 
              teamId={teamId || ''} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamPage;

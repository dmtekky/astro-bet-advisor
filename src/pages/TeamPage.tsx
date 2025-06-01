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
  player_id: string; // Store the original player_id
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
  player_current_team_abbreviation?: string;
  stats_batting_hits?: number | null;
  stats_batting_runs?: number | null;
  stats_fielding_assists?: number | null;
  impact_score?: number | null; // Added impact_score
  astro_influence?: number | null; // Added astro_influence
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
  
  useEffect(() => {
    if (!teamId) {
      setError('No team ID provided');
      setLoading(false);
      return;
    }

    const fetchTeamData = async (): Promise<void> => {
      try {
        setLoading(true);

        // Fetch team data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            league:league_id(*)
          `)
          .eq('id', teamId)
          .single();

        if (teamError) {
          console.error('Error fetching team:', teamError);
          setError(teamError.message);
          setLoading(false);
          return;
        }

        console.log('Team data:', teamData);
        setTeam(teamData);
        
        // Fetch players from Supabase by matching team's external_id with baseball_players.team_id
        console.log('Fetching players for team:', teamData.name, 'abbreviation:', teamData.abbreviation);
        
        // Initialize player variables
        let playersData: any[] = [];
        let playersError: any = null;
        
        try {
          // Query all baseball players and filter by team abbreviation client-side
          // This avoids potential issues with Supabase filter formatting
          const { data, error } = await supabase
            .from('baseball_players')
            .select<'*', Player>('*'); // Specify Player type for select
          const allPlayers: Player[] = data || [];
          
          if (error) {
            console.error('Error fetching players:', error.message);
            playersError = error;
          } else if (!allPlayers || allPlayers.length === 0) {
            console.log('No players found in database');
          } else {
            // Filter players client-side where either abbreviation field matches
            const playersForTeam = allPlayers.filter(player => {
              // Safely access fields that might not exist
              const currentTeamAbbr = player.player_current_team_abbreviation as string | null;
              const teamAbbr = (player as any).team_abbreviation as string | null;
              const abbreviation = teamData.abbreviation.toUpperCase();
              
              // Match either abbreviation field with case-insensitive comparison
              return (currentTeamAbbr && currentTeamAbbr.toUpperCase() === abbreviation) || 
                     (teamAbbr && teamAbbr.toUpperCase() === abbreviation);
            });
            
            // Sort players by hits (descending) and then by last name (ascending)
            playersData = playersForTeam.sort((a, b) => {
              // Convert hits to numbers, defaulting to 0 if not available
              const hitsA = Number(a.stats_batting_hits) || 0;
              const hitsB = Number(b.stats_batting_hits) || 0;
              
              // Sort by hits in descending order
              if (hitsA > hitsB) return -1;
              if (hitsA < hitsB) return 1;
              
              // If hits are equal, sort by last name
              return ((a.last_name || '') as string).localeCompare((b.last_name || '') as string);
            });
            
            console.log('Players found for team:', teamData.abbreviation, ':', playersData.length);
            
            if (playersData.length > 0) {
              // Log first few player names for debugging
              playersData.slice(0, 3).forEach(player => {
                console.log('Player:', player.full_name, 
                          'Current Team Abbr:', player.player_current_team_abbreviation,
                          'Team Abbr:', (player as any).team_abbreviation);
              });
            }
          }
        } catch (error) {
          console.error('Exception while fetching players:', error);
          playersError = { message: String(error) };
        }

        console.log('Players found for team:', teamData.name, '(abbreviation:', teamData.abbreviation, '):', playersData?.length || 0);
        
        // If still no results, log a warning
        if (!playersData || playersData.length === 0) {
          console.warn('No players found for team after all search methods');
          playersData = [];
          playersError = null;
        }
        
        console.log('Final players data count:', playersData?.length || 0);

        if (playersError) {
          console.error('Error fetching players from Supabase:', playersError);
          toast({
            title: "Error fetching players",
            description: playersError.message,
            variant: "destructive",
          });
          setPlayers([]); // Clear players on error
          setTopPlayers([]); // Clear top players on error
        } else if (playersData && playersData.length > 0) {
          console.log('Processing player data:', playersData[0]);
          const typedPlayers = playersData.map((p: any) => {
            // Calculate impact score if not provided
            const calculatedImpactScore = p.impact_score !== undefined && p.impact_score !== null 
              ? p.impact_score 
              : calculateImpactScore({
                  stats_batting_hits: p.stats_batting_hits,
                  stats_batting_runs: p.stats_batting_runs,
                  stats_fielding_assists: p.stats_fielding_assists
                });

            const player: Player = {
              id: String(p.player_id || p.id || ''),
              player_id: String(p.player_id || ''),
              full_name: p.player_full_name || `${p.player_first_name || ''} ${p.player_last_name || ''}`.trim() || `Player ID: ${p.player_id || p.id || 'Unknown'}`,
              first_name: p.player_first_name || '',
              last_name: p.player_last_name || '',
              headshot_url: p.player_official_image_src || p.headshot_url || '/placeholder-player.png',
              position: p.player_primary_position || p.position || 'Unknown',
              number: p.player_jersey_number || p.number || 0,
              team_id: p.team_id ? String(p.team_id) : null,
              birth_date: p.player_birth_date || p.birth_date || null,
              is_active: p.player_current_roster_status !== 'Inactive',
              player_current_team_abbreviation: p.player_current_team_abbreviation || p.team_abbreviation || null,
              // Add optional properties if they exist
              ...(p.team_name && { team_name: p.team_name }),
              ...(p.team_abbreviation && { team_abbreviation: p.team_abbreviation }),
              ...(p.stats_batting_hits !== undefined && { stats_batting_hits: p.stats_batting_hits }),
              ...(p.stats_batting_runs !== undefined && { stats_batting_runs: p.stats_batting_runs }),
              ...(p.stats_fielding_assists !== undefined && { stats_fielding_assists: p.stats_fielding_assists }),
              ...(p.impact_score !== undefined && { impact_score: p.impact_score }),
              ...(p.astro_influence_score !== undefined && { astro_influence: p.astro_influence_score }), // Add astro influence from database
              impact_score: calculatedImpactScore
            };
            
            // Handle number conversion safely
            if (p.number !== undefined && p.number !== null) {
              const parsedNum = typeof p.number === 'string' 
                ? parseInt(p.number, 10) 
                : Number(p.number);
              if (!isNaN(parsedNum)) {
                player.number = parsedNum;
              }
            } else if (p.player_jersey_number !== undefined && p.player_jersey_number !== null) {
              const parsedNum = typeof p.player_jersey_number === 'string'
                ? parseInt(p.player_jersey_number, 10)
                : Number(p.player_jersey_number);
              if (!isNaN(parsedNum)) {
                player.number = parsedNum;
              }
            }
            
            return player;
          });
          
          console.log('Mapped players:', typedPlayers.length);
          
          // Update database with calculated impact scores for players that don't have them
          const updatePromises = typedPlayers.map(async (player, index) => {
            const originalPlayer = playersData[index];
            if (player.impact_score !== undefined && player.impact_score !== null && 
                (originalPlayer.impact_score === undefined || originalPlayer.impact_score === null || player.impact_score !== originalPlayer.impact_score)) {
              try {
                const { error } = await supabase
                  .from('baseball_players')
                  .update({ impact_score: player.impact_score })
                  .eq('id', player.id);
                
                if (error) {
                  console.error(`Error updating impact score for player ${player.full_name}:`, error);
                } else {
                  console.log(`Updated impact score for ${player.full_name}: ${player.impact_score}`);
                }
              } catch (err) {
                console.error(`Exception updating impact score for player ${player.full_name}:`, err);
              }
            }
          });
          
          // Wait for all updates to complete
          await Promise.all(updatePromises);
          
          setPlayers(typedPlayers);
          
          // Determine top players by position
          const sortedPlayers = [...typedPlayers].sort((a, b) => {
            const getPosValue = (pos?: string) => {
              if (!pos) return 0;
              const posLower = pos.toLowerCase();
              // Baseball positions prioritization (using primary_position)
              if (posLower.includes('pitcher') || posLower === 'p') return 10;
              if (posLower.includes('catcher') || posLower === 'c') return 9;
              if (posLower.includes('shortstop') || posLower === 'ss') return 8;
              if (posLower.includes('first') || posLower === '1b') return 7;
              if (posLower.includes('second') || posLower === '2b') return 6;
              if (posLower.includes('third') || posLower === '3b') return 5;
              if (posLower.includes('outfield') || posLower.includes('of')) return 4;
              return 3; // Default for other positions
            };
            return getPosValue(b.primary_position) - getPosValue(a.primary_position);
          });
          // Show top 4 players instead of 3
          setTopPlayers(sortedPlayers.slice(0, 4));
          
          // Fetch team chemistry data using fetch API with proper typing
          try {
            setChemistryLoading(true);
            
            // First, try to get the team's external ID if available
            const teamExternalId = teamData.external_id || teamData.id;
            const teamAbbreviation = teamData.abbreviation;
            
            console.log(`Fetching chemistry data for team: ${teamData.name} (ID: ${teamId}, External ID: ${teamExternalId}, Abbrev: ${teamAbbreviation})`);
            
            // Build the query parameters
            const queryParams = new URLSearchParams({
              select: '*',
              or: `team_id.eq.${teamId},team_id.eq.${teamExternalId}${teamAbbreviation ? `,team_abbreviation.eq.${teamAbbreviation}` : ''}`,
              limit: '1'
            });
            
            console.log('Query params:', queryParams.toString());
            
            // Use fetch API to get the chemistry data with proper typing
            const response = await fetch(
              `${import.meta.env.PUBLIC_SUPABASE_URL}/rest/v1/team_chemistry?${queryParams}`,
              {
                headers: {
                  'apikey': import.meta.env.PUBLIC_SUPABASE_KEY || '',
                  'Authorization': `Bearer ${import.meta.env.PUBLIC_SUPABASE_KEY || ''}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/vnd.pgrst.object+json'
                }
              }
            );

            const responseText = await response.text();
            console.log('Raw chemistry response:', response.status, response.statusText, responseText);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            let chemistryData;
            try {
              chemistryData = responseText ? JSON.parse(responseText) : null;
              // If we got a single object instead of an array, wrap it in an array
              if (chemistryData && !Array.isArray(chemistryData)) {
                chemistryData = [chemistryData];
              }
            } catch (parseError) {
              console.error('Error parsing JSON response:', parseError, 'Response:', responseText);
              throw new Error('Invalid JSON response from server');
            }
            
            console.log('Parsed chemistry data:', chemistryData);
            
            if (chemistryData && chemistryData.length > 0) {
              const data = chemistryData[0];
              console.log('Found chemistry data:', data);
              
              // Helper function to safely parse JSON fields
              const safeJsonParse = (json: any, defaultValue: any = {}) => {
                if (!json) return defaultValue;
                if (typeof json === 'object') return json;
                try {
                  return JSON.parse(json);
                } catch (e) {
                  console.error('Error parsing JSON field:', e);
                  return defaultValue;
                }
              };
              
              const elements = safeJsonParse(data.elements, { fire: 25, earth: 25, air: 25, water: 25, balance: 50 });
              const aspects = safeJsonParse(data.aspects, { harmonyScore: 50, challengeScore: 20, netHarmony: 50 });
              
              // Ensure all required fields are present with proper defaults
              const chemistry = {
                score: data.score || data.overall_score || 50,
                elements: {
                  fire: elements?.fire || 25,
                  earth: elements?.earth || 25,
                  air: elements?.air || 25,
                  water: elements?.water || 25,
                  balance: elements?.balance || 50
                },
                aspects: {
                  harmonyScore: aspects?.harmonyScore || 50,
                  challengeScore: aspects?.challengeScore || 20,
                  netHarmony: aspects?.netHarmony || 50
                },
                calculatedAt: data.calculated_at || data.last_updated || new Date().toISOString()
              };
              
              console.log('Setting chemistry state:', chemistry);
              // Ensure the chemistry object matches the expected type
              setChemistry({
                ...chemistry,
                elements: {
                  fire: Number(chemistry.elements.fire) || 25,
                  earth: Number(chemistry.elements.earth) || 25,
                  air: Number(chemistry.elements.air) || 25,
                  water: Number(chemistry.elements.water) || 25,
                  balance: Number(chemistry.elements.balance) || 50
                },
                aspects: {
                  harmonyScore: Number(chemistry.aspects.harmonyScore) || 50,
                  challengeScore: Number(chemistry.aspects.challengeScore) || 20,
                  netHarmony: Number(chemistry.aspects.netHarmony) || 50
                }
              });
            } else {
              console.log('No chemistry data found for team. Using default values.');
              // Set default values if no data found
              const defaultChemistry = {
                score: 50,
                elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
                aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
                calculatedAt: new Date().toISOString()
              };
              console.log('Setting default chemistry:', defaultChemistry);
              setChemistry(defaultChemistry);
            }
          } catch (err) {
            console.error('Error fetching chemistry data:', err);
          } finally {
            setChemistryLoading(false);
          }
        } else {
          // No players found or playersData is null
          setPlayers([]);
          setTopPlayers([]);
          setChemistryLoading(false);
        }

        // Fetch upcoming games with proper type handling
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            id,
            game_date,
            game_time_utc,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            home_team:home_team_id(id, name, abbreviation, logo_url, city),
            away_team:away_team_id(id, name, abbreviation, logo_url, city)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .gte('game_time_utc', new Date().toISOString())
          .order('game_time_utc', { ascending: true })
          .limit(6);

        if (gamesError) {
          console.error('Error fetching games:', gamesError);
          toast({
            title: 'Error loading games',
            description: gamesError.message,
            variant: 'destructive',
          });
        } else if (gamesData) {
          console.log('Fetched upcoming games:', gamesData);
          
          // Process games data to ensure it matches the Game type
          // Filter out error responses and ensure we have valid game data
          const processedGames = gamesData
            .filter((item): item is GameData => {
              // Check if this is a valid game object with required properties
              return typeof item === 'object' && 
                item !== null && 
                'id' in item && 
                !('error' in item);
            })
            .map((gameData: GameData): Game => {
            // Safely extract home team data
            const homeTeam: Team | null = gameData.home_team && 
              typeof gameData.home_team === 'object' && 
              !('error' in gameData.home_team)
                ? {
                    id: String(gameData.home_team.id || ''),
                    name: String(gameData.home_team.name || 'Unknown Team'),
                    abbreviation: String(gameData.home_team.abbreviation || 'TBD'),
                    city: String(gameData.home_team.city || 'Unknown'),
                    logo_url: gameData.home_team.logo_url,
                    primary_color: gameData.home_team.primary_color || '#000000',
                    secondary_color: gameData.home_team.secondary_color || '#FFFFFF',
                    league_id: String(gameData.home_team.league_id || gameData.league_id || 'unknown'),
                    external_id: String(gameData.home_team.external_id || gameData.home_team.id || '')
                  }
                : null;
            
            // Safely extract away team data
            const awayTeam: Team | null = gameData.away_team && 
              typeof gameData.away_team === 'object' && 
              !('error' in gameData.away_team)
                ? {
                    id: String(gameData.away_team.id || ''),
                    name: String(gameData.away_team.name || 'Unknown Team'),
                    abbreviation: String(gameData.away_team.abbreviation || 'TBD'),
                    city: String(gameData.away_team.city || 'Unknown'),
                    logo_url: gameData.away_team.logo_url,
                    primary_color: gameData.away_team.primary_color || '#000000',
                    secondary_color: gameData.away_team.secondary_color || '#FFFFFF',
                    league_id: String(gameData.away_team.league_id || gameData.league_id || 'unknown'),
                    external_id: String(gameData.away_team.external_id || gameData.away_team.id || '')
                  }
                : null;
            
            // Create the processed game object with all required fields
            const game: Game = {
              id: String(gameData.id || ''),
              game_date: String(gameData.game_date || ''),
              game_time_utc: String(gameData.game_time_utc || ''),
              status: String(gameData.status || 'Scheduled'),
              home_team_id: String(gameData.home_team_id || ''),
              away_team_id: String(gameData.away_team_id || ''),
              home_score: typeof gameData.home_score === 'number' ? gameData.home_score : null,
              away_score: typeof gameData.away_score === 'number' ? gameData.away_score : null,
              home_team: homeTeam,
              away_team: awayTeam,
              league_id: gameData.league_id ? String(gameData.league_id) : 'unknown',
              venue_id: gameData.venue_id ? String(gameData.venue_id) : 'unknown',
              // Include any additional properties with proper type handling
              ...Object.fromEntries(
                Object.entries(gameData)
                  .filter(([key]) => ![
                    'id', 'game_date', 'game_time_utc', 'status', 'home_team_id', 
                    'away_team_id', 'home_score', 'away_score', 'home_team', 'away_team',
                    'league_id', 'venue_id'
                  ].includes(key))
                  .map(([key, value]) => [key, value])
              )
            };
            
            return game;
          });
          
          setUpcomingGames(processedGames);
        }
      } catch (err: any) {
        console.error('Error in team page:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

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
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <Skeleton className="h-16 w-16 rounded-full mr-4" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          </div>
          
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
      <div className="container mx-auto">
        {/* Navigation */}
        <Button 
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to League
        </Button>
        
        {/* Team Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center md:items-start mb-12 p-6 bg-white rounded-lg shadow-sm"
          style={{ borderLeft: `4px solid ${teamColors.primary}` }}
        >
          <img 
            src={team?.logo_url || '/placeholder-team.png'} 
            alt={team?.name || 'Team'}
            className="w-32 h-32 mb-4 md:mb-0 md:mr-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-team.png';
            }}
          />
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold">{team?.name}</h1>
            <p className="text-slate-500 mb-2">{team?.city}</p>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
              <Badge 
                variant="secondary"
                className="text-xs px-2 py-1 bg-slate-100"
              >
                {team?.abbreviation || 'N/A'}
              </Badge>
              
              {team?.league?.name && (
                <Badge 
                  variant="outline"
                  className="text-xs px-2 py-1"
                  style={{ borderColor: teamColors.secondary, color: teamColors.primary }}
                >
                  {team.league.name}
                </Badge>
              )}
            </div>
            
            <p className="text-slate-600">
              Home Venue: {team?.venue || 'N/A'}
            </p>
          </div>
        </motion.div>
        
        {/* Top Players */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Star className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Top Players
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 justify-items-center">
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
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Info className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Team Insights
          </h2>
          
          <Card className="bg-white w-full">
            <CardContent className="p-0">
              {/* Team Chemistry Meter - Full Width */}
              <div className="w-full">
                {chemistry && !chemistryLoading ? (
                  <TeamChemistryMeter chemistry={chemistry} className="w-full" />
                ) : chemistryLoading ? (
                  <div className="p-8 rounded-lg bg-slate-50 animate-pulse w-full">
                    <h3 className="font-semibold mb-4 text-slate-700 text-lg">Team Chemistry</h3>
                    <div className="w-full h-64 bg-slate-200 rounded-md"></div>
                  </div>
                ) : (
                  <div className="p-8 rounded-lg bg-slate-50 border border-dashed border-slate-300 w-full">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 border-t border-slate-100">
                <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
                  <h3 className="font-semibold mb-4 text-slate-800 text-lg">Season Performance</h3>
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-100 bg-opacity-50 border-2 border-blue-200 mr-4">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{Math.floor(Math.random() * 30) + 50}%</p>
                      <p className="text-sm text-slate-500">Win Rate</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-50">
                  <h3 className="font-semibold mb-2 text-slate-700">Team Strength</h3>
                  <p className="text-sm text-slate-600">
                    {team?.name} has shown exceptional performance in {
                      team?.league?.sport?.toLowerCase() === 'baseball' ? 'pitching and home runs' :
                      team?.league?.sport?.toLowerCase() === 'basketball' ? '3-point shooting and rebounding' :
                      team?.league?.sport?.toLowerCase() === 'football' ? 'rushing and defense' :
                      'key performance metrics'
                    } this season.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-50 md:col-span-2 lg:col-span-1">
                  <h3 className="font-semibold mb-2 text-slate-700">Cosmic Influence</h3>
                  <p className="text-sm text-slate-600">
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
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <CalendarIcon className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
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
              className="mt-6"
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
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Team Roster
          </h2>
          
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
        </motion.div>
      </div>
    </div>
  );
};

export default TeamPage;

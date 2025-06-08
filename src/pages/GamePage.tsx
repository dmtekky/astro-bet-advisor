import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, BarChart2, Users, Clock, Calendar, MapPin } from 'lucide-react';
import type { Game, Team as TeamType, Player } from '@/types';

interface DetailedGame extends Game {
  home_team: TeamType | null;
  away_team: TeamType | null;
  venue: any | null;
  league: any | null;
}

interface PlayerSeasonStats {
  season?: string;
  games_played?: number;
  batting_average?: number;
  home_runs?: number;
  rbi?: number;
  wins?: number;
  era?: number;
  strikeouts?: number;
  [key: string]: any; // Allow for additional stats
}

interface PlayerWithStats extends Player {
  stats?: PlayerSeasonStats | null;
  impactScore?: number;
}

// Extend the TeamType from the types import to ensure consistency
interface Team extends TeamType {
  // Add any additional properties specific to this component
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

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameState | null>(null);
  const [homeTeam, setHomeTeam] = useState<any | null>(null);
  const [awayTeam, setAwayTeam] = useState<any | null>(null);
  const [venue, setVenue] = useState<any | null>(null);
  const [league, setLeague] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [homePlayers, setHomePlayers] = useState<PlayerWithStats[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerWithStats[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

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
            status: gameData.status || 'scheduled',
            created_at: gameData.created_at || new Date().toISOString(),
            updated_at: gameData.updated_at || new Date().toISOString()
          };
          
          // Set the game state
          setGame(safeGameData);
          setHomeTeam(gameData.home_team || null);
          setAwayTeam(gameData.away_team || null);
          setVenue(gameData.venue || null);
          setLeague(gameData.league || null);
        }
        
        // Fetch players for both teams
        if (gameData.home_team && gameData.home_team.abbreviation && gameData.away_team && gameData.away_team.abbreviation) {
          await fetchTeamRosters(
            gameData.home_team.abbreviation,
            gameData.away_team.abbreviation
          );
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
      if (!homeTeamAbbr || !awayTeamAbbr) {
        console.warn('Missing team abbreviations');
        return;
      }

      console.log(`[GamePage] Fetching players for home: ${homeTeamAbbr}, away: ${awayTeamAbbr}`);
      
      // First, fetch all teams to map team names to abbreviations
      const { data: allTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, abbreviation, city');
      
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        setHomePlayers([]);
        setAwayPlayers([]);
        return;
      }

      // Create a map of team names to abbreviations from the database
      const dbTeamNameToAbbr = new Map<string, string>();
      
      // Process team data with proper type safety
      if (Array.isArray(allTeams)) {
        allTeams.forEach((team: unknown) => {
          // Skip invalid team objects
          if (!team || typeof team !== 'object') return;
          
          // Type guard to ensure the object has the required properties
          if ('name' in team && 'abbreviation' in team) {
            // Safely extract and validate team properties
            const name = team.name;
            const abbreviation = team.abbreviation;
            const city = 'city' in team ? team.city : undefined;
            
            // Ensure required fields are valid strings
            const teamName = typeof name === 'string' ? name.trim() : '';
            const teamAbbr = typeof abbreviation === 'string' ? abbreviation.trim() : '';
            const teamCity = typeof city === 'string' ? city.trim() : '';
            
            // Add mapping for team name to abbreviation if valid
            if (teamName && teamAbbr) {
              dbTeamNameToAbbr.set(teamName.toLowerCase(), teamAbbr.toUpperCase());
              
              // Also map city + name to abbreviation if city exists
              if (teamCity) {
                const fullName = `${teamCity} ${teamName}`.toLowerCase();
                dbTeamNameToAbbr.set(fullName, teamAbbr.toUpperCase());
              }
            }
          }
        });
      }
      // Log all keys in the dbTeamNameToAbbr map
      console.log('[GamePage] Database team mappings:', Array.from(dbTeamNameToAbbr.entries()));

      // First, let's check the structure of the players table
      console.log('[GamePage] Fetching players table structure...');
      
      try {
        // Try to fetch a single player to see the structure
        const { data: samplePlayer, error: sampleError } = await supabase
          .from('players')
          .select('*')
          .limit(1)
          .single();
          
        if (sampleError) {
          console.error('Error fetching sample player:', sampleError);
        } else {
          console.log('[GamePage] Sample player structure:', Object.keys(samplePlayer || {}));
        }
      } catch (e) {
        console.error('Error checking players table structure:', e);
      }
      
      // Now fetch all players without filtering to see what we get
      console.log('[GamePage] Fetching all players...');
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*');
      
      console.log('[GamePage] Fetched players:', allPlayers);
      
      // Additional client-side filtering as a safeguard
      const validPlayers = (allPlayers || []).filter(player => {
        if (!player) return false;
        
        // Type assertion to handle potential schema differences
        const playerWithTeam = player as { team_id?: string; current_team_id?: string; [key: string]: any };
        
        // Check for both team_id and current_team_id to handle potential schema differences
        const teamId = playerWithTeam.team_id || playerWithTeam.current_team_id;
        return teamId && 
               typeof teamId === 'string' && 
               teamId.trim() !== '';
      });

      if (playersError) {
        console.error('Error fetching players:', playersError);
        setHomePlayers([]);
        setAwayPlayers([]);
        return;
      }

      console.log(`[GamePage] Fetched ${allPlayers?.length} players, ${validPlayers.length} with valid team IDs`);
      
      if (validPlayers.length === 0) {
        console.warn('No valid players found with team assignments');
        console.warn('Sample of player data (first 5):', allPlayers?.slice(0, 5));
        setHomePlayers([]);
        setAwayPlayers([]);
        return;
      }

      // Log all unique strteam values from players
      const uniqueStrTeams = Array.from(new Set(allPlayers.map((p: any) => p.strteam && p.strteam.trim()).filter(Boolean)));
      console.log('[GamePage] Unique strteam values from players:', uniqueStrTeams);

      // Comprehensive team name to abbreviation mapping
      const teamAbbrMap: Record<string, string> = {
        // AL East
        'new york yankees': 'NYY', 'yankees': 'NYY', 'nyy': 'NYY', 'bronx bombers': 'NYY',
        'boston red sox': 'BOS', 'red sox': 'BOS', 'bos': 'BOS', 'sox': 'BOS',
        'tampa bay rays': 'TB', 'rays': 'TB', 'tbr': 'TB', 'tampa': 'TB', 'tampa bay': 'TB',
        'toronto blue jays': 'TOR', 'blue jays': 'TOR', 'tor': 'TOR', 'jays': 'TOR',
        'baltimore orioles': 'BAL', 'orioles': 'BAL', 'bal': 'BAL', 'os': 'BAL',
        
        // AL Central
        'chicago white sox': 'CWS', 'white sox': 'CWS', 'cws': 'CWS', 'pale hose': 'CWS',
        'cleveland guardians': 'CLE', 'guardians': 'CLE', 'cle': 'CLE', 'tribe': 'CLE',
        'detroit tigers': 'DET', 'tigers': 'DET', 'det': 'DET', 'motor city': 'DET',
        'kansas city royals': 'KC', 'royals': 'KC', 'kcr': 'KC', 'kc': 'KC',
        'minnesota twins': 'MIN', 'twins': 'MIN', 'min': 'MIN', 'twin cities': 'MIN',
        
        // AL West
        'houston astros': 'HOU', 'astros': 'HOU', 'hou': 'HOU', 'stros': 'HOU',
        'los angeles angels': 'LAA', 'angels': 'LAA', 'laa': 'LAA', 'halos': 'LAA',
        'oakland athletics': 'OAK', 'athletics': 'OAK', 'oak': 'OAK', 'as': 'OAK',
        'seattle mariners': 'SEA', 'mariners': 'SEA', 'sea': 'SEA', 'ms': 'SEA',
        'texas rangers': 'TEX', 'rangers': 'TEX', 'tex': 'TEX', 'strangers': 'TEX',
        
        // NL East
        'atlanta braves': 'ATL', 'braves': 'ATL', 'atl': 'ATL', 'battery': 'ATL',
        'miami marlins': 'MIA', 'marlins': 'MIA', 'mia': 'MIA', 'fish': 'MIA',
        'new york mets': 'NYM', 'mets': 'NYM', 'nym': 'NYM', 'amazins': 'NYM',
        'philadelphia phillies': 'PHI', 'phillies': 'PHI', 'phi': 'PHI', 'phils': 'PHI',
        'washington nationals': 'WSH', 'nationals': 'WSH', 'was': 'WSH', 'nats': 'WSH',
        
        // NL Central
        'chicago cubs': 'CHC', 'cubs': 'CHC', 'chc': 'CHC', 'cubbies': 'CHC',
        'cincinnati reds': 'CIN', 'reds': 'CIN', 'cin': 'CIN', 'redlegs': 'CIN',
        'milwaukee brewers': 'MIL', 'brewers': 'MIL', 'mil': 'MIL', 'brew crew': 'MIL',
        'pittsburgh pirates': 'PIT', 'pirates': 'PIT', 'pit': 'PIT', 'bucs': 'PIT',
        'st louis cardinals': 'STL', 'cardinals': 'STL', 'stl': 'STL', 'cards': 'STL',
        
        // NL West
        'arizona diamondbacks': 'ARI', 'diamondbacks': 'ARI', 'ari': 'ARI', 'dbacks': 'ARI',
        'colorado rockies': 'COL', 'rockies': 'COL', 'col': 'COL', 'rox': 'COL',
        'los angeles dodgers': 'LAD', 'dodgers': 'LAD', 'lad': 'LAD', 'blue crew': 'LAD',
        'san diego padres': 'SD', 'padres': 'SD', 'sdp': 'SD', 'friars': 'SD',
        'san francisco giants': 'SF', 'giants': 'SF', 'sfg': 'SF', 'sf': 'SF', 'gmen': 'SF'
      };

      // Function to normalize team names for comparison
      const normalizeTeamName = (name: string | null | undefined): string => {
        if (!name) return '';
        // Convert to lowercase, trim, and clean up the string
        return String(name)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9 ]/g, '') // Keep only alphanumeric and spaces
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
      };
      
      // Map of team names to their abbreviations
      const teamAbbreviations: Record<string, string> = {
        // American League East
        'baltimore orioles': 'BAL', 'orioles': 'BAL',
        'boston red sox': 'BOS', 'red sox': 'BOS',
        'new york yankees': 'NYY', 'yankees': 'NYY',
        'tampa bay rays': 'TB', 'rays': 'TB',
        'toronto blue jays': 'TOR', 'blue jays': 'TOR',
        
        // American League Central
        'chicago white sox': 'CWS', 'white sox': 'CWS',
        'cleveland guardians': 'CLE', 'guardians': 'CLE',
        'detroit tigers': 'DET', 'tigers': 'DET',
        'kansas city royals': 'KC', 'royals': 'KC',
        'minnesota twins': 'MIN', 'twins': 'MIN',
        
        // American League West
        'houston astros': 'HOU', 'astros': 'HOU',
        'los angeles angels': 'LAA', 'angels': 'LAA',
        'oakland athletics': 'OAK', 'athletics': 'OAK',
        'seattle mariners': 'SEA', 'mariners': 'SEA',
        'texas rangers': 'TEX', 'rangers': 'TEX',
        
        // National League East
        'atlanta braves': 'ATL', 'braves': 'ATL',
        'miami marlins': 'MIA', 'marlins': 'MIA',
        'new york mets': 'NYM', 'mets': 'NYM',
        'philadelphia phillies': 'PHI', 'phillies': 'PHI',
        'washington nationals': 'WAS', 'nationals': 'WAS',
        
        // National League Central
        'chicago cubs': 'CHC', 'cubs': 'CHC',
        'cincinnati reds': 'CIN', 'reds': 'CIN',
        'milwaukee brewers': 'MIL', 'brewers': 'MIL',
        'pittsburgh pirates': 'PIT', 'pirates': 'PIT',
        'st louis cardinals': 'STL', 'cardinals': 'STL',
        
        // National League West
        'arizona diamondbacks': 'ARI', 'diamondbacks': 'ARI',
        'colorado rockies': 'COL', 'rockies': 'COL',
        'los angeles dodgers': 'LAD', 'dodgers': 'LAD',
        'san diego padres': 'SD', 'padres': 'SD',
        'san francisco giants': 'SF', 'giants': 'SF'
      };

      // Function to get team abbreviation from any team identifier
      const getTeamAbbreviation = (teamIdentifier: string | null | undefined): string | null => {
        if (!teamIdentifier) return null;
        
        // First try direct match
        const normalized = normalizeTeamName(teamIdentifier);
        let abbr = teamAbbreviations[normalized];
        
        // If no direct match, try partial matches
        if (!abbr) {
          const matchingKey = Object.keys(teamAbbreviations).find(key => 
            normalized.includes(key) || key.includes(normalized)
          );
          if (matchingKey) {
            abbr = teamAbbreviations[matchingKey];
            console.log(`[DEBUG] Found partial match for ${teamIdentifier} -> ${matchingKey} -> ${abbr}`);
          }
        }
        
        return abbr || null;
      };

      // Filter players by team abbreviation
      const filterPlayersByTeam = (players: any[], targetAbbr: string): any[] => {
        try {
          const targetAbbrUpper = targetAbbr.toUpperCase();
          console.log(`[GamePage] Filtering players for team: ${targetAbbrUpper}`);
          
          // Get all possible variations of the target abbreviation
          const targetVariations = [
            targetAbbrUpper,
            targetAbbr.toLowerCase(),
            ...Object.entries(teamAbbrMap)
              .filter(([_, abbr]) => abbr === targetAbbrUpper)
              .map(([name]) => name)
          ];
          
          console.log(`[GamePage] Target team variations:`, targetVariations);
          
          // Log all unique team identifiers in the players data
          const uniqueTeamIds = new Set<string>();
          players.forEach(p => {
            if (p.team_id) uniqueTeamIds.add(p.team_id);
          });
          
          console.log('[GamePage] All unique team IDs in player data:', Array.from(uniqueTeamIds));
          
          // Get team IDs that match the target abbreviation
          const matchingTeamIds = Array.from(dbTeamNameToAbbr.entries())
            .filter(([_, abbr]) => abbr === targetAbbrUpper)
            .map(([name, _]) => {
              // Type guard to ensure we have valid team data
              if (!allTeams || !Array.isArray(allTeams)) {
                console.warn('No valid team data available');
                return undefined;
              }
              
              interface TeamData {
                id: string;
                name?: string;
                abbreviation?: string;
                city?: string;
              }
              
              const isValidTeam = (t: unknown): t is TeamData => {
                if (!t || typeof t !== 'object') return false;
                const team = t as Record<string, unknown>;
                return (
                  'id' in team && 
                  typeof team.id === 'string' &&
                  (!('name' in team) || typeof team.name === 'string') &&
                  (!('abbreviation' in team) || typeof team.abbreviation === 'string') &&
                  (!('city' in team) || typeof team.city === 'string')
                );
              };
              
              const team = allTeams.find((t) => {
                if (!isValidTeam(t)) return false;
                
                const teamName = t.name?.toLowerCase() || '';
                const teamAbbr = t.abbreviation?.toLowerCase() || '';
                const searchName = name.toLowerCase();
                
                return teamName === searchName || teamAbbr === searchName;
              });
              
              return team && 'id' in team ? team.id : undefined;
            })
            .filter(Boolean);
            
          console.log(`[GamePage] Matching team IDs for ${targetAbbrUpper}:`, matchingTeamIds);

          // First, try to match by team_id or team_abbreviation
          const matchedPlayers = players.filter(player => {
            // Check if player's team_id matches any of the target team IDs
            if (player.team_id && matchingTeamIds.includes(player.team_id)) {
              console.log(`✅ Team ID match: ${player.name} via team_id=${player.team_id}`);
              return true;
            }
            
            // Fallback: Check if team abbreviation matches (if available)
            if (player.team_abbreviation) {
              const playerAbbr = player.team_abbreviation.toUpperCase();
              if (playerAbbr === targetAbbrUpper) {
                console.log(`✅ Team abbreviation match: ${player.name} via team_abbreviation=${player.team_abbreviation}`);
                return true;
              }
            }
            
            return false;
          });
          
          console.log(`[GamePage] Found ${matchedPlayers.length} players for team ${targetAbbrUpper}`);
          
          // If still no players found, try a more aggressive search
          if (matchedPlayers.length === 0) {
            console.log('[GamePage] No players found with standard matching, trying aggressive search...');
            return players.filter(player => {
              const playerStr = JSON.stringify(player).toLowerCase();
              const target = targetAbbrUpper.toLowerCase();
              return playerStr.includes(target) || 
                     (target === 'phi' && playerStr.includes('philadelphia')) ||
                     (target === 'mil' && playerStr.includes('milwaukee'));
            });
          }
          
          return matchedPlayers;
        } catch (error) {
          console.error('Error in filterPlayersByTeam:', error);
          return [];
        }
      };

      // Filter players for each team
      const homePlayersFiltered = filterPlayersByTeam(allPlayers, homeTeamAbbr);
      const awayPlayersFiltered = filterPlayersByTeam(allPlayers, awayTeamAbbr);
      
      // Log sample players for debugging
      if (homePlayersFiltered.length > 0) {
        console.log('Sample home player:', {
          name: homePlayersFiltered[0].full_name || homePlayersFiltered[0].player_full_name,
          team: homePlayersFiltered[0].strteam || homePlayersFiltered[0].team_name,
          id: homePlayersFiltered[0].id
        });
      }
      
      if (awayPlayersFiltered.length > 0) {
        console.log('Sample away player:', {
          name: awayPlayersFiltered[0].full_name || awayPlayersFiltered[0].player_full_name,
          team: awayPlayersFiltered[0].strteam || awayPlayersFiltered[0].team_name,
          id: awayPlayersFiltered[0].id
        });
      }

      console.log(`[GamePage] Found ${homePlayersFiltered.length} home players and ${awayPlayersFiltered.length} away players`);
      // Parse stats JSON and compute impact score
      const parsePlayer = (p: any) => {
        let stats = {};
        if (typeof p.stats === 'string') {
          try { stats = JSON.parse(p.stats); } catch { stats = {}; }
        } else if (typeof p.stats === 'object' && p.stats !== null) {
          stats = p.stats;
        }
        const impactScore = calculatePlayerImpactScore(stats);
        return {
          ...p,
          name: p.full_name || p.player_full_name || `${p.player_first_name || ''} ${p.player_last_name || ''}`.trim() || 'Unknown',
          image: p.player_official_image_src || p.headshot_url || '/placeholder-player.png',
          position: p.player_primary_position || p.position || 'Unknown',
          stats,
          impactScore
        };
      };
      // Sort and take top 3
      const topHomePlayers = homePlayersFiltered.map(parsePlayer)
        .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
        .slice(0, 3);
      const topAwayPlayers = awayPlayersFiltered.map(parsePlayer)
        .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
        .slice(0, 3);
      console.log('[GamePage] Top home players:', topHomePlayers);
      console.log('[GamePage] Top away players:', topAwayPlayers);
      setHomePlayers(topHomePlayers);
      setAwayPlayers(topAwayPlayers);
    } catch (error) {
      console.error('Error in fetchTeamRosters:', error);
      setHomePlayers([]);
      setAwayPlayers([]);
    }
  };
  
  // Calculate player impact score based on stats
  const calculatePlayerImpactScore = (stats?: PlayerSeasonStats | null): number => {
    if (!stats) return 0;
    
    let score = 0;
    
    // Hitting stats
    if (stats.batting_average) score += stats.batting_average * 100;
    if (stats.home_runs) score += stats.home_runs * 5;
    if (stats.rbi) score += stats.rbi * 2;
    
    // Pitching stats
    if (stats.wins) score += stats.wins * 2;
    if (stats.era !== undefined) score += (5 - Math.min(stats.era, 5)) * 3; // Lower ERA is better
    if (stats.strikeouts) score += stats.strikeouts * 0.5;
    
    return parseFloat(score.toFixed(1));
  };
  
  // Format date and time
  const formatGameDateTime = (dateString: string): { date: string; time: string } | 'TBD' => {
    if (!dateString) return 'TBD';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBD';
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return 'TBD';
    }
  };
  
  // Get top players by impact score
  const getTopPlayers = (players: PlayerWithStats[], count: number = 3) => {
    return [...players]
      .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
      .slice(0, count);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
        </Button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
          <p className="text-muted-foreground">The requested game could not be found.</p>
        </div>
      </div>
    );
  }
  
  const { home_team, away_team } = game;
  const gameDateTime = formatGameDateTime(game.start_time || '');
  const topHomePlayers = getTopPlayers(homePlayers);
  const topAwayPlayers = getTopPlayers(awayPlayers);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 hover:bg-accent/50 transition-colors"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> 
          Back to Games
        </Button>

        {/* Venue Information */}
        {game.venue?.name && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-6 mb-8 border border-border/50">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{game.venue.name}</h2>
                <p className="text-muted-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {game.venue.city}, {game.venue.state}
                </p>
              </div>
              <div className="mt-4 md:mt-0 bg-background/80 px-4 py-2 rounded-full text-sm font-medium">
                <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
                  game.status === 'scheduled' ? 'bg-yellow-500' : 
                  game.status === 'in_progress' ? 'bg-green-500' : 
                  'bg-gray-500'}`}>
                </span>
                {game.status === 'scheduled' ? 'Upcoming' : 
                 game.status === 'in_progress' ? 'Live' : 
                 game.status?.replace('_', ' ').toLowerCase() || 'Scheduled'}
              </div>
            </div>
          </div>
        )}

        {/* Game Details */}
        <div className="bg-card rounded-xl shadow-sm border mb-8 overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">{game.league_name || 'Game Details'}</h1>
              <div className="flex items-center justify-center text-muted-foreground text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                {gameDateTime === 'TBD' ? 'Date and time to be determined' : (
                  <>
                    {gameDateTime.date} • {gameDateTime.time}
                  </>
                )}
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
                    <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm group-hover:blur-md -z-10"></div>
                    <Avatar className="w-full h-full transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage 
                        src={home_team?.logo_url || '/team-placeholder.svg'} 
                        alt={`${home_team?.name} logo`}
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/team-placeholder.svg';
                        }}
                      />
                      <AvatarFallback className="text-2xl">
                        {home_team?.name?.charAt(0) || 'H'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h2 className="text-xl font-bold text-center group-hover:text-primary transition-colors">
                    {home_team?.name || 'TBD'}
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
                    <div className="absolute inset-0 bg-purple-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm group-hover:blur-md -z-10"></div>
                    <Avatar className="w-full h-full transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage 
                        src={away_team?.logo_url || '/team-placeholder.svg'} 
                        alt={`${away_team?.name} logo`}
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/team-placeholder.svg';
                        }}
                      />
                      <AvatarFallback className="text-2xl">
                        {away_team?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h2 className="text-xl font-bold text-center group-hover:text-purple-500 transition-colors">
                    {away_team?.name || 'TBD'}
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
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6 text-center">Top Players to Watch</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Home Team Top Players */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                      {home_team?.name || 'Home Team'} Top Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topHomePlayers.length > 0 ? (
                        topHomePlayers.map((player) => (
                          <div key={player.id} className="flex items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
                            <Avatar className="h-14 w-14 mr-4">
                              <AvatarImage 
                                src={player.image || '/player-placeholder.svg'}
                                alt={player.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/player-placeholder.svg';
                                }}
                              />
                              <AvatarFallback>
                                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-medium">{player.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                              </p>
                            </div>
                            {player.stats && (
                              <div className="text-right">
                                <p className="font-medium">
                                  {player.stats.batting_average ? player.stats.batting_average.toFixed(3) : '-'} AVG
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {player.stats.home_runs || 0} HR • {player.stats.rbi || 0} RBI
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No player data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                
                {/* Away Team Top Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/teams/${away_team?.id}`} className="hover:underline">
                        {away_team?.name || 'Away Team'}
                      </Link> Top Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topAwayPlayers.length > 0 ? (
                        topAwayPlayers.map((player) => (
                          <div key={player.id} className="flex items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
                            <Avatar className="h-14 w-14 mr-4">
                              <AvatarImage 
                                src={player.image || '/player-placeholder.svg'}
                                alt={player.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/player-placeholder.svg';
                                }}
                              />
                              <AvatarFallback>
                                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-medium">{player.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                              </p>
                            </div>
                            {player.stats && (
                              <div className="text-right">
                                <p className="font-medium">
                                  {player.stats.batting_average ? player.stats.batting_average.toFixed(3) : '-'} AVG
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {player.stats.home_runs || 0} HR • {player.stats.rbi || 0} RBI
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No player data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Full Rosters
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-6 pt-8">
              <div className="space-y-6">
                {/* Game Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Game Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {gameDateTime !== 'TBD' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-medium">{gameDateTime.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time</span>
                            <span className="font-medium">{gameDateTime.time}</span>
                          </div>
                        </>
                      )}
                      {game.venue?.name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Venue</span>
                          <span className="font-medium">{game.venue.name}</span>
                        </div>
                      )}
                      {game.venue?.city && game.venue?.state && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-medium">{game.venue.city}, {game.venue.state}</span>
                        </div>
                      )}
                      {game.league_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">League</span>
                          <span className="font-medium">{game.league_name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Odds */}
                {(game.home_odds || game.away_odds) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Betting Odds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                          <div>
                            <Link to={`/teams/${home_team?.id}`} className="font-medium hover:underline">
                              {home_team?.name || 'Home'}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {home_team?.record || '0-0'}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-primary">
                            {game.home_odds ? `+${game.home_odds}` : '-'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                          <div>
                            <Link to={`/teams/${away_team?.id}`} className="font-medium hover:underline">
                              {away_team?.name || 'Away'}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {away_team?.record || '0-0'}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-purple-500">
                            {game.away_odds ? `+${game.away_odds}` : '-'}
                          </span>
                        </div>
                        
                        {(game.spread || game.over_under) && (
                          <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            {game.spread && (
                              <div className="bg-background p-3 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-1">Spread</p>
                                <p className="text-lg font-semibold">
                                  {game.spread > 0 ? `+${game.spread}` : game.spread}
                                </p>
                              </div>
                            )}
                            {game.over_under && (
                              <div className="bg-background p-3 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-1">Over/Under</p>
                                <p className="text-lg font-semibold">{game.over_under}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="players" className="p-6 pt-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Home Team Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/teams/${home_team?.id}`} className="hover:underline">
                        {home_team?.name || 'Home Team'}
                      </Link> Players
                    </CardTitle>
                    <CardDescription>Starting lineup and key players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {homePlayers.length > 0 ? (
                      <div className="space-y-3">
                        {homePlayers.map((player) => (
                          <div key={player.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={player.image} alt={player.name} />
                              <AvatarFallback>
                                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                              </p>
                            </div>
                            {player.stats && (
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {player.stats.games_played || 0} GP
                                </p>
                                {player.stats.batting_average !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.stats.batting_average.toFixed(3)} AVG
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No player data available</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Away Team Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/teams/${away_team?.id}`} className="hover:underline">
                        {away_team?.name || 'Away Team'}
                      </Link> Players
                    </CardTitle>
                    <CardDescription>Starting lineup and key players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {awayPlayers.length > 0 ? (
                      <div className="space-y-3">
                        {awayPlayers.map((player) => (
                          <div key={player.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={player.image} alt={player.name} />
                              <AvatarFallback>
                                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                              </p>
                            </div>
                            {player.stats && (
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {player.stats.games_played || 0} GP
                                </p>
                                {player.stats.batting_average !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.stats.batting_average.toFixed(3)} AVG
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No player data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GamePage;

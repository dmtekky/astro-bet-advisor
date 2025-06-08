// sync-clean.mjs - ES MODULE VERSION - 2025-05-27
console.log('🚀 Starting MLB Games Sync (ES Module version)');

// --- Imports ---
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - point to the .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

// Debug: Log the environment variables
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'Found' : 'Missing');
console.log('Supabase Key:', process.env.VITE_SUPABASE_KEY ? 'Found' : 'Missing');

// Supabase setup
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// TheSportsDB API
const API_KEY = '502451';
const LEAGUE_ID = '4424'; // MLB

// Team name mapping (API -> DB)
const TEAM_NAMES = {
  'Athletics': 'Oakland Athletics',
  'D-backs': 'Arizona Diamondbacks',
  'White Sox': 'Chicago White Sox',
  'Cubs': 'Chicago Cubs',
  'Reds': 'Cincinnati Reds',
  'Guardians': 'Cleveland Guardians',
  'Rockies': 'Colorado Rockies',
  'Tigers': 'Detroit Tigers',
  'Astros': 'Houston Astros',
  'Royals': 'Kansas City Royals',
  'Angels': 'Los Angeles Angels',
  'Dodgers': 'Los Angeles Dodgers',
  'Marlins': 'Miami Marlins',
  'Brewers': 'Milwaukee Brewers',
  'Twins': 'Minnesota Twins',
  'Mets': 'New York Mets',
  'Yankees': 'New York Yankees',
  'Phillies': 'Philadelphia Phillies',
  'Pirates': 'Pittsburgh Pirates',
  'Padres': 'San Diego Padres',
  'Giants': 'San Francisco Giants',
  'Mariners': 'Seattle Mariners',
  'Cardinals': 'St. Louis Cardinals',
  'Rays': 'Tampa Bay Rays',
  'Rangers': 'Texas Rangers',
  'Blue Jays': 'Toronto Blue Jays',
  'Nationals': 'Washington Nationals',
  'Braves': 'Atlanta Braves',
  'Orioles': 'Baltimore Orioles',
  'Red Sox': 'Boston Red Sox'
};

// --- Main Function ---
async function syncGames() {
  try {
    console.log('🔍 Fetching MLB league ID...');
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id')
      .eq('name', 'MLB')
      .single();

    if (leagueError || !league) throw new Error('MLB league not found');
    console.log(`✅ Found MLB league (ID: ${league.id})`);

    // Get all teams
    console.log('🔍 Fetching teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('league_id', league.id);

    if (teamsError) throw teamsError;
    console.log(`✅ Found ${teams.length} teams`);

    // Fetch the 2025 MLB season schedule from MLB Stats API
    console.log('🔍 Fetching 2025 MLB season schedule from MLB Stats API...');
    const response = await axios.get(
      'https://statsapi.mlb.com/api/v1/schedule',
      {
        params: {
          sportId: 1, // MLB
          season: 2025,
          gameType: 'R', // Regular season games
          hydrate: 'team,linescore,game(content(summary)),decisions'
        },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        }
      }
    );
    
    // Debug: Log the API response summary
    const gameCount = response.data?.totalGames || 0;
    console.log('🔍 MLB Stats API Response:', {
      status: response.status,
      statusText: response.statusText,
      totalGames: gameCount,
      dates: response.data?.dates?.length || 0
    });
    
    // Helper function to map MLB API status to DB status
    function mapMlbStatusToDbStatus(apiStatus) {
      // apiStatus is like { abstractGameState: "Final", codedGameState: "F", detailedState: "Final", statusCode: "F", ... }
      switch (apiStatus.abstractGameState) {
        case 'Final': return 'completed';
        case 'Live': return 'live'; // Ensure your DB schema/enum supports 'live'
        case 'Preview': return 'scheduled';
        default:
          // More specific checks for postponements, cancellations, etc.
          if (apiStatus.statusCode === 'P' || apiStatus.detailedState?.toLowerCase().includes('postponed')) {
            return 'postponed';
          }
          if (apiStatus.statusCode === 'C' || apiStatus.detailedState?.toLowerCase().includes('cancelled')) {
            return 'cancelled';
          }
          return 'scheduled'; // Default status
      }
    }

    // Transform the MLB API response
    const games = [];
    if (response.data?.dates) {
      response.data.dates.forEach(dateEntry => {
        if (dateEntry.games) {
          dateEntry.games.forEach(apiGame => {
            const rawApiGameDate = apiGame.gameDate;
            if (rawApiGameDate && typeof rawApiGameDate === 'string' && rawApiGameDate.endsWith('Z')) {
              const d = new Date(rawApiGameDate);
              if (!isNaN(d.getTime())) {
                games.push({
                  idEvent: apiGame.gamePk.toString(),
                  apiGameDateTime: rawApiGameDate, // Store original full ISO UTC string
                  strSeason: apiGame.season ? apiGame.season.toString() : '2025',
                  strHomeTeam: apiGame.teams.home.team.name,
                  strAwayTeam: apiGame.teams.away.team.name,
                  intHomeScore: typeof apiGame.teams.home.score === 'number' ? apiGame.teams.home.score : null,
                  intAwayScore: typeof apiGame.teams.away.score === 'number' ? apiGame.teams.away.score : null,
                  strStatus: mapMlbStatusToDbStatus(apiGame.status),
                  gameType: apiGame.gameType // e.g., 'R', 'S', 'P', 'F', 'D', 'L', 'W'
                });
              } else {
                console.warn(`[transform] Game ${apiGame.gamePk} has invalid date format: '${rawApiGameDate}'. Skipping.`);
              }
            } else {
              console.warn(`[transform] Game ${apiGame.gamePk} has missing, malformed, or non-UTC date: '${rawApiGameDate}'. Skipping.`);
            }
          });
        }
      });
    }
    
    console.log(`🎯 Found ${games.length} processable games for the ${response.data?.season || '2025'} season`);

    let success = 0;
    let skipped = 0;
    let errors = 0;

    // Process each game
    for (const game of games) {
      try {
        if (!game.idEvent || !game.strHomeTeam || !game.strAwayTeam) {
          console.log('⏭️  Skipping - missing required fields');
          skipped++;
          continue;
        }

        // Map team names
        const homeTeamName = TEAM_NAMES[game.strHomeTeam] || game.strHomeTeam;
        const awayTeamName = TEAM_NAMES[game.strAwayTeam] || game.strAwayTeam;

        // Debug: Log all available teams if first iteration
        if (success + skipped + errors === 0) {
          console.log('\n🔍 Available teams in database:');
          teams.forEach(t => console.log(`- ${t.name}`));
          console.log('\n🔍 Teams from API:');
          console.log(`- Home: ${game.strHomeTeam} (mapped to: ${homeTeamName})`);
          console.log(`- Away: ${game.strAwayTeam} (mapped to: ${awayTeamName})`);
        }

        // More flexible team name matching
        const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const homeTeam = teams.find(t => 
          normalizeName(t.name) === normalizeName(homeTeamName) ||
          t.name.toLowerCase().includes(homeTeamName.toLowerCase()) ||
          homeTeamName.toLowerCase().includes(t.name.toLowerCase())
        );
        
        const awayTeam = teams.find(t => 
          normalizeName(t.name) === normalizeName(awayTeamName) ||
          t.name.toLowerCase().includes(awayTeamName.toLowerCase()) ||
          awayTeamName.toLowerCase().includes(t.name.toLowerCase())
        );

        if (!homeTeam || !awayTeam) {
          console.log(`\n⏭️  Skipping - Teams not found:`);
          console.log(`   - Home: ${homeTeamName} (from API: ${game.strHomeTeam})`);
          console.log(`   - Away: ${awayTeamName} (from API: ${game.strAwayTeam})`);
          console.log('   Available teams:', teams.map(t => t.name).join(', '));
          skipped++;
          continue;
        }


        // Prepare game data (game is an item from the transformed `games` array)
        const gameDate = new Date(game.apiGameDateTime);
        
        // Format dates in PostgreSQL timestamp with timezone format
        const pgTimestamp = gameDate.toISOString().replace('T', ' ').replace('Z', '+00');
        const now = new Date();
        const nowPgTimestamp = now.toISOString().replace('T', ' ').replace('Z', '+00');

        // Determine season_type based on gameType from API
        let seasonType = 'regular';
        if (game.gameType) {
            switch (game.gameType) {
                case 'S': seasonType = 'spring_training'; break;
                case 'R': seasonType = 'regular'; break;
                case 'F': seasonType = 'wildcard'; break;
                case 'D': seasonType = 'division_series'; break;
                case 'L': seasonType = 'league_championship_series'; break;
                case 'W': seasonType = 'world_series'; break;
                case 'P': seasonType = 'postseason'; break;
                default: seasonType = 'regular';
            }
        }
        
        const gameData = {
          id: crypto.randomUUID(),
          external_id: parseInt(game.idEvent, 10),
          league_id: league.id,
          season: game.strSeason, // Keep as string to match DB schema
          season_type: seasonType,
          game_date: pgTimestamp,
          game_time_utc: pgTimestamp,
          game_time_local: pgTimestamp,
          status: game.strStatus,
          period: null,
          period_time_remaining: null,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          venue_id: null,
          home_score: game.intHomeScore,
          away_score: game.intAwayScore,
          home_odds: null,
          away_odds: null,
          over_under: null,
          spread: null,
          attendance: null,
          duration_minutes: null,
          broadcasters: null,
          notes: null,
          last_updated: nowPgTimestamp,
          created_at: nowPgTimestamp,
          updated_at: nowPgTimestamp,
          api_last_updated: nowPgTimestamp,
          alternate_name: null,
          away_team: game.strAwayTeam,
          home_team: game.strHomeTeam,
          league_name: null
        };

        console.log('📝 Game data:', {
          home: homeTeam.name,
          away: awayTeam.name,
          date: gameDate.toISOString(),
          season: gameData.season,
          season_type: gameData.season_type
        });

        // Check if game exists
        const { data: existingGame } = await supabase
          .from('games')
          .select('id')
          .eq('external_id', gameData.external_id)
          .maybeSingle();

        if (existingGame) {
          // Update existing
          const { error } = await supabase
            .from('games')
            .update(gameData)
            .eq('id', existingGame.id);
          
          if (error) throw error;
          console.log(`🔄 Updated: ${homeTeam.name} vs ${awayTeam.name}`);
        } else {
          // Insert new
          const { error } = await supabase
            .from('games')
            .insert([gameData]);
            
          if (error) throw error;
          console.log(`✅ Added: ${homeTeam.name} vs ${awayTeam.name}`);
        }
        
        success++;
      } catch (error) {
        console.error('❌ Error processing game:', error.message);
        if (error.details) console.error('Details:', error.details);
        errors++;
      }
    }

    console.log(`\n✨ Sync complete!`);
    console.log(`✅ Success: ${success}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

  } catch (error) {
    console.error('🔥 Fatal error in syncGames:');
    console.error(error);
    process.exit(1);
  }
}

// Run the sync
syncGames();

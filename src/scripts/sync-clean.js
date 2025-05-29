// sync-clean.js - CREATED 2025-05-27
console.log('🚀 Starting MLB Games Sync (clean version)');

// --- Configuration ---
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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

    // Fetch games from TheSportsDB
    console.log('🔍 Fetching games from TheSportsDB...');
    const response = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnextleague.php?id=${LEAGUE_ID}`,
      { timeout: 10000 }
    );

    const games = response.data?.events || [];
    console.log(`🎯 Found ${games.length} upcoming games`);

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

        // Find team IDs
        const homeTeam = teams.find(t => t.name === homeTeamName);
        const awayTeam = teams.find(t => t.name === awayTeamName);

        if (!homeTeam || !awayTeam) {
          console.log(`⏭️  Skipping - Teams not found: ${homeTeamName} vs ${awayTeamName}`);
          skipped++;
          continue;
        }

        // Prepare game data
        const gameDate = new Date(`${game.dateEvent}T${game.strTime || '00:00:00'}`);
        
        const gameData = {
          external_id: parseInt(game.idEvent, 10),
          league_id: league.id,
          season: 2025, // Hardcoded as number
          season_type: 'regular',
          game_date: gameDate.toISOString(),
          game_time_utc: gameDate.toISOString(),
          status: game.strStatus === 'Match Finished' ? 'completed' : 'scheduled',
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          home_team: homeTeam.name,
          away_team: awayTeam.name,
          home_score: game.intHomeScore ? parseInt(game.intHomeScore, 10) : null,
          away_score: game.intAwayScore ? parseInt(game.intAwayScore, 10) : null,
          updated_at: new Date().toISOString()
        };

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
          console.log(`🔄 Updated: ${homeTeamName} vs ${awayTeamName}`);
        } else {
          // Insert new
          const { error } = await supabase
            .from('games')
            .insert([gameData]);
            
          if (error) throw error;
          console.log(`✅ Added: ${homeTeamName} vs ${awayTeamName}`);
        }
        
        success++;
      } catch (error) {
        console.error('❌ Error:', error.message);
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

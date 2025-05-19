#!/usr/bin/env node

/**
 * Script to fetch data from The Odds API and store it in Supabase
 * This script should be run periodically to keep the data fresh
 * 
 * Usage: node fetch_odds_data.js [sport]
 * Example: node fetch_odds_data.js soccer
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// The Odds API key
const oddsApiKey = process.env.VITE_THE_ODDS_API_KEY;

// Map from our sport names to The Odds API sport keys
const sportKeyMap = {
  'soccer': 'soccer_epl',
  'epl': 'soccer_epl',
  'laliga': 'soccer_spain_la_liga',
  'bundesliga': 'soccer_germany_bundesliga',
  'seriea': 'soccer_italy_serie_a',
  'uefa': 'soccer_uefa_european_championship',
  'worldcup': 'soccer_fifa_world_cup',
  'nba': 'basketball_nba',
  'ncaab': 'basketball_ncaab',
  'nfl': 'americanfootball_nfl',
  'ncaaf': 'americanfootball_ncaaf',
  'mlb': 'baseball_mlb',
  'nhl': 'icehockey_nhl',
};

// Map sport keys to league names
const leagueNameMap = {
  'soccer_epl': 'Premier League',
  'soccer_spain_la_liga': 'La Liga',
  'soccer_germany_bundesliga': 'Bundesliga',
  'soccer_italy_serie_a': 'Serie A',
  'soccer_uefa_european_championship': 'UEFA Euro',
  'soccer_fifa_world_cup': 'FIFA World Cup',
  'basketball_nba': 'NBA',
  'basketball_ncaab': 'NCAA Basketball',
  'americanfootball_nfl': 'NFL',
  'americanfootball_ncaaf': 'NCAA Football',
  'baseball_mlb': 'MLB',
  'icehockey_nhl': 'NHL',
};

// Helper function to generate a team abbreviation
function getTeamAbbreviation(teamName) {
  // Simple implementation: take first 3 characters
  return teamName.substring(0, 3).toUpperCase();
}

// Helper function to find or create a team
async function findOrCreateTeam(teamName, sport) {
  // First, try to find the team by name
  const { data: existingTeams, error: findError } = await supabase
    .from('teams')
    .select('*')
    .ilike('name', teamName)
    .eq('sport', sport);
  
  if (findError) {
    console.error(`Error finding team ${teamName}:`, findError);
    return null;
  }
  
  // If team exists, return it
  if (existingTeams && existingTeams.length > 0) {
    return existingTeams[0];
  }
  
  // Otherwise, create a new team
  const { data: newTeam, error: createError } = await supabase
    .from('teams')
    .insert({
      name: teamName,
      abbreviation: getTeamAbbreviation(teamName),
      sport: sport,
      logo: '', // Default empty logo
      external_id: `${sport}_${teamName.replace(/\s+/g, '_').toLowerCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      wins: 0,
      losses: 0,
      win_percentage: 0
    })
    .select()
    .single();
  
  if (createError) {
    console.error(`Error creating team ${teamName}:`, createError);
    return null;
  }
  
  return newTeam;
}

// Main function to fetch odds and save to Supabase
async function fetchAndSaveOdds(sport) {
  try {
    const sportKey = sportKeyMap[sport.toLowerCase()] || sport;
    console.log(`Fetching odds for ${sport} (${sportKey})...`);
    
    // Fetch data from The Odds API
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
      params: {
        apiKey: oddsApiKey,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'decimal',
        dateFormat: 'iso',
      },
    });
    
    console.log(`Received ${response.data.length} games from The Odds API`);
    console.log(`Remaining requests: ${response.headers['x-requests-remaining']}`);
    console.log(`Used requests: ${response.headers['x-requests-used']}`);
    
    // Save to cached_odds table
    const { error: cacheError } = await supabase
      .from('cached_odds')
      .upsert({
        id: `odds_${sport}`,
        sport,
        data: JSON.stringify(response.data),
        last_update: new Date().toISOString(),
      });
    
    if (cacheError) {
      console.error('Error saving to cached_odds:', cacheError);
    } else {
      console.log('Successfully saved to cached_odds table');
    }
    
    // Process each game
    for (const game of response.data) {
      console.log(`Processing game: ${game.home_team} vs ${game.away_team}`);
      
      // Find or create teams
      const homeTeam = await findOrCreateTeam(game.home_team, sportKey);
      const awayTeam = await findOrCreateTeam(game.away_team, sportKey);
      
      if (!homeTeam || !awayTeam) {
        console.error(`Could not find or create teams for game: ${game.home_team} vs ${game.away_team}`);
        continue;
      }
      
      // Create a unique ID for this game
      const gameId = `${game.sport_key}_${game.home_team}_${game.away_team}_${game.commencing_at}`.replace(/\s+/g, '_');
      
      // Find the moneyline market
      const moneylineMarket = game.bookmakers
        .find(bookmaker => bookmaker.markets.some(market => market.key === 'h2h'))
        ?.markets.find(market => market.key === 'h2h');
      
      // Find the spread market
      const spreadMarket = game.bookmakers
        .find(bookmaker => bookmaker.markets.some(market => market.key === 'spreads'))
        ?.markets.find(market => market.key === 'spreads');
      
      // Find the totals market
      const totalsMarket = game.bookmakers
        .find(bookmaker => bookmaker.markets.some(market => market.key === 'totals'))
        ?.markets.find(market => market.key === 'totals');
      
      // Extract odds
      let homeOdds = 0;
      let awayOdds = 0;
      let spread = 0;
      let total = 0;
      
      if (moneylineMarket) {
        const homeOutcome = moneylineMarket.outcomes.find(outcome => 
          outcome.name === game.home_team
        );
        const awayOutcome = moneylineMarket.outcomes.find(outcome => 
          outcome.name === game.away_team
        );
        
        homeOdds = homeOutcome?.price || 0;
        awayOdds = awayOutcome?.price || 0;
      }
      
      if (spreadMarket && spreadMarket.outcomes.length >= 2) {
        // The spread is usually the 'point' value on the home team outcome
        const homeOutcome = spreadMarket.outcomes.find(outcome => 
          outcome.name === game.home_team
        );
        
        if (homeOutcome && 'point' in homeOutcome) {
          spread = homeOutcome.point;
        }
      }
      
      if (totalsMarket && totalsMarket.outcomes.length >= 2) {
        // The total is usually the 'point' value on either outcome
        const outcome = totalsMarket.outcomes[0];
        if (outcome && 'point' in outcome) {
          total = outcome.point;
        }
      }
      
      // Save to games table
      const { error: gameError } = await supabase
        .from('games')
        .upsert({
          id: gameId,
          sport: game.sport_key,
          league: leagueNameMap[game.sport_key] || game.sport_title,
          home_team: game.home_team,
          away_team: game.away_team,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          commence_time: game.commencing_at,
          start_time: game.commencing_at,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          external_id: gameId,
          score_home: null,
          score_away: null,
          bookmakers: game.bookmakers,
          home_odds: homeOdds,
          away_odds: awayOdds,
          spread: spread,
          total: total
        });
      
      if (gameError) {
        console.error(`Error saving game to Supabase: ${gameError.message}`, gameError);
      } else {
        console.log(`Successfully saved game: ${game.home_team} vs ${game.away_team}`);
      }
    }
    
    console.log('Finished processing all games');
    
  } catch (error) {
    console.error('Error in fetchAndSaveOdds:', error);
  }
}

// Get the sport from command line arguments
const sport = process.argv[2] || 'soccer';

// Run the main function
fetchAndSaveOdds(sport)
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

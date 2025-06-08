const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or service role key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzePlayer(playerName) {
  try {
    // Step 1: Find the player by name
    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('id, name, team_id, position, jersey_number')
      .ilike('name', `%${playerName}%`);

    if (playerError) throw playerError;
    if (!players || players.length === 0) {
      console.log(`No player found with name containing "${playerName}"`);
      return;
    }

    const player = players[0];
    console.log(`\n=== Player Found ===`);
    console.log(`Name: ${player.name}`);
    console.log(`Position: ${player.position}`);
    console.log(`Jersey: #${player.jersey_number}`);

    // Step 2: Get player stats
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', player.id)
      .single();

    if (statsError) {
      console.error('Error fetching player stats:', statsError);
      return;
    }

    if (!stats) {
      console.log('No stats found for this player.');
      return;
    }

    // Step 3: Calculate the impact score manually
    const positiveWeights = {
      points: 0.40,
      field_goal_pct: 0.05,
      three_point_pct: 0.03,
      free_throw_pct: 0.01,
      assists: 0.18,
      offensive_rebounds: 0.05,
      total_rebounds: 0.01,
      minutes_played: 0.05,
      games_started: 0.03,
      defensive_rebounds: 0.01,
      steals: 0.05,
      blocks: 0.05,
      plus_minus: 0.03,
      games_played: 0.05
    };

    const negativeWeights = {
      turnovers: -0.015,
      personal_fouls: -0.005
    };

    let finalScore = 0;

    // Calculate positive contributions
    for (const [stat, weight] of Object.entries(positiveWeights)) {
      const value = parseFloat(stats[stat]) || 0;
      finalScore += value * weight;
      console.log(`${stat}: ${value.toFixed(2)} x ${weight} = ${(value * weight).toFixed(4)}`);
    }

    // Calculate negative contributions
    for (const [stat, weight] of Object.entries(negativeWeights)) {
      const value = parseFloat(stats[stat]) || 0;
      finalScore += value * weight;
      console.log(`${stat}: ${value.toFixed(2)} x ${weight} = ${(value * weight).toFixed(4)}`);
    }

    console.log(`\nRaw Score: ${finalScore.toFixed(4)}`);

    // Apply curve and scaling (matching recalculate_impact_scores.js)
    const normalized = Math.max(0, Math.min(1, finalScore));
    let adjustedScore = Math.pow(normalized, 1.1);
    const mean = 0.5;
    const stdDev = 0.28;
    const x = (normalized - mean) / (stdDev * Math.sqrt(2));
    const bellComponent = 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI)));
    const blendFactor = 0.2;
    let compositeScore = (adjustedScore * (1 - blendFactor)) + (bellComponent * blendFactor);
    let score = Math.round(compositeScore * 90);

    // Apply games played adjustments
    if (stats.games_played > 60) {
      score = Math.min(100, score + 5);
    } else if (stats.games_played <= 10) {
      score = Math.max(0, score - 3);
    }

    console.log(`\n=== Final Impact Score: ${score} ===`);
    console.log(`Games Played: ${stats.games_played}`);
    console.log(`Minutes Per Game: ${(stats.minutes_played / stats.games_played).toFixed(1)}`);
    console.log(`Points Per Game: ${(stats.points / stats.games_played).toFixed(1)}`);
    console.log(`FG%: ${(stats.field_goal_pct * 100).toFixed(1)}%`);
    console.log(`3P%: ${(stats.three_point_pct * 100).toFixed(1)}%`);
    console.log(`FT%: ${(stats.free_throw_pct * 100).toFixed(1)}%`);
    console.log(`Rebounds: ${(stats.total_rebounds / stats.games_played).toFixed(1)}`);
    console.log(`Assists: ${(stats.assists / stats.games_played).toFixed(1)}`);
    console.log(`Steals: ${(stats.steals / stats.games_played).toFixed(1)}`);
    console.log(`Blocks: ${(stats.blocks / stats.games_played).toFixed(1)}`);
    console.log(`Turnovers: ${(stats.turnovers / stats.games_played).toFixed(1)}`);
    console.log(`Plus/Minus: ${(stats.plus_minus / stats.games_played).toFixed(1)}`);

  } catch (error) {
    console.error('Error analyzing player:', error);
  }
}

// Get player name from command line argument
const playerName = process.argv[2];
if (!playerName) {
  console.log('Please provide a player name as an argument.');
  process.exit(1);
}

analyzePlayer(playerName);

// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);

async function checkAstroScores() {
  console.log('🔍 Checking astro scores in the database...');
  
  // Get count of players with astro scores
  const { count: totalWithScores, error: countError } = await supabase
    .from('baseball_players')
    .select('*', { count: 'exact', head: true })
    .not('astro_influence_score', 'is', null);

  if (countError) {
    console.error('❌ Error counting players with astro scores:', countError);
    return;
  }

  console.log(`📊 Total players with astro scores: ${totalWithScores}`);

  // Get some sample scores
  const { data: sampleScores, error: sampleError } = await supabase
    .from('baseball_players')
    .select('player_id, player_first_name, player_last_name, astro_influence_score')
    .not('astro_influence_score', 'is', null)
    .order('astro_influence_score', { ascending: false })
    .limit(5);

  if (sampleError) {
    console.error('❌ Error fetching sample scores:', sampleError);
    return;
  }

  console.log('\n🏆 Top 5 highest astro scores:');
  sampleScores.forEach((player, index) => {
    console.log(`${index + 1}. ${player.player_first_name} ${player.player_last_name}: ${player.astro_influence_score.toFixed(2)}`);
  });

  // Get score distribution
  console.log('\n📈 Score distribution:');
  const scoreRanges = [
    { min: 90, max: 100, label: '90-100' },
    { min: 80, max: 89.99, label: '80-89' },
    { min: 70, max: 79.99, label: '70-79' },
    { min: 60, max: 69.99, label: '60-69' },
    { min: 0, max: 59.99, label: '0-59' },
  ];

  for (const range of scoreRanges) {
    const { count, error: rangeError } = await supabase
      .from('baseball_players')
      .select('*', { count: 'exact', head: true })
      .gte('astro_influence_score', range.min)
      .lte('astro_influence_score', range.max);

    if (rangeError) {
      console.error(`❌ Error counting scores in range ${range.label}:`, rangeError);
      continue;
    }

    const percentage = ((count / totalWithScores) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / totalWithScores) * 20));
    console.log(`${range.label.padEnd(6)} | ${bar.padEnd(20)} ${count.toString().padStart(4)} (${percentage}%)`);
  }
}

checkAstroScores().catch(console.error);

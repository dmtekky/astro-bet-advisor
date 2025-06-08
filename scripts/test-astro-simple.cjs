// Simple test script to verify astro score calculation
const { calculateAstroInfluenceScore } = require('../src/lib/standardAstroScore');

// Mock player data
const testPlayer = {
  id: 1,
  full_name: 'Test Player',
  birth_date: '1990-06-15',
  birth_city: 'Test City',
  birth_country: 'USA',
  position: 'P',
  stats_batting_average: 0.275,
  stats_era: 3.45
};

// Test the function
async function runTest() {
  try {
    console.log('🚀 Starting Astro Score Test...\n');
    
    console.log('🧪 Player:', testPlayer.full_name);
    console.log('   Birth Date:', testPlayer.birth_date);
    
    const score = await calculateAstroInfluenceScore(testPlayer);
    
    console.log('\n📊 Results:');
    console.log(`   Astro Score: ${score.toFixed(2)}/100`);
    console.log(`   Valid Range: ${score >= 0 && score <= 100 ? '✅' : '❌'}`);
    
    if (isNaN(score)) {
      console.log('   ❌ Error: Score is NaN');
    } else if (score < 0 || score > 100) {
      console.log('   ⚠️ Warning: Score out of expected range (0-100)');
    }
    
    console.log('\n✨ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();

// Simple test for core functions in standardAstroScore.js
const { getCurrentSeason, getSeasonalWeights } = require('./src/lib/standardAstroScore.cjs');

console.log('🧪 Testing core functions...');

// Test getCurrentSeason
console.log('\n📅 Testing getCurrentSeason:');
const testDate = new Date('2025-06-07T12:00:00-04:00');
const season = getCurrentSeason(testDate);
console.log(`Current season for ${testDate.toISOString()}: ${season}`);
console.log(season === 2025 ? '✅ Passed' : '❌ Failed');

// Test getSeasonalWeights
console.log('\n🌱 Testing getSeasonalWeights:');
const weights = getSeasonalWeights(testDate);
console.log('Seasonal Weights:', weights);
console.log(
  weights.spring > 0 && 
  weights.summer > 0 && 
  weights.fall > 0 && 
  weights.winter > 0 
  ? '✅ Passed' : '❌ Failed'
);

console.log('\n✨ Core function tests completed!');

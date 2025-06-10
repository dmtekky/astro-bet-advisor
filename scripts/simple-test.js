// Simple test script for updateAstroScores
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTest() {
  console.log('🚀 Starting simple test for astro scores update...');

  try {
    // Import the updateAstroScores function directly
    console.log('Importing updateAstroScores...');
    const { updateAstroScores } = await import('../src/lib/updateAstroScores.js');
    
    console.log('Calling updateAstroScores...');
    const result = await updateAstroScores();
    
    console.log('✅ Update result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in test:', error);
    throw error;
  }
}

// Run the test
runTest()
  .then(() => console.log('Test completed successfully'))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });

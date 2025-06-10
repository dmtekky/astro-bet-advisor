// Test script that uses the compiled JavaScript files
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment for local testing
process.env.NODE_ENV = 'development';
process.env.VERCEL = '0';

async function runTest() {
  try {
    console.log('🚀 Testing astro scores update using compiled files...');
    
    // Import the compiled module
    console.log('Importing updateAstroScores from dist...');
    const { updateAstroScores } = await import('../dist/lib/updateAstroScores.js');
    
    console.log('Calling updateAstroScores...');
    const result = await updateAstroScores();
    
    console.log('\n📊 Update Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result && result.success) {
      console.log('✅ Test completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Test failed:', result?.error || 'Unknown error');
      if (result?.stack) {
        console.error('Stack trace:', result.stack);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unhandled error in test:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

runTest();

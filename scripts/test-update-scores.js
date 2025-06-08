// Test script for the update-scores endpoint
import { fileURLToPath } from 'url';
import path from 'path';

// Set up __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment for local testing
process.env.NODE_ENV = 'development';
process.env.VERCEL = '0';

// Import the function using dynamic import to handle ESM/CJS interop
async function runTest() {
  try {
    console.log('🚀 Testing astro scores update...');
    
    // Import the module dynamically to handle ESM/CJS interop
    const { updateAstroScores } = await import('../src/lib/updateAstroScores.js');
    
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
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('Module not found. Make sure all dependencies are installed.');
      console.error('Try running: npm install');
    }
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the test
runTest();

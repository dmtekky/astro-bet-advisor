import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We'll use dynamic import for the CJS module
let updateAllPlayerScores = async () => {
  console.warn('updateAllPlayerScores not loaded, using fallback');
  return { success: false, error: 'updateAllPlayerScores not loaded' };
};

// Only try to import if not in Vercel environment
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  try {
    console.log('Loading updateAllPlayerScores module...');
    const modulePath = path.resolve(__dirname, '../../../scripts/update-all-astro-scores.cjs');
    console.log('Module path:', modulePath);
    
    // Use dynamic import with file:// URL for better error messages
    const module = await import(modulePath);
    updateAllPlayerScores = module.updateAllPlayerScores || updateAllPlayerScores;
    console.log('Successfully loaded updateAllPlayerScores');
  } catch (error) {
    console.error('❌ Failed to import updateAllPlayerScores:', error);
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('Module not found. Make sure the file exists and the path is correct.');
    }
    // Don't throw here, we'll handle it in the main function
  }
}

export async function updateAstroScores() {
  try {
    console.log('🚀 Starting astro score update...');
    
    // Check if we're in Vercel environment
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      // In Vercel, call the function directly
      console.log('Running in Vercel environment, calling update function directly...');
      await updateAllPlayerScores();
      return { 
        success: true, 
        message: 'Astro scores updated successfully',
        updated: true,
        output: 'Update completed successfully'
      };
    } else {
      // In local environment, run as a separate process for better error handling
      console.log('Running in local environment, executing as separate process...');
      const { stdout, stderr } = await execAsync('node scripts/update-all-astro-scores.cjs');
      
      if (stderr) {
        console.error('Error from astro score script:', stderr);
        return { 
          success: false, 
          error: stderr,
          updated: false
        };
      }
      
      console.log('Astro score update output:', stdout);
      return { 
        success: true, 
        message: 'Astro scores updated successfully',
        updated: true,
        output: stdout
      };
    }
  } catch (error) {
    console.error('❌ Error running astro score update:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      updated: false,
      stack: error.stack
    };
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { updateAstroScores } from '../../lib/updateAstroScores';

// Load environment variables
const cronSecret = process.env.CRON_SECRET;

// Simple test endpoint to verify the update functionality
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for secret token in query parameter
  const { token } = req.query;
  
  if (token !== cronSecret) {
    console.error('Unauthorized request: Invalid or missing token');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing token' 
    });
  }

  try {
    console.log('Starting test update...');
    
    // Test the updateAstroScores function
    console.log('Calling updateAstroScores...');
    const result = await updateAstroScores();
    
    if (result.success) {
      console.log('Successfully updated astro scores:', result);
      return res.status(200).json({
        success: true,
        message: 'Test update completed successfully',
        result
      });
    } else {
      console.error('Failed to update astro scores:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to update astro scores'
      });
    }
  } catch (error) {
    console.error('Error in test update:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
}

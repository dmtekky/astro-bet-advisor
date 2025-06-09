import { NextApiRequest, NextApiResponse } from 'next';
import { updateAstroScores } from '../../lib/updateAstroScores';

// Simple test endpoint to verify the update functionality
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

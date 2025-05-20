/**
 * API endpoint to sync NBA and MLB games from The Odds API to Supabase
 * 
 * This endpoint can be called manually or set up as a cron job to run weekly.
 * It's designed to minimize API usage while keeping game data up-to-date.
 * 
 * Usage:
 * - Manual trigger: POST /api/sync-games
 * - Cron job: Set up to call this endpoint once per week
 */

import { syncAllSports } from '../../scripts/syncGames';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sync all sports (NBA and MLB)
    const results = await syncAllSports();
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Games synced successfully',
      results
    });
  } catch (error) {
    console.error('Error syncing games:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync games'
    });
  }
}

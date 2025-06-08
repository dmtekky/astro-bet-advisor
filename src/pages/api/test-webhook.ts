import { NextApiRequest, NextApiResponse } from 'next';

// Simple test endpoint to verify webhook functionality
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Bypass authentication for testing
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in development mode - authentication bypassed');
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return res.status(500).json({ 
      error: 'Webhook not configured',
      message: 'DISCORD_WEBHOOK_URL environment variable is not set' 
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '🔔 Test notification from Vercel',
        username: 'Test Bot',
        avatar_url: 'https://i.imgur.com/4M34hi2.png',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send test notification',
      details: error.message 
    });
  }
}

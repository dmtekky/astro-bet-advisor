import { NextApiRequest, NextApiResponse } from 'next';

// Simple test endpoint to verify webhook functionality
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Test webhook endpoint hit');
  
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set');
    return res.status(500).json({ 
      error: 'Webhook not configured',
      message: 'DISCORD_WEBHOOK_URL environment variable is not set' 
    });
  }

  try {
    console.log('Sending test message to Discord webhook');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '🔔 Test notification from Vercel - ' + new Date().toISOString(),
        username: 'Test Bot',
        avatar_url: 'https://i.imgur.com/4M34hi2.png',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    console.log('Successfully sent test message to Discord');
    return res.status(200).json({ 
      success: true, 
      message: 'Test notification sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send test notification',
      details: error.message,
      timestamp: new Date().toISOString()
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

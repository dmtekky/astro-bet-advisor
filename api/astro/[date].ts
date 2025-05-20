import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the date from the URL or use current date
  let dateParam = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
  
  // Extract just the date part (YYYY-MM-DD) if there are any trailing characters
  const match = dateParam ? dateParam.match(/^(\d{4}-\d{2}-\d{2})/) : null;
  const dateStr = match ? match[1] : new Date().toISOString().split('T')[0];
  
  try {
    // Your existing logic here
    const response = {
      success: true,
      date: dateStr,
      // ... rest of your response
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:3000/api/news/generate-article';
const CRON_SECRET = process.env.CRON_SECRET;

async function generateDailyRecap() {
  if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Generating daily recap article...');
    
    const response = await fetch(`${API_URL}?token=${CRON_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Add any additional data needed for the recap
        type: 'daily-recap',
        date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate daily recap: ${response.status} ${response.statusText} - ${error}`);
    }

    const result = await response.json();
    console.log('Successfully generated daily recap:', result);
    return result;
  } catch (error) {
    console.error('Error generating daily recap:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${__filename}`) {
  generateDailyRecap()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { generateDailyRecap };

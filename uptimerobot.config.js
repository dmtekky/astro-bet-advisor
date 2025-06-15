/**
 * UptimeRobot configuration for Full Moon Odds
 * 
 * This file contains the configuration for setting up UptimeRobot monitoring.
 * To use this configuration:
 * 1. Sign up for a free account at https://uptimerobot.com/
 * 2. Create a new monitor using these settings
 * 3. Configure alerting preferences
 */

module.exports = {
  // Your production URL (update this when you deploy)
  websiteUrl: 'https://fullmoonodds.com',
  
  // Health check endpoint (already implemented in your code)
  healthCheckPath: '/api/health',
  
  // Monitoring intervals in seconds (60 seconds is the minimum for free tier)
  monitoringInterval: 60,
  
  // Alert contacts (configure these in your UptimeRobot dashboard)
  alertContacts: [
    // Add your alert contact IDs here after setting them up in UptimeRobot
    // Example: '1234567_0_0-1234567890'
  ],
  
  // Monitor settings
  monitorSettings: {
    type: 'http',
    sub_type: 'http',
    port: 443,
    keyword_type: 'statuscode',
    keyword_value: '200',
    http_username: '',
    http_password: '',
    http_auth_type: 1, // 1 = Basic Auth, 2 = Digest Auth
    post_type: 1, // 1 = GET, 2 = POST, 3 = PUT, 4 = HEAD, 5 = DELETE, 6 = PATCH, 7 = OPTIONS
    post_value: '',
    post_content_type: 1
  },
  
  // Alert conditions (configure these in the UptimeRobot dashboard)
  alertConditions: {
    down: 1, // Alert if down for 1 check
    up: 1    // Alert when back up after 1 check
  },
  
  // HTTP headers to include in the check
  headers: {
    'User-Agent': 'UptimeRobot/2.0',
    'Cache-Control': 'no-cache'
  }
};

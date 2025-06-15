# Monitoring and Security Setup for Full Moon Odds

This document outlines the monitoring and security setup for the Full Moon Odds application.

## Health Checks

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Timestamp
- Environment information

### Running Health Checks

```bash
# Check local development server
npm run check:health

# Check security headers
npm run check:security
```

## Uptime Monitoring with UptimeRobot

### Setup Instructions

1. **Sign up for UptimeRobot**
   - Go to [UptimeRobot](https://uptimerobot.com/) and create a free account

2. **Add a New Monitor**
   - Click "Add New Monitor"
   - Select Monitor Type: `HTTP(s)`
   - Friendly Name: `Full Moon Odds Production`
   - URL: `https://your-production-url.com/api/health`
   - Monitoring Interval: 5 minutes (or 1 minute for paid plans)
   - Alert Threshold: 1 failed request

3. **Configure Alert Contacts**
   - Go to "My Settings" > "Alert Contacts"
   - Add your email and/or mobile number for alerts
   - Set up Slack/Telegram/Discord notifications if desired

4. **Alert Conditions**
   - Alert when down for 5 minutes
   - Alert when back up
   - Weekly reports

## Security Headers

The application includes the following security headers:

- `Content-Security-Policy`: Restricts resources that can be loaded
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Enables XSS filtering
- `Strict-Transport-Security`: Enforces HTTPS
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

## Backup Strategy

### Database Backups

1. **Supabase Backups**
   - Enable daily backups in Supabase dashboard
   - Set retention policy (7-30 days recommended)

2. **Manual Backups**
   - Use Supabase's "Download Backup" feature for major releases
   - Store encrypted backups in a secure location

### File Backups

1. **Source Code**
   - GitHub repository serves as primary backup
   - Regular commits with meaningful messages

2. **Uploaded Files**
   - If using Supabase Storage, enable versioning
   - Regular exports of important data

## Performance Monitoring

### Lighthouse Audits

Run regular Lighthouse audits:

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit
lighthouse https://your-production-url.com --view
```

### Web Vitals

Monitor Core Web Vitals using:
- Google Search Console
- Vercel Analytics (if deployed on Vercel)
- Custom monitoring with `web-vitals` library

## Incident Response

1. **Monitoring Alerts**
   - Acknowledge alerts immediately
   - Investigate root cause
   - Document incident details

2. **Communication**
   - Notify team members if needed
   - Update status page if available
   - Post-mortem for significant incidents

## Maintenance Schedule

- Weekly: Review monitoring alerts and logs
- Monthly: Test backup restoration
- Quarterly: Security audit and dependency updates

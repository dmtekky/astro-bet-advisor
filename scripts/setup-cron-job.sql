
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the update-ephemeris function to run daily at 1:00 AM UTC
SELECT cron.schedule(
  'update-daily-ephemeris',
  '0 1 * * *',  -- cron expression: minute hour day month day_of_week
  $$
  SELECT
    net.http_post(
      url:='https://awoxkynorbspcrrggbca.supabase.co/functions/v1/update-ephemeris',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjQzMzQsImV4cCI6MjA2Mjg0MDMzNH0.jiJnx4z9jMFQcBNg1pLtuQAgnKxykqyLWSwQ4KHbhE4"}'::jsonb,
      body:=format('{"date": "%s"}', (CURRENT_DATE + INTERVAL '1 day')::date)::jsonb
    ) as request_id;
  $$
);

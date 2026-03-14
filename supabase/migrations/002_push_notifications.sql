-- Migration 002: Add push notification support

-- Add push token column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Schedule daily Edge Function calls via pg_cron (requires pg_cron extension)
-- Run these after enabling pg_cron in Supabase dashboard

-- Check reminders daily at 8:00 AM PHT (UTC+8 = 00:00 UTC)
-- SELECT cron.schedule(
--   'daily-reminder-check',
--   '0 0 * * *',
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/send-reminder',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'
--   );
--   $$
-- );

-- Check budgets daily at 9:00 AM PHT (01:00 UTC)
-- SELECT cron.schedule(
--   'daily-budget-check',
--   '0 1 * * *',
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/budget-alert',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'
--   );
--   $$
-- );

-- Fetch exchange rates daily at 6:00 AM PHT (22:00 UTC previous day)
-- SELECT cron.schedule(
--   'daily-rate-fetch',
--   '0 22 * * *',
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-rates',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'
--   );
--   $$
-- );

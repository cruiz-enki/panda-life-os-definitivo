-- Activate cron jobs for notifications engine
SELECT cron.schedule(
  'process-notifications-15min',
  '*/15 * * * *',
  $$
  SELECT public._telegram_cron_call('/api/public/hooks/process-notifications', '{}'::jsonb);
  $$
);

SELECT cron.schedule(
  'streak-risk-sweep-daily',
  '0 3 * * *',
  $$
  SELECT public._telegram_cron_call('/api/public/hooks/streak-risk-sweep', '{}'::jsonb);
  $$
);

SELECT cron.unschedule('telegram-reminders-every-5min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'telegram-reminders-every-5min');

SELECT cron.schedule(
  'telegram-reminders-every-5min',
  '*/5 * * * *',
  $$ SELECT public._telegram_cron_call('/api/public/hooks/telegram-reminders', '{}'::jsonb); $$
);

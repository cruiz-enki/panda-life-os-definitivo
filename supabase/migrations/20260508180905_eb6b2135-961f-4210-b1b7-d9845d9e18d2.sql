-- Reschedule jobs that used current_setting('app.cron_secret') (which is empty)
-- to read the real secret from vault, like the Telegram jobs do.

SELECT cron.unschedule('panda-daily-push');
SELECT cron.unschedule('identity-daily-reminder');
SELECT cron.unschedule('identity-weekly-reminder');

SELECT cron.schedule(
  'panda-daily-push',
  '0 9 * * *',
  $$
  SELECT public._telegram_cron_call(
    '/api/public/hooks/send-push',
    jsonb_build_object(
      'title', '🐼 Buenos días',
      'body', 'Tu coach tiene un nuevo plan listo para hoy. ¡Vamos a por él!',
      'url', '/',
      'tag', 'daily-summary'
    )
  );
  $$
);

SELECT cron.schedule(
  'identity-daily-reminder',
  '0 3 * * *',
  $$
  SELECT public._telegram_cron_call('/api/public/hooks/identity-reminders', '{"mode":"daily"}'::jsonb);
  $$
);

SELECT cron.schedule(
  'identity-weekly-reminder',
  '0 1 * * 1',
  $$
  SELECT public._telegram_cron_call('/api/public/hooks/identity-reminders', '{"mode":"weekly"}'::jsonb);
  $$
);
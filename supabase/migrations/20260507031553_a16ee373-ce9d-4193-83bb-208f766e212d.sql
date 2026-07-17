CREATE OR REPLACE FUNCTION public._telegram_send_overdue_tasks()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  cfg RECORD;
  task_count INT;
  msg TEXT;
  task_lines TEXT;
  cron_secret TEXT;
  sent INT := 0;
BEGIN
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1;
  IF cron_secret IS NULL THEN RETURN 0; END IF;

  FOR cfg IN
    SELECT tc.user_id, tc.chat_id, tc.notify_time, tc.timezone
    FROM public.telegram_config tc
    WHERE tc.notify_overdue_tasks = true
      AND tc.chat_id IS NOT NULL
      AND EXTRACT(HOUR FROM (now() AT TIME ZONE tc.timezone)) = EXTRACT(HOUR FROM tc.notify_time)
  LOOP
    SELECT COUNT(*) INTO task_count
    FROM public.tasks
    WHERE user_id = cfg.user_id
      AND completed_at IS NULL
      AND due IS NOT NULL
      AND due < now();

    IF task_count = 0 THEN CONTINUE; END IF;

    SELECT string_agg('• ' || title || ' (' || to_char(due AT TIME ZONE cfg.timezone, 'DD Mon') || ')', E'\n')
    INTO task_lines
    FROM (
      SELECT title, due
      FROM public.tasks
      WHERE user_id = cfg.user_id
        AND completed_at IS NULL
        AND due IS NOT NULL
        AND due < now()
      ORDER BY due ASC
      LIMIT 10
    ) t;

    msg := '⏰ *Tienes ' || task_count || ' tarea' || CASE WHEN task_count = 1 THEN '' ELSE 's' END || ' vencida' || CASE WHEN task_count = 1 THEN '' ELSE 's' END || E':*\n\n' || task_lines || E'\n\nhttps://app.cmrs.mx/tasks';

    PERFORM net.http_post(
      url := 'https://app.cmrs.mx/api/public/hooks/telegram-send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', cron_secret
      ),
      body := jsonb_build_object('chat_id', cfg.chat_id, 'text', msg),
      timeout_milliseconds := 30000
    );
    sent := sent + 1;
  END LOOP;

  RETURN sent;
END;
$function$;
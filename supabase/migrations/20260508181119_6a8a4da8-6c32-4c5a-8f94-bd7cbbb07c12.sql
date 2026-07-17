SELECT net.http_post(
  url:='https://app.cmrs.mx/api/public/hooks/telegram-reminders',
  headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret','test-debug'),
  body:='{}'::jsonb,
  timeout_milliseconds:=15000
) as req_id;
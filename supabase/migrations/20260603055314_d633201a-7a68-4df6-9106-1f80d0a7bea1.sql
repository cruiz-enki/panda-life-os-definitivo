-- Add global enabled flag to telegram_config
ALTER TABLE public.telegram_config 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- Add global enabled flag to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS global_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

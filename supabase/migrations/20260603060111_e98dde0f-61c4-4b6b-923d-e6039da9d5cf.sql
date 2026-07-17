ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS medical_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS meal_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS exercise_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS identity_reminders_enabled BOOLEAN NOT NULL DEFAULT true;

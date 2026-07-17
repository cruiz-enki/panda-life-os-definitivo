
ALTER TABLE public.telegram_config
  ADD COLUMN IF NOT EXISTS notify_medications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_meals boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_exercise boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS meal_breakfast_time time NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS meal_lunch_time time NOT NULL DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS meal_dinner_time time NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS exercise_time time NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS last_reminder_keys text[] NOT NULL DEFAULT '{}';

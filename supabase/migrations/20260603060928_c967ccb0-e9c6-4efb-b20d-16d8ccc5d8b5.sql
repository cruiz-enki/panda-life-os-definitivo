-- Add streak tracking to medications
ALTER TABLE public.health_medications
ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completed_date DATE;

-- Add area-specific streaks to profiles for global tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS task_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_task_date DATE,
ADD COLUMN IF NOT EXISTS cleaning_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_cleaning_date DATE,
ADD COLUMN IF NOT EXISTS energy_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_energy_date DATE,
ADD COLUMN IF NOT EXISTS health_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_health_date DATE;

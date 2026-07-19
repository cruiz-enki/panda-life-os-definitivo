-- =========================================================
-- Merge Energy check-in into Mood: add `energy` (1..10) and `pain` (0..10)
-- Correlo en el SQL Editor de tu Supabase.
-- =========================================================

ALTER TABLE public.mood_logs
  ADD COLUMN IF NOT EXISTS energy SMALLINT CHECK (energy BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS pain   SMALLINT CHECK (pain   BETWEEN 0 AND 10);

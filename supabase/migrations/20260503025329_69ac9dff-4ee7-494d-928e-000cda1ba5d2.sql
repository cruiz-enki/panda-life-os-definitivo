ALTER TABLE public.habits 
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS target_count integer NOT NULL DEFAULT 1;
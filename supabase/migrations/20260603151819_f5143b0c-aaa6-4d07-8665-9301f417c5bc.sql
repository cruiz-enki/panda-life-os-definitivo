ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS enki_mode_enabled BOOLEAN DEFAULT true;

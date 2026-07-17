ALTER TABLE public.horizons 
ADD COLUMN status TEXT DEFAULT 'pending',
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
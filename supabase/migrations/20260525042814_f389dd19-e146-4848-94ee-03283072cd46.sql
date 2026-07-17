-- Add unlocked_skills column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unlocked_skills TEXT[] DEFAULT '{}';

-- Create an index for faster lookups (optional but good practice)
-- CREATE INDEX idx_profiles_unlocked_skills ON public.profiles USING GIN(unlocked_skills);

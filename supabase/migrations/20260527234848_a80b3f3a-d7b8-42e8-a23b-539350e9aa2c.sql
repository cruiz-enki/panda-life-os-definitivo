ALTER TABLE public.custom_quests 
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.custom_quests.due_date IS 'Optional date when the mission should be completed.';
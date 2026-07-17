-- Add allowed_meal_types column to meal_dishes
ALTER TABLE public.meal_dishes
ADD COLUMN allowed_meal_types TEXT[] DEFAULT '{}';

-- Grant permissions (redundant but safe if permissions were reset)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_dishes TO authenticated;
GRANT ALL ON public.meal_dishes TO service_role;

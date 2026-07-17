-- Create health_goals table
CREATE TABLE public.health_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    indicator_name TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    start_value NUMERIC,
    current_value NUMERIC,
    unit TEXT,
    target_type TEXT NOT NULL CHECK (target_type IN ('min', 'max')), -- 'max' for "less than", 'min' for "greater than"
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_goals TO authenticated;
GRANT ALL ON public.health_goals TO service_role;

-- RLS
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals" 
ON public.health_goals 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_health_goals_updated_at
BEFORE UPDATE ON public.health_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

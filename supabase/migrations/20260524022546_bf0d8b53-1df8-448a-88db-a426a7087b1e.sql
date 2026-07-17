-- Add protein column to meals
ALTER TABLE public.health_meals ADD COLUMN IF NOT EXISTS protein_grams NUMERIC;

-- Create water logs table
CREATE TABLE IF NOT EXISTS public.health_water_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount_ml INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.health_water_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own water logs" ON public.health_water_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs" ON public.health_water_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water logs" ON public.health_water_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water logs" ON public.health_water_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_health_water_logs_updated_at
    BEFORE UPDATE ON public.health_water_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

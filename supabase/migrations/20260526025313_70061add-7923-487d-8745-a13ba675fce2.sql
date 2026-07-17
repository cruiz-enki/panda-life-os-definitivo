CREATE TABLE public.future_simulations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'current_trend' or 'habit_maintenance'
    timeframe TEXT NOT NULL, -- '1 year', '5 years', etc.
    simulation_data JSONB NOT NULL, -- Detailed projections per category
    ai_insight TEXT, -- Summary insight from AI
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.future_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own simulations"
ON public.future_simulations
FOR ALL
USING (auth.uid() = user_id);

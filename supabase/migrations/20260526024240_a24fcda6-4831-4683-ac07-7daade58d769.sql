CREATE TABLE public.life_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    health INTEGER DEFAULT 5,
    finances INTEGER DEFAULT 5,
    relationships INTEGER DEFAULT 5,
    business INTEGER DEFAULT 5,
    stress INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.life_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own life metrics" 
ON public.life_metrics FOR ALL USING (auth.uid() = user_id);
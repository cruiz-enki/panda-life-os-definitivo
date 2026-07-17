CREATE TABLE IF NOT EXISTS public.daily_wins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    feeling TEXT, -- 'proud', 'grateful', 'happy', 'neutral'
    xp_rewardED BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_wins ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own wins" ON public.daily_wins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wins" ON public.daily_wins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wins" ON public.daily_wins
    FOR DELETE USING (auth.uid() = user_id);

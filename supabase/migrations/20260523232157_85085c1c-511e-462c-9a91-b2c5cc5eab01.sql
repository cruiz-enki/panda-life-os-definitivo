-- Create learning_logs table
CREATE TABLE IF NOT EXISTS public.learning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    ai_summary TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own learning logs"
    ON public.learning_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning logs"
    ON public.learning_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning logs"
    ON public.learning_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning logs"
    ON public.learning_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at_learning_logs
    BEFORE UPDATE ON public.learning_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

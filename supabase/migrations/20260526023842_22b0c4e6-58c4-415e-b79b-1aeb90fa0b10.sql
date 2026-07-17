CREATE TABLE public.future_letters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.future_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own future letters" 
ON public.future_letters FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_future_letters_updated_at 
BEFORE UPDATE ON public.future_letters 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
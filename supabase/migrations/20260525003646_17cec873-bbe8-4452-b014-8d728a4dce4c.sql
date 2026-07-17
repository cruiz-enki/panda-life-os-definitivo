-- Create decisions table
CREATE TABLE public.decisions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    method TEXT NOT NULL, -- 'random', 'ai', 'pros_cons'
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decision options table
CREATE TABLE public.decision_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    ai_analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_options ENABLE ROW LEVEL SECURITY;

-- Decisions policies
CREATE POLICY "Users can view their own decisions" 
ON public.decisions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decisions" 
ON public.decisions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decisions" 
ON public.decisions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decisions" 
ON public.decisions FOR DELETE USING (auth.uid() = user_id);

-- Decision options policies
CREATE POLICY "Users can view options of their decisions" 
ON public.decision_options FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.decisions WHERE id = decision_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert options to their decisions" 
ON public.decision_options FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.decisions WHERE id = decision_id AND user_id = auth.uid()));

CREATE POLICY "Users can update options of their decisions" 
ON public.decision_options FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.decisions WHERE id = decision_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete options of their decisions" 
ON public.decision_options FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.decisions WHERE id = decision_id AND user_id = auth.uid()));

-- Index for performance
CREATE INDEX idx_decisions_user_id ON public.decisions(user_id);
CREATE INDEX idx_decision_options_decision_id ON public.decision_options(decision_id);

-- Update timestamp trigger
CREATE TRIGGER update_decisions_updated_at
BEFORE UPDATE ON public.decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
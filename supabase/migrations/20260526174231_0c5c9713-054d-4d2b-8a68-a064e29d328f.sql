-- Create table for house maintenance
CREATE TABLE public.house_maintenance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('preventative', 'corrective')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'scheduled')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cost NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for user_id
CREATE INDEX idx_house_maintenance_user_id ON public.house_maintenance(user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.house_maintenance TO authenticated;
GRANT ALL ON public.house_maintenance TO service_role;

-- Enable RLS
ALTER TABLE public.house_maintenance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own maintenance" 
ON public.house_maintenance FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own maintenance" 
ON public.house_maintenance FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance" 
ON public.house_maintenance FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance" 
ON public.house_maintenance FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_house_maintenance_updated_at
BEFORE UPDATE ON public.house_maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for home services
CREATE TABLE public.home_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT,
    monthly_cost NUMERIC DEFAULT 0,
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    category TEXT,
    emoji TEXT DEFAULT '🔌',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_services TO authenticated;
GRANT ALL ON public.home_services TO service_role;

-- Enable RLS
ALTER TABLE public.home_services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own home services" 
ON public.home_services 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_home_services_updated_at
BEFORE UPDATE ON public.home_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for pets
CREATE TABLE public.family_pets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- dog, cat, other
    breed TEXT,
    birth_date DATE,
    weight NUMERIC(5, 2),
    emoji TEXT DEFAULT '🐾',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pet logs (vaccines, baths, food, etc)
CREATE TABLE public.pet_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.family_pets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('vaccine', 'bath', 'food_buy', 'vet', 'weight', 'grooming', 'other')),
    note TEXT,
    cost NUMERIC(10, 2) DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_family_pets_user_id ON public.family_pets(user_id);
CREATE INDEX idx_pet_logs_pet_id ON public.pet_logs(pet_id);
CREATE INDEX idx_pet_logs_user_id ON public.pet_logs(user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_pets TO authenticated;
GRANT ALL ON public.family_pets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_logs TO authenticated;
GRANT ALL ON public.pet_logs TO service_role;

-- Enable RLS
ALTER TABLE public.family_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_logs ENABLE ROW LEVEL SECURITY;

-- Policies for family_pets
CREATE POLICY "Users can view their own pets" ON public.family_pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own pets" ON public.family_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pets" ON public.family_pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pets" ON public.family_pets FOR DELETE USING (auth.uid() = user_id);

-- Policies for pet_logs
CREATE POLICY "Users can view their own pet logs" ON public.pet_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own pet logs" ON public.pet_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pet logs" ON public.pet_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pet logs" ON public.pet_logs FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_family_pets_updated_at BEFORE UPDATE ON public.family_pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pet_logs_updated_at BEFORE UPDATE ON public.pet_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
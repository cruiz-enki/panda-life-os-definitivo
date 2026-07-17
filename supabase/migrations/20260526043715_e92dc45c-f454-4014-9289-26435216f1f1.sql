-- Catalog of missions for the Randomizer
CREATE TABLE public.life_randomizer_missions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., 'growth', 'order', 'health', 'social', 'finance'
    icon TEXT,
    xp_reward INTEGER DEFAULT 50,
    is_default BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id), -- Null for global defaults
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- History of randomization
CREATE TABLE public.life_randomizer_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    mission_id UUID REFERENCES public.life_randomizer_missions(id),
    custom_title TEXT, -- In case it pulled from tasks/goals
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.life_randomizer_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_randomizer_history ENABLE ROW LEVEL SECURITY;

-- Policies for missions
CREATE POLICY "Public missions are viewable by everyone" 
ON public.life_randomizer_missions FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own missions" 
ON public.life_randomizer_missions FOR ALL USING (auth.uid() = user_id);

-- Policies for history
CREATE POLICY "Users can view their own randomizer history" 
ON public.life_randomizer_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own randomizer history" 
ON public.life_randomizer_history FOR ALL USING (auth.uid() = user_id);

-- Insert default missions
INSERT INTO public.life_randomizer_missions (title, description, category, icon, xp_reward, is_default) VALUES
('Leer 10 páginas', 'Dedica un momento a nutrir tu mente con lectura.', 'growth', '📖', 50, true),
('Ordenar escritorio', 'Un espacio limpio es una mente despejada.', 'order', '🧹', 40, true),
('Ver documental histórico', 'Aprende algo nuevo sobre nuestro pasado.', 'growth', '📺', 60, true),
('Hacer movilidad lumbar', 'Cuida tu espalda con 5-10 min de estiramientos.', 'health', '🧘', 40, true),
('Llamar a mamá', 'O a alguien querido que no hayas contactado hace tiempo.', 'social', '📞', 70, true),
('Organizar finanzas 15 min', 'Revisa tus gastos o planifica tu presupuesto.', 'finance', '💰', 50, true);

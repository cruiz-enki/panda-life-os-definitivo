-- Tabla de definición de objetos mágicos
CREATE TABLE public.magic_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '✨',
    cost_xp INTEGER NOT NULL DEFAULT 100,
    effect_type TEXT NOT NULL, -- 'xp_multiplier', 'streak_shield', 'instant_xp', 'energy_boost'
    effect_value JSONB, -- { "multiplier": 1.5, "duration_hours": 24 } o { "amount": 500 }
    rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de inventario de usuario
CREATE TABLE public.user_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.magic_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.magic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Políticas magic_items
CREATE POLICY "Cualquiera puede ver objetos mágicos" ON public.magic_items FOR SELECT USING (true);

-- Políticas user_inventory
CREATE POLICY "Usuarios ven su propio inventario" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar en su inventario" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar su propio inventario" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_inventory_updated_at BEFORE UPDATE ON public.user_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos objetos iniciales
INSERT INTO public.magic_items (name, description, emoji, cost_xp, effect_type, effect_value, rarity) VALUES
('Poción de Sabiduría', 'Multiplica x1.5 toda la XP ganada durante 24 horas.', '🧪', 1500, 'xp_multiplier', '{"multiplier": 1.5, "duration_hours": 24}', 'rare'),
('Escudo de Racha', 'Protege tus rachas automáticamente si olvidas un hábito (se consume al usar).', '🛡️', 2000, 'streak_shield', '{"uses": 1}', 'epic'),
('Pergamino de Iluminación', 'Te otorga 500 XP de forma instantánea.', '📜', 450, 'instant_xp', '{"amount": 500}', 'common'),
('Cristal de Energía', 'Restaura tu barra de energía al máximo.', '💎', 800, 'energy_boost', '{"amount": 100}', 'rare');

-- Agregar monedas panda al perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS panda_coins INTEGER DEFAULT 0;

-- Crear tabla para la tienda personalizada de premios reales
CREATE TABLE IF NOT EXISTS public.custom_rewards_shop (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '🎁',
    coin_cost INTEGER NOT NULL DEFAULT 1,
    is_redeemed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.custom_rewards_shop ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Usuarios pueden gestionar sus propios premios personalizados" 
ON public.custom_rewards_shop 
FOR ALL 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_custom_rewards_shop_updated_at
BEFORE UPDATE ON public.custom_rewards_shop
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
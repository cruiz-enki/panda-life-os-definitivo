
-- 1) user_identities table
CREATE TABLE public.user_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_key TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, identity_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_identities TO authenticated;
GRANT ALL ON public.user_identities TO service_role;

ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own identities"
  ON public.user_identities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_identities_updated_at
  BEFORE UPDATE ON public.user_identities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) identity_key column on templates + queue
ALTER TABLE public.notification_templates
  ADD COLUMN IF NOT EXISTS identity_key TEXT;

ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS identity_key TEXT;

-- 3) Add focus identity on notification_preferences (weekly focus)
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS focus_identity_key TEXT;

-- 4) Seed identity-based templates (one per identity)
INSERT INTO public.notification_templates
  (module_key, notification_type, tone, title, body, priority, is_active, identity_key, deep_link)
VALUES
  ('projects','insight','epic','👑 Mensaje del CEO','Los sistemas crean libertad. Una acción pequeña hoy reduce caos mañana.',5,true,'ceo','/projects'),
  ('projects','insight','friendly','🤖 Builder','Panda se construye una mejora a la vez. Avanza 10 minutos.',5,true,'builder','/projects'),
  ('learning','insight','friendly','📚 Aprendiz','Tu mente también necesita entrenamiento diario.',5,true,'learner','/learnings'),
  ('health','insight','epic','🏋️ Guerrero de salud','Operación Fénix sigue viva. Una victoria mínima cuenta.',5,true,'health_warrior','/health'),
  ('home','insight','friendly','🏠 Guardián del hogar','Tu casa también refleja tu energía. Recupera un pequeño espacio.',5,true,'home_guardian','/home'),
  ('goals','future_self','emotional','🔮 Yo futuro','Soy tu versión futura. Gracias por no abandonar hoy.',6,true,'future_self','/goals'),
  ('money','insight','serious','💰 Guardián financiero','La claridad financiera se construye con pequeños registros.',5,true,'money_guardian','/finance')
ON CONFLICT DO NOTHING;

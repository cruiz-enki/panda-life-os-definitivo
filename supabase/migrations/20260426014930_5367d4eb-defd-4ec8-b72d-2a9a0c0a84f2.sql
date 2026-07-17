-- Custom quests (misiones personalizadas)
CREATE TABLE public.custom_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎯',
  xp INTEGER NOT NULL DEFAULT 50,
  target INTEGER NOT NULL DEFAULT 1,
  -- tracking: 'manual' o 'auto'
  tracking TEXT NOT NULL DEFAULT 'manual',
  -- métrica para auto: 'tasks_completed', 'habits_completed', 'notes_created', 'learnings_added', 'energy_logged', 'xp_earned'
  metric TEXT,
  -- alcance temporal: 'weekly', 'monthly', 'once'
  scope TEXT NOT NULL DEFAULT 'weekly',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own custom_quests select" ON public.custom_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own custom_quests insert" ON public.custom_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own custom_quests update" ON public.custom_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own custom_quests delete" ON public.custom_quests FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER tg_custom_quests_updated BEFORE UPDATE ON public.custom_quests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custom achievements (logros personalizados)
CREATE TABLE public.custom_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🏆',
  xp INTEGER NOT NULL DEFAULT 100,
  rarity TEXT NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  category TEXT NOT NULL DEFAULT 'meta', -- habits, tasks, notes, energy, learning, level, meta
  -- condición auto opcional: { metric, target }
  metric TEXT,
  target INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own custom_ach select" ON public.custom_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own custom_ach insert" ON public.custom_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own custom_ach update" ON public.custom_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own custom_ach delete" ON public.custom_achievements FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER tg_custom_ach_updated BEFORE UPDATE ON public.custom_achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Defaults ocultos (para "coexisten + ocultar")
CREATE TABLE public.hidden_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL, -- 'quest' | 'achievement'
  default_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, default_id)
);
ALTER TABLE public.hidden_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hidden select" ON public.hidden_defaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own hidden insert" ON public.hidden_defaults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hidden delete" ON public.hidden_defaults FOR DELETE USING (auth.uid() = user_id);

-- Tienda de premios
CREATE TABLE public.rewards_shop (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎁',
  cost INTEGER NOT NULL DEFAULT 100,
  category TEXT NOT NULL DEFAULT 'treat', -- treat, experience, purchase, time, other
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards_shop ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rewards select" ON public.rewards_shop FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own rewards insert" ON public.rewards_shop FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rewards update" ON public.rewards_shop FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own rewards delete" ON public.rewards_shop FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER tg_rewards_updated BEFORE UPDATE ON public.rewards_shop
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Historial de canjes (sin restar XP, solo registro de "desbloqueado")
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL,
  reward_name TEXT NOT NULL,
  reward_emoji TEXT NOT NULL DEFAULT '🎁',
  cost INTEGER NOT NULL,
  xp_at_unlock INTEGER NOT NULL,
  fulfilled BOOLEAN NOT NULL DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own redemptions select" ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own redemptions insert" ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own redemptions update" ON public.reward_redemptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own redemptions delete" ON public.reward_redemptions FOR DELETE USING (auth.uid() = user_id);

-- Progreso manual de quests personalizadas (reutilizamos quest_progress existente con quest_id = 'custom:<uuid>')
-- No requiere cambios de schema.

CREATE INDEX idx_custom_quests_user ON public.custom_quests(user_id, active);
CREATE INDEX idx_custom_ach_user ON public.custom_achievements(user_id, active);
CREATE INDEX idx_rewards_user ON public.rewards_shop(user_id, active);
CREATE INDEX idx_redemptions_user ON public.reward_redemptions(user_id, created_at DESC);
CREATE INDEX idx_hidden_user ON public.hidden_defaults(user_id, kind);
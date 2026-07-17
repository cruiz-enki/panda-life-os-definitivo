-- Battle Pass system
CREATE TABLE public.battle_pass_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  focus TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎖️',
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  motivational_messages TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_pass_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read seasons" ON public.battle_pass_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner insert seasons" ON public.battle_pass_seasons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner update seasons" ON public.battle_pass_seasons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner delete seasons" ON public.battle_pass_seasons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER tg_bp_seasons_upd BEFORE UPDATE ON public.battle_pass_seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.battle_pass_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  xp_required INTEGER NOT NULL,
  reward_text TEXT NOT NULL DEFAULT '',
  reward_emoji TEXT NOT NULL DEFAULT '🎁',
  reward_id UUID REFERENCES public.rewards_shop(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, level)
);
ALTER TABLE public.battle_pass_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read levels" ON public.battle_pass_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner write levels" ON public.battle_pass_levels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.battle_pass_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎯',
  mission_type TEXT NOT NULL DEFAULT 'daily', -- daily | secondary | challenge
  xp INTEGER NOT NULL DEFAULT 25,
  target INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_pass_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read missions" ON public.battle_pass_missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner write missions" ON public.battle_pass_missions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER tg_bp_missions_upd BEFORE UPDATE ON public.battle_pass_missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user mission progress; period_key = YYYY-MM-DD (daily) or 'season' (secondary/challenge)
CREATE TABLE public.battle_pass_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.battle_pass_missions(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, period_key)
);
ALTER TABLE public.battle_pass_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bpmp all" ON public.battle_pass_mission_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tg_bpmp_upd BEFORE UPDATE ON public.battle_pass_mission_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user unlocks (when user reaches a level and claims)
CREATE TABLE public.battle_pass_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redemption_id UUID REFERENCES public.reward_redemptions(id) ON DELETE SET NULL,
  UNIQUE (user_id, season_id, level)
);
ALTER TABLE public.battle_pass_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bpu all" ON public.battle_pass_unlocks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Streak tracker per user/season
CREATE TABLE public.battle_pass_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);
ALTER TABLE public.battle_pass_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bps all" ON public.battle_pass_streaks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tg_bps_upd BEFORE UPDATE ON public.battle_pass_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bp_levels_season ON public.battle_pass_levels(season_id, level);
CREATE INDEX idx_bp_missions_season ON public.battle_pass_missions(season_id, active);
CREATE INDEX idx_bpmp_user ON public.battle_pass_mission_progress(user_id, period_key);
CREATE INDEX idx_bpu_user ON public.battle_pass_unlocks(user_id, season_id);
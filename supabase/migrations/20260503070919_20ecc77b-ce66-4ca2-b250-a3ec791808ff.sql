CREATE TABLE public.streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_for_date date,
  cost_xp integer NOT NULL DEFAULT 500
);

ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own freezes select" ON public.streak_freezes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own freezes insert" ON public.streak_freezes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own freezes update" ON public.streak_freezes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own freezes delete" ON public.streak_freezes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_streak_freezes_user ON public.streak_freezes(user_id);
CREATE INDEX idx_streak_freezes_used_date ON public.streak_freezes(user_id, used_for_date);
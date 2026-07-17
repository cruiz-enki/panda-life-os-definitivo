-- Psychology sessions
CREATE TABLE public.psych_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  psychologist TEXT NOT NULL DEFAULT '',
  main_topic TEXT NOT NULL DEFAULT '',
  subtopics TEXT[] NOT NULL DEFAULT '{}',
  insight TEXT NOT NULL DEFAULT '',
  agreements TEXT NOT NULL DEFAULT '',
  impact SMALLINT NOT NULL DEFAULT 3,
  next_session DATE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psych_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own psych_sessions select" ON public.psych_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own psych_sessions insert" ON public.psych_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own psych_sessions update" ON public.psych_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own psych_sessions delete" ON public.psych_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_psych_sessions_user_date ON public.psych_sessions(user_id, date DESC);
CREATE TRIGGER trg_psych_sessions_updated BEFORE UPDATE ON public.psych_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily psych check-ins
CREATE TABLE public.psych_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  anxiety SMALLINT NOT NULL DEFAULT 0,
  stress SMALLINT NOT NULL DEFAULT 0,
  dominant_emotion TEXT NOT NULL DEFAULT '',
  trigger TEXT NOT NULL DEFAULT '',
  dominant_thought TEXT NOT NULL DEFAULT '',
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psych_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own psych_checkins select" ON public.psych_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own psych_checkins insert" ON public.psych_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own psych_checkins update" ON public.psych_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own psych_checkins delete" ON public.psych_checkins FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_psych_checkins_user_date ON public.psych_checkins(user_id, date DESC);
CREATE TRIGGER trg_psych_checkins_updated BEFORE UPDATE ON public.psych_checkins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Psych tasks/agreements (links to session)
CREATE TABLE public.psych_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psych_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own psych_tasks select" ON public.psych_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own psych_tasks insert" ON public.psych_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own psych_tasks update" ON public.psych_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own psych_tasks delete" ON public.psych_tasks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_psych_tasks_user_status ON public.psych_tasks(user_id, status);
CREATE TRIGGER trg_psych_tasks_updated BEFORE UPDATE ON public.psych_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
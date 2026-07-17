-- Perfil de identidad (configuración base)
CREATE TABLE public.identity_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  desired_identity TEXT NOT NULL DEFAULT '',
  core_values TEXT[] NOT NULL DEFAULT '{}',
  active_areas TEXT[] NOT NULL DEFAULT ARRAY['finanzas','salud','negocio','mental','relaciones','proposito','ocio'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.identity_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ip select" ON public.identity_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ip insert" ON public.identity_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ip update" ON public.identity_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ip delete" ON public.identity_profile FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_identity_profile_updated_at BEFORE UPDATE ON public.identity_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rueda de la vida (calificaciones por área y mes)
CREATE TABLE public.identity_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area TEXT NOT NULL,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 10),
  month TEXT NOT NULL, -- YYYY-MM
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, area, month)
);
ALTER TABLE public.identity_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ia select" ON public.identity_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ia insert" ON public.identity_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ia update" ON public.identity_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ia delete" ON public.identity_areas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_identity_areas_updated_at BEFORE UPDATE ON public.identity_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_identity_areas_user_month ON public.identity_areas(user_id, month);

-- Diario guiado
CREATE TABLE public.identity_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  did_well TEXT NOT NULL DEFAULT '',
  did_not_well TEXT NOT NULL DEFAULT '',
  learned TEXT NOT NULL DEFAULT '',
  energy SMALLINT CHECK (energy IS NULL OR (energy >= 1 AND energy <= 10)),
  emotion TEXT NOT NULL DEFAULT '',
  alignment SMALLINT NOT NULL DEFAULT 5 CHECK (alignment >= 1 AND alignment <= 10),
  insight TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.identity_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ij select" ON public.identity_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ij insert" ON public.identity_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ij update" ON public.identity_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ij delete" ON public.identity_journal FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_identity_journal_updated_at BEFORE UPDATE ON public.identity_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_identity_journal_user_date ON public.identity_journal(user_id, date DESC);

-- Reflexión semanal (generada con IA)
CREATE TABLE public.identity_weekly_reflection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_key TEXT NOT NULL, -- YYYY-Www
  analysis TEXT NOT NULL DEFAULT '',
  patterns TEXT NOT NULL DEFAULT '',
  recommendations TEXT NOT NULL DEFAULT '',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_key)
);
ALTER TABLE public.identity_weekly_reflection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own iwr select" ON public.identity_weekly_reflection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own iwr insert" ON public.identity_weekly_reflection FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own iwr update" ON public.identity_weekly_reflection FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own iwr delete" ON public.identity_weekly_reflection FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_identity_weekly_reflection_updated_at BEFORE UPDATE ON public.identity_weekly_reflection FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Score snapshots diarios
CREATE TABLE public.identity_score_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100),
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.identity_score_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own iss select" ON public.identity_score_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own iss insert" ON public.identity_score_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own iss update" ON public.identity_score_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own iss delete" ON public.identity_score_snapshots FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_identity_score_user_date ON public.identity_score_snapshots(user_id, date DESC);

-- Body composition entries
CREATE TABLE public.health_body_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC,
  bmi NUMERIC,
  body_fat NUMERIC,
  muscle_mass NUMERIC,
  visceral_fat NUMERIC,
  metabolic_age INTEGER,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_body_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own body select" ON public.health_body_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own body insert" ON public.health_body_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own body update" ON public.health_body_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own body delete" ON public.health_body_entries FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_health_body_updated BEFORE UPDATE ON public.health_body_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_health_body_user_date ON public.health_body_entries(user_id, date DESC);

-- Meals
CREATE TABLE public.health_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT DEFAULT '',
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  classification TEXT NOT NULL DEFAULT 'regular',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meals select" ON public.health_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own meals insert" ON public.health_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own meals update" ON public.health_meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own meals delete" ON public.health_meals FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_health_meals_user_date ON public.health_meals(user_id, date DESC);

-- Medications catalog
CREATE TABLE public.health_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dose TEXT DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'daily',
  times_per_day INTEGER NOT NULL DEFAULT 1,
  schedule_times TEXT[] NOT NULL DEFAULT '{}',
  emoji TEXT NOT NULL DEFAULT '💊',
  color TEXT NOT NULL DEFAULT 'oklch(0.7 0.15 200)',
  notes TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meds select" ON public.health_medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own meds insert" ON public.health_medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own meds update" ON public.health_medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own meds delete" ON public.health_medications FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_health_meds_updated BEFORE UPDATE ON public.health_medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medication intake logs
CREATE TABLE public.health_medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TEXT DEFAULT '',
  taken BOOLEAN NOT NULL DEFAULT true,
  taken_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own medlog select" ON public.health_medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own medlog insert" ON public.health_medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own medlog update" ON public.health_medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own medlog delete" ON public.health_medication_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_health_medlog_user_date ON public.health_medication_logs(user_id, date DESC);
CREATE INDEX idx_health_medlog_med ON public.health_medication_logs(medication_id);

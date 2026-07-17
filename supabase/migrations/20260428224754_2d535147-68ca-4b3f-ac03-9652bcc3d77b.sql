CREATE TABLE public.health_symptoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL DEFAULT '',
  intensity SMALLINT NOT NULL DEFAULT 0 CHECK (intensity >= 0 AND intensity <= 5),
  time_of_day TEXT NOT NULL DEFAULT 'morning' CHECK (time_of_day IN ('morning','afternoon','night')),
  duration TEXT NOT NULL DEFAULT 'brief' CHECK (duration IN ('brief','hours','all_day')),
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own symptoms select" ON public.health_symptoms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own symptoms insert" ON public.health_symptoms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own symptoms update" ON public.health_symptoms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own symptoms delete" ON public.health_symptoms FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_health_symptoms_user_date ON public.health_symptoms(user_id, date DESC);

CREATE TRIGGER update_health_symptoms_updated_at
  BEFORE UPDATE ON public.health_symptoms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
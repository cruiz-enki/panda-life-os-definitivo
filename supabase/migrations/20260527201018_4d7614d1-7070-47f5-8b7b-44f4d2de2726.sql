
CREATE TABLE public.lab_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  lab_name TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_studies_user_date ON public.lab_studies(user_id, date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_studies TO authenticated;
GRANT ALL ON public.lab_studies TO service_role;

ALTER TABLE public.lab_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own lab studies" ON public.lab_studies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own lab studies" ON public.lab_studies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own lab studies" ON public.lab_studies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own lab studies" ON public.lab_studies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_lab_studies_updated_at BEFORE UPDATE ON public.lab_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_id UUID NOT NULL REFERENCES public.lab_studies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  indicator_key TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  category TEXT,
  value NUMERIC,
  value_text TEXT,
  unit TEXT,
  ref_min NUMERIC,
  ref_max NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_results_user_indicator ON public.lab_results(user_id, indicator_key);
CREATE INDEX idx_lab_results_study ON public.lab_results(study_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own lab results" ON public.lab_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own lab results" ON public.lab_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own lab results" ON public.lab_results FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own lab results" ON public.lab_results FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for lab PDFs (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-files', 'lab-files', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own lab files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lab-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own lab files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lab-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own lab files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lab-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own lab files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lab-files' AND auth.uid()::text = (storage.foldername(name))[1]);

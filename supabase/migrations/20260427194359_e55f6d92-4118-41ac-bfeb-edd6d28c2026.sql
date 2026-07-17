-- ============ ENRIQUECER health_medications ============
ALTER TABLE public.health_medications
  ADD COLUMN IF NOT EXISTS doctor_id uuid,
  ADD COLUMN IF NOT EXISTS diagnosis_id uuid,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS side_effects text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- ============ medical_doctors ============
CREATE TABLE public.medical_doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  clinic text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🩺',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own doctors select" ON public.medical_doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own doctors insert" ON public.medical_doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own doctors update" ON public.medical_doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own doctors delete" ON public.medical_doctors FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medical_doctors_updated BEFORE UPDATE ON public.medical_doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ medical_diagnoses ============
CREATE TABLE public.medical_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  doctor_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dx select" ON public.medical_diagnoses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own dx insert" ON public.medical_diagnoses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own dx update" ON public.medical_diagnoses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own dx delete" ON public.medical_diagnoses FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medical_diagnoses_updated BEFORE UPDATE ON public.medical_diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ medical_consultations ============
CREATE TABLE public.medical_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  doctor_id uuid,
  reason text NOT NULL DEFAULT '',
  symptoms text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  indications text NOT NULL DEFAULT '',
  prescribed_meds text NOT NULL DEFAULT '',
  requested_studies text NOT NULL DEFAULT '',
  next_appointment date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consult select" ON public.medical_consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own consult insert" ON public.medical_consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own consult update" ON public.medical_consultations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own consult delete" ON public.medical_consultations FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medical_consultations_updated BEFORE UPDATE ON public.medical_consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ medical_treatments ============
CREATE TABLE public.medical_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT '',
  doctor_id uuid,
  diagnosis_id uuid,
  frequency text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  indications text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own treat select" ON public.medical_treatments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own treat insert" ON public.medical_treatments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own treat update" ON public.medical_treatments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own treat delete" ON public.medical_treatments FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medical_treatments_updated BEFORE UPDATE ON public.medical_treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ medical_studies ============
CREATE TABLE public.medical_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  doctor_id uuid,
  result text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own studies select" ON public.medical_studies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own studies insert" ON public.medical_studies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own studies update" ON public.medical_studies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own studies delete" ON public.medical_studies FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medical_studies_updated BEFORE UPDATE ON public.medical_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ medical_appointments ============
CREATE TABLE public.medical_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  doctor_id uuid,
  date date NOT NULL,
  time text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_days_before int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own appts select" ON public.medical_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own appts insert" ON public.medical_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own appts update" ON public.medical_appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own appts delete" ON public.medical_appointments FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medical_appointments_updated BEFORE UPDATE ON public.medical_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_medical_consult_user_date ON public.medical_consultations(user_id, date DESC);
CREATE INDEX idx_medical_appts_user_date ON public.medical_appointments(user_id, date);
CREATE INDEX idx_medical_studies_user_date ON public.medical_studies(user_id, date DESC);
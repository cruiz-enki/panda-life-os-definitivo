-- =========================================================
-- Sleep, Mood y Time Tracking (bloques manuales)
-- Corre este SQL en el SQL Editor de tu Supabase O guárdalo como
-- supabase/migrations/20260717000000_sleep_mood_time.sql en tu clon
-- y ejecuta `supabase db push`.
-- =========================================================

-- =============== sleep_logs ===============
CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  quality SMALLINT CHECK (quality BETWEEN 1 AND 5),
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sleep select" ON public.sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sleep insert" ON public.sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sleep update" ON public.sleep_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sleep delete" ON public.sleep_logs FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sleep_updated BEFORE UPDATE ON public.sleep_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== mood_logs ===============
CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mood TEXT NOT NULL,
  intensity SMALLINT CHECK (intensity BETWEEN 1 AND 5) DEFAULT 3,
  tags TEXT[] NOT NULL DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mood_logs_user_time ON public.mood_logs(user_id, logged_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
GRANT ALL ON public.mood_logs TO service_role;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mood select" ON public.mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own mood insert" ON public.mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own mood update" ON public.mood_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own mood delete" ON public.mood_logs FOR DELETE USING (auth.uid() = user_id);

-- =============== time_blocks ===============
CREATE TABLE public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  category TEXT NOT NULL,
  identity_area TEXT,
  project TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_blocks_user_date ON public.time_blocks(user_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_blocks TO authenticated;
GRANT ALL ON public.time_blocks TO service_role;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own time select" ON public.time_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own time insert" ON public.time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own time update" ON public.time_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own time delete" ON public.time_blocks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_time_blocks_updated BEFORE UPDATE ON public.time_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Ubicaciones / Check-ins — lugares visitados, minimapa de vida.
-- Corre este SQL en el SQL Editor de tu Supabase (o guárdalo como
-- supabase/migrations/20260718000000_location_checkins.sql y ejecuta
-- `supabase db push`).
-- =========================================================

CREATE TABLE public.location_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ciudad',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  place_id TEXT,
  visited_at DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_location_checkins_user_date ON public.location_checkins(user_id, visited_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_checkins TO authenticated;
GRANT ALL ON public.location_checkins TO service_role;
ALTER TABLE public.location_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checkins select" ON public.location_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own checkins insert" ON public.location_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own checkins update" ON public.location_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own checkins delete" ON public.location_checkins FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_location_checkins_updated BEFORE UPDATE ON public.location_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

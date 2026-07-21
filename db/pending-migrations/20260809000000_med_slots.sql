-- =========================================================
-- Med Slots — agrupa medicinas en "tomas" (AM, PM, etc.)
-- para notificar una sola vez por bloque y disparar en batch
-- desde deep links (/quick/slot?key=am).
-- =========================================================

CREATE TABLE IF NOT EXISTS public.med_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,                     -- 'am', 'pm', 'md', etc.
  label text NOT NULL,                   -- 'Toma AM'
  emoji text DEFAULT '💊',
  time time NOT NULL,                    -- 08:00, 22:00
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

CREATE TABLE IF NOT EXISTS public.med_slot_items (
  slot_id uuid NOT NULL REFERENCES public.med_slots(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES public.health_medications(id) ON DELETE CASCADE,
  PRIMARY KEY (slot_id, medication_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.med_slots TO authenticated;
GRANT ALL ON public.med_slots TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.med_slot_items TO authenticated;
GRANT ALL ON public.med_slot_items TO service_role;

ALTER TABLE public.med_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_slot_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own med_slots" ON public.med_slots
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own med_slot_items" ON public.med_slot_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.med_slots s WHERE s.id = slot_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.med_slots s WHERE s.id = slot_id AND s.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_med_slots_user ON public.med_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_med_slot_items_slot ON public.med_slot_items(slot_id);

-- =========================================================
-- Seed AM/PM para Carlos con sus medicinas actuales
-- =========================================================
DO $$
DECLARE
  uid uuid := '49aef7da-d1c7-4adc-b3d2-fb741b9b35df';
  am_id uuid;
  pm_id uuid;
BEGIN
  INSERT INTO public.med_slots (user_id, key, label, emoji, time)
  VALUES (uid, 'am', 'Toma AM', '🌅', '08:00')
  ON CONFLICT (user_id, key) DO UPDATE SET label = EXCLUDED.label
  RETURNING id INTO am_id;

  INSERT INTO public.med_slots (user_id, key, label, emoji, time)
  VALUES (uid, 'pm', 'Toma PM', '🌙', '22:00')
  ON CONFLICT (user_id, key) DO UPDATE SET label = EXCLUDED.label
  RETURNING id INTO pm_id;

  -- Vincula medicinas según su horario existente
  INSERT INTO public.med_slot_items (slot_id, medication_id)
  SELECT am_id, m.id FROM public.health_medications m
  WHERE m.user_id = uid AND m.active = true
    AND '08:00' = ANY(m.schedule_times)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.med_slot_items (slot_id, medication_id)
  SELECT pm_id, m.id FROM public.health_medications m
  WHERE m.user_id = uid AND m.active = true
    AND ('22:00' = ANY(m.schedule_times) OR '22:30' = ANY(m.schedule_times))
  ON CONFLICT DO NOTHING;
END $$;

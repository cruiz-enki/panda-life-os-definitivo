-- =========================================================
-- Migración: consolidar check-in de psicología en mood_logs
-- Añade ansiedad (0..5), estrés (0..5), trigger y pensamiento dominante.
-- Correlo en el SQL Editor de tu Supabase.
-- =========================================================

ALTER TABLE public.mood_logs
  ADD COLUMN IF NOT EXISTS anxiety          SMALLINT CHECK (anxiety BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS stress           SMALLINT CHECK (stress  BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS trigger          TEXT,
  ADD COLUMN IF NOT EXISTS dominant_thought TEXT;

-- Migra los check-ins de psicología existentes hacia mood_logs.
-- Toma la hora local (mediodía) sobre la fecha del check-in para tener un timestamp válido.
INSERT INTO public.mood_logs (user_id, logged_at, mood, intensity, tags, note, anxiety, stress, trigger, dominant_thought)
SELECT
  c.user_id,
  (c.date::timestamp + INTERVAL '12 hours') AT TIME ZONE 'America/Mexico_City',
  CASE
    WHEN c.anxiety >= 4 OR c.stress >= 4 THEN 'bad'
    WHEN c.anxiety >= 3 OR c.stress >= 3 THEN 'low'
    WHEN c.anxiety >= 2 OR c.stress >= 2 THEN 'meh'
    WHEN c.dominant_emotion IN ('calma','alegria','esperanza','gratitud') THEN 'good'
    ELSE 'meh'
  END,
  GREATEST(1, LEAST(5, COALESCE(NULLIF(GREATEST(c.anxiety, c.stress), 0), 3))),
  CASE WHEN c.dominant_emotion IS NOT NULL AND c.dominant_emotion <> ''
       THEN ARRAY[c.dominant_emotion]::text[]
       ELSE '{}'::text[] END,
  NULLIF(c.dominant_thought, ''),
  c.anxiety,
  c.stress,
  NULLIF(c.trigger, ''),
  NULLIF(c.dominant_thought, '')
FROM public.psych_checkins c
WHERE NOT EXISTS (
  SELECT 1 FROM public.mood_logs m
  WHERE m.user_id = c.user_id
    AND (m.logged_at AT TIME ZONE 'America/Mexico_City')::date = c.date
    AND m.anxiety IS NOT NULL
);

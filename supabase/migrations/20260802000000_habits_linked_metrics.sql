-- Vincula hábitos a métricas medibles (agua, ejercicio, proteína, sueño, meds…)
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS linked_metric text,
  ADD COLUMN IF NOT EXISTS target_value numeric;

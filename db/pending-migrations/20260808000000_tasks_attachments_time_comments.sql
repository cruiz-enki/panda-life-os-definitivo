-- Tareas: adjuntos (foto/PDF/link), comentarios con checklist anidado,
-- time tracking y minutos reales para comparar contra la estimación.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS attachments   jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS comments      jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS time_entries  jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS actual_minutes integer;

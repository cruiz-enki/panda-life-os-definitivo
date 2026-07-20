-- Recordatorios de tareas: canales configurables + dedupe por offset ya enviado.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reminder_channels jsonb NOT NULL DEFAULT '["push"]'::jsonb,
  ADD COLUMN IF NOT EXISTS reminders_sent jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tasks_due_pending
  ON public.tasks(due)
  WHERE due IS NOT NULL AND status = 'pending';

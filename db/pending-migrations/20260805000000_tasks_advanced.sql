-- Tareas avanzadas: start date, duración, múltiples recordatorios, snooze.
-- La columna `recurrence` ya es JSONB, así que los campos extendidos
-- (byWeekday, monthlyMode, fromCompletion) no requieren cambio de schema.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_tasks_snoozed_until
  ON public.tasks(snoozed_until)
  WHERE snoozed_until IS NOT NULL;

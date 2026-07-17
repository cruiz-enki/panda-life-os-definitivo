-- Add scheduling capability to home tasks
ALTER TABLE public.home_tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Update RLS and ensure indices for performance
CREATE INDEX IF NOT EXISTS idx_home_tasks_scheduled_date ON public.home_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_home_completions_task_id_date ON public.home_completions(task_id, completed_date);
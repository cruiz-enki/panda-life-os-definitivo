-- Pinned/favoritas, orden manual persistente y listas anidadas (proyectos/carpetas).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order double precision;

CREATE INDEX IF NOT EXISTS idx_tasks_pinned ON public.tasks(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(sort_order);

ALTER TABLE public.task_lists
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.task_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order double precision;

CREATE INDEX IF NOT EXISTS idx_task_lists_parent_id ON public.task_lists(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_sort_order ON public.task_lists(sort_order);

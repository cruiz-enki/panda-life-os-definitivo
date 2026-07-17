-- Áreas del hogar (cocina, baño, recámara, etc.)
CREATE TABLE public.home_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🏠',
  color text NOT NULL DEFAULT 'oklch(0.7 0.15 200)',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.home_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own home_areas select" ON public.home_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own home_areas insert" ON public.home_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own home_areas update" ON public.home_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own home_areas delete" ON public.home_areas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_home_areas_updated
  BEFORE UPDATE ON public.home_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tareas del hogar
-- task_type: routine (diaria), weekly, block (limpieza profunda de un área), pets, project
-- frequency: daily, weekly, biweekly, monthly, custom
CREATE TABLE public.home_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  area_id uuid REFERENCES public.home_areas(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  task_type text NOT NULL DEFAULT 'routine',
  frequency text NOT NULL DEFAULT 'daily',
  day_of_week smallint, -- 0=domingo .. 6=sábado, para weekly
  xp_reward integer NOT NULL DEFAULT 5,
  is_key boolean NOT NULL DEFAULT false, -- tarea clave para MVD
  active boolean NOT NULL DEFAULT true,
  emoji text NOT NULL DEFAULT '✨',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_home_tasks_user_active ON public.home_tasks(user_id, active);
CREATE INDEX idx_home_tasks_area ON public.home_tasks(area_id);

ALTER TABLE public.home_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own home_tasks select" ON public.home_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own home_tasks insert" ON public.home_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own home_tasks update" ON public.home_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own home_tasks delete" ON public.home_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_home_tasks_updated
  BEFORE UPDATE ON public.home_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Completaciones de tareas del hogar
CREATE TABLE public.home_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.home_tasks(id) ON DELETE CASCADE,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  xp_awarded integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_home_completions_user_date ON public.home_completions(user_id, completed_date DESC);
CREATE INDEX idx_home_completions_task ON public.home_completions(task_id);

ALTER TABLE public.home_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own home_completions select" ON public.home_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own home_completions insert" ON public.home_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own home_completions update" ON public.home_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own home_completions delete" ON public.home_completions FOR DELETE USING (auth.uid() = user_id);
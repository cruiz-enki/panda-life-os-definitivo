-- =============== Helpers ===============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============== profiles ===============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-crear profile al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== habits ===============
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  points INTEGER NOT NULL DEFAULT 10,
  streak INTEGER NOT NULL DEFAULT 0,
  last_completed DATE,
  history DATE[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_habits_user ON public.habits(user_id);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits select" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own habits insert" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own habits update" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own habits delete" ON public.habits FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_habits_updated BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== task_lists ===============
CREATE TABLE public.task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📋',
  color TEXT NOT NULL DEFAULT 'oklch(0.7 0.18 220)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_lists_user ON public.task_lists(user_id);
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own task_lists select" ON public.task_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own task_lists insert" ON public.task_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own task_lists update" ON public.task_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own task_lists delete" ON public.task_lists FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_task_lists_updated BEFORE UPDATE ON public.task_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== tags ===============
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'oklch(0.7 0.18 220)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tags_user ON public.tags(user_id);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tags select" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tags insert" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tags update" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own tags delete" ON public.tags FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_tags_updated BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== tasks ===============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  list_id UUID REFERENCES public.task_lists(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  reminder INTEGER,
  recurrence JSONB,
  xp_reward INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_tasks_due ON public.tasks(due);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks select" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tasks insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own tasks delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== notes ===============
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'note',
  category TEXT NOT NULL DEFAULT 'personal',
  importance TEXT NOT NULL DEFAULT 'normal',
  tags TEXT[] NOT NULL DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_note_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notes_user ON public.notes(user_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes select" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own notes insert" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notes update" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own notes delete" ON public.notes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== learnings ===============
CREATE TABLE public.learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_learnings_user ON public.learnings(user_id);
ALTER TABLE public.learnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learnings select" ON public.learnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own learnings insert" ON public.learnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own learnings update" ON public.learnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own learnings delete" ON public.learnings FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_learnings_updated BEFORE UPDATE ON public.learnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== energy_entries ===============
CREATE TABLE public.energy_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  physical INTEGER NOT NULL,
  mental INTEGER NOT NULL,
  emotional INTEGER NOT NULL,
  sleep INTEGER,
  pain INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX idx_energy_user ON public.energy_entries(user_id);
ALTER TABLE public.energy_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own energy select" ON public.energy_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own energy insert" ON public.energy_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own energy update" ON public.energy_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own energy delete" ON public.energy_entries FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_energy_updated BEFORE UPDATE ON public.energy_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EXERCISES library (global, owner-managed)
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL DEFAULT 'full_body',
  level text NOT NULL DEFAULT 'beginner',
  equipment text NOT NULL DEFAULT 'none',
  instructions text NOT NULL DEFAULT '',
  precautions text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '',
  default_sets integer NOT NULL DEFAULT 3,
  default_reps text NOT NULL DEFAULT '10',
  duration_minutes integer NOT NULL DEFAULT 5,
  xp_reward integer NOT NULL DEFAULT 5,
  emoji text NOT NULL DEFAULT '💪',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner write exercises" ON public.exercises FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role)) WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER trg_exercises_updated BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROUTINES (global, owner-managed)
CREATE TABLE public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  objective text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 30,
  level text NOT NULL DEFAULT 'beginner',
  suggested_days_per_week integer NOT NULL DEFAULT 3,
  xp_total integer NOT NULL DEFAULT 0,
  xp_bonus integer NOT NULL DEFAULT 20,
  emoji text NOT NULL DEFAULT '🏋️',
  color text NOT NULL DEFAULT 'oklch(0.7 0.18 30)',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read routines" ON public.routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner write routines" ON public.routines FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role)) WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER trg_routines_updated BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROUTINE_EXERCISES (global, owner-managed)
CREATE TABLE public.routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10',
  rest_seconds integer NOT NULL DEFAULT 60,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read routine_exercises" ON public.routine_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner write routine_exercises" ON public.routine_exercises FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role)) WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE INDEX idx_routine_exercises_routine ON public.routine_exercises(routine_id);

-- WORKOUT_SCHEDULE (per-user weekly template + date override)
CREATE TABLE public.workout_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  routine_id uuid REFERENCES public.routines(id) ON DELETE CASCADE,
  day_of_week smallint, -- 0..6 for weekly template (NULL when date override)
  scheduled_date date,  -- specific date override (NULL when weekly)
  is_rest boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((day_of_week IS NOT NULL AND scheduled_date IS NULL) OR (day_of_week IS NULL AND scheduled_date IS NOT NULL))
);
ALTER TABLE public.workout_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ws all" ON public.workout_schedule FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ws_user_dow ON public.workout_schedule(user_id, day_of_week);
CREATE INDEX idx_ws_user_date ON public.workout_schedule(user_id, scheduled_date);
CREATE TRIGGER trg_ws_updated BEFORE UPDATE ON public.workout_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WORKOUT_LOGS (per-user)
CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  routine_id uuid REFERENCES public.routines(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean NOT NULL DEFAULT false,
  difficulty smallint, -- 1..5
  energy_before smallint,
  energy_after smallint,
  notes text NOT NULL DEFAULT '',
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wl all" ON public.workout_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_wl_user_date ON public.workout_logs(user_id, date);
CREATE TRIGGER trg_wl_updated BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WORKOUT_EXERCISE_LOGS (per-user)
CREATE TABLE public.workout_exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_log_id uuid NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  completed boolean NOT NULL DEFAULT false,
  sets_done integer NOT NULL DEFAULT 0,
  reps_done text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wel all" ON public.workout_exercise_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_wel_log ON public.workout_exercise_logs(workout_log_id);

-- EXERCISE_USER_PREFS (per-user: avoid / modify)
CREATE TABLE public.exercise_user_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'normal', -- normal | modify | avoid
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);
ALTER TABLE public.exercise_user_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own eup all" ON public.exercise_user_prefs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_eup_updated BEFORE UPDATE ON public.exercise_user_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

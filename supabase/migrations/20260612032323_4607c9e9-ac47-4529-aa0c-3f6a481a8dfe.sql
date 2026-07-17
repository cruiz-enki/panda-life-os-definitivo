
-- ========================================
-- 1) Extender notification_preferences
-- ========================================
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  ADD COLUMN IF NOT EXISTS preferred_morning_time TIME NOT NULL DEFAULT '08:30',
  ADD COLUMN IF NOT EXISTS preferred_evening_time TIME NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS allow_streak_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_quest_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_money_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_home_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_learning_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_health_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_motivational_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_daily_notifications SMALLINT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;

CREATE INDEX IF NOT EXISTS idx_notif_prefs_onesignal ON public.notification_preferences(onesignal_player_id) WHERE onesignal_player_id IS NOT NULL;

-- ========================================
-- 2) streaks
-- ========================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL CHECK (module_key IN ('learning','home','money','health','goals','journal','relationship','habits','identity')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  streak_status TEXT NOT NULL DEFAULT 'active' CHECK (streak_status IN ('active','at_risk','frozen','lost')),
  freeze_days_available SMALLINT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own streaks" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streaks" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streaks" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own streaks" ON public.streaks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON public.streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_status ON public.streaks(streak_status) WHERE streak_status IN ('active','at_risk');
CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 3) notification_templates
-- ========================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder','streak','streak_at_risk','streak_saved','quest','insight','reward','warning','future_self','recovery','momentum')),
  tone TEXT NOT NULL DEFAULT 'panda' CHECK (tone IN ('friendly','funny','emotional','serious','epic','panda')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  trigger_condition TEXT,
  priority SMALLINT NOT NULL DEFAULT 5,
  deep_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read templates" ON public.notification_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE INDEX IF NOT EXISTS idx_templates_module_type ON public.notification_templates(module_key, notification_type) WHERE is_active = true;

-- ========================================
-- 4) notification_queue
-- ========================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  tone TEXT,
  priority SMALLINT NOT NULL DEFAULT 5,
  deep_link TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled','skipped')),
  onesignal_response JSONB,
  error_message TEXT,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_queue TO authenticated;
GRANT ALL ON public.notification_queue TO service_role;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own queue" ON public.notification_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own queue" ON public.notification_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_queue_user_status ON public.notification_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON public.notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_queue_dedupe ON public.notification_queue(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE TRIGGER update_notif_queue_updated_at BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 5) notification_events
-- ========================================
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent','opened','dismissed','failed','clicked')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own events" ON public.notification_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.notification_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON public.notification_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_notif ON public.notification_events(notification_id);

-- ========================================
-- 6) Helper function: bump_streak (registers a completion for a module)
-- ========================================
CREATE OR REPLACE FUNCTION public.bump_streak(_user_id UUID, _module_key TEXT)
RETURNS TABLE(current_streak INT, longest_streak INT, streak_status TEXT, just_continued BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing RECORD;
  _new_current INT;
  _new_longest INT;
  _just_continued BOOLEAN := false;
  _today DATE := (now() AT TIME ZONE 'UTC')::date;
  _last_date DATE;
BEGIN
  SELECT s.current_streak, s.longest_streak, s.last_completed_at, s.streak_status, s.freeze_days_available
    INTO _existing
  FROM public.streaks s
  WHERE s.user_id = _user_id AND s.module_key = _module_key;

  IF _existing IS NULL THEN
    INSERT INTO public.streaks(user_id, module_key, current_streak, longest_streak, last_completed_at, streak_status)
    VALUES (_user_id, _module_key, 1, 1, now(), 'active');
    RETURN QUERY SELECT 1, 1, 'active'::text, true;
    RETURN;
  END IF;

  _last_date := (_existing.last_completed_at AT TIME ZONE 'UTC')::date;

  IF _last_date = _today THEN
    _new_current := _existing.current_streak;
    _just_continued := false;
  ELSIF _last_date = _today - 1 OR (_existing.streak_status = 'frozen' AND _last_date >= _today - 2) THEN
    _new_current := _existing.current_streak + 1;
    _just_continued := true;
  ELSE
    _new_current := 1;
    _just_continued := true;
  END IF;

  _new_longest := GREATEST(_existing.longest_streak, _new_current);

  UPDATE public.streaks
  SET current_streak = _new_current,
      longest_streak = _new_longest,
      last_completed_at = now(),
      streak_status = 'active',
      updated_at = now()
  WHERE user_id = _user_id AND module_key = _module_key;

  RETURN QUERY SELECT _new_current, _new_longest, 'active'::text, _just_continued;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_streak(UUID, TEXT) TO authenticated, service_role;

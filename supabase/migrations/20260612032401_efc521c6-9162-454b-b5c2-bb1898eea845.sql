
REVOKE ALL ON FUNCTION public.bump_streak(UUID, TEXT) FROM PUBLIC, anon;

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
  -- Solo el propio usuario o el service_role pueden mover su racha
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot bump streak for another user';
  END IF;

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

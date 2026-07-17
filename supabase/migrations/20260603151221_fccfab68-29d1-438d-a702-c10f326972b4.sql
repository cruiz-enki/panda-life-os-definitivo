CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    global_notifications_enabled,
    daily_summary_enabled,
    habit_reminders_enabled,
    task_reminders_enabled,
    medical_reminders_enabled,
    meal_reminders_enabled,
    exercise_reminders_enabled,
    identity_reminders_enabled
  ) VALUES (
    NEW.id,
    true, -- global
    true, -- daily summary
    true, -- habits
    true, -- tasks
    true, -- medical
    true, -- meals
    true, -- exercise
    true  -- identity
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Cleanup orphans (if any)
DELETE FROM public.push_subscriptions WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.notification_preferences WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Ensure missing notification_preferences are created for users with subscriptions
INSERT INTO public.notification_preferences (user_id, global_notifications_enabled)
SELECT DISTINCT user_id, true
FROM public.push_subscriptions
WHERE user_id NOT IN (SELECT user_id FROM public.notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Add foreign key from notification_preferences to auth.users
ALTER TABLE public.notification_preferences
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;
ALTER TABLE public.notification_preferences
ADD CONSTRAINT notification_preferences_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Add foreign key from push_subscriptions to auth.users
ALTER TABLE public.push_subscriptions
DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE public.push_subscriptions
ADD CONSTRAINT push_subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Add foreign key from push_subscriptions to notification_preferences for PostgREST join
ALTER TABLE public.push_subscriptions
DROP CONSTRAINT IF EXISTS push_subscriptions_notification_prefs_fkey;
ALTER TABLE public.push_subscriptions
ADD CONSTRAINT push_subscriptions_notification_prefs_fkey
FOREIGN KEY (user_id) REFERENCES public.notification_preferences(user_id) ON DELETE CASCADE;

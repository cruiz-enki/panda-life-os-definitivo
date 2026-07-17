
-- 1. Add missing UPDATE policy on daily_wins
CREATE POLICY "Users can update their own wins"
ON public.daily_wins
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Set fixed search_path on functions missing it
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER functions.
-- These are only meant to be called by the service role or as triggers.
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public._telegram_cron_call(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public._telegram_send_overdue_tasks() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.vault_insert_cron_secret(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.vault_update_cron_secret(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_email_allowlist() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.normalize_allowed_email() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_email_allowed(text) FROM anon, authenticated, public;

-- Keep has_role callable by authenticated since it's used inside RLS policies
-- (RLS evaluation runs as the calling role).

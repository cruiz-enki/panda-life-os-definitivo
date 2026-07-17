CREATE OR REPLACE FUNCTION public.vault_insert_cron_secret(new_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  PERFORM vault.create_secret(new_value, 'CRON_SECRET', 'pg_cron header secret');
END;
$$;

CREATE OR REPLACE FUNCTION public.vault_update_cron_secret(new_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  sid uuid;
BEGIN
  SELECT id INTO sid FROM vault.secrets WHERE name = 'CRON_SECRET' LIMIT 1;
  IF sid IS NULL THEN
    PERFORM vault.create_secret(new_value, 'CRON_SECRET', 'pg_cron header secret');
  ELSE
    PERFORM vault.update_secret(sid, new_value, 'CRON_SECRET', 'pg_cron header secret');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.vault_insert_cron_secret(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_update_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vault_insert_cron_secret(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_update_cron_secret(text) TO service_role;
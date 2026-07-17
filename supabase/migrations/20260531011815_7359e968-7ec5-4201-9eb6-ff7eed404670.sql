
-- hidden_defaults: explicit UPDATE policy restricted to owner
CREATE POLICY "own hidden update" ON public.hidden_defaults
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_inventory: allow owners to delete their rows
CREATE POLICY "Usuarios pueden eliminar su propio inventario" ON public.user_inventory
  FOR DELETE USING (auth.uid() = user_id);

-- telegram_messages: explicitly deny INSERT/UPDATE/DELETE for normal users (service_role bypasses RLS)
CREATE POLICY "Deny client inserts on telegram_messages" ON public.telegram_messages
  FOR INSERT TO authenticated, anon WITH CHECK (false);

CREATE POLICY "Deny client updates on telegram_messages" ON public.telegram_messages
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes on telegram_messages" ON public.telegram_messages
  FOR DELETE TO authenticated, anon USING (false);

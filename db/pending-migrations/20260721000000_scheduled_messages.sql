-- Mensajes programados: el usuario se agenda mensajes a sí mismo por canal
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  channels text[] NOT NULL DEFAULT '{}', -- 'telegram','email','push','inapp','whatsapp'
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|sent|failed|cancelled
  delivery_log jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  inapp_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user ON public.scheduled_messages(user_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_pending ON public.scheduled_messages(status, scheduled_at) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_messages TO authenticated;
GRANT ALL ON public.scheduled_messages TO service_role;

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own scheduled messages select" ON public.scheduled_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own scheduled messages insert" ON public.scheduled_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own scheduled messages update" ON public.scheduled_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own scheduled messages delete" ON public.scheduled_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

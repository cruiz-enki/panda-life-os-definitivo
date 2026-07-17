-- 1. telegram_config (preferencias por usuario)
CREATE TABLE public.telegram_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT,
  notify_overdue_tasks BOOLEAN NOT NULL DEFAULT true,
  notify_time TIME NOT NULL DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_telegram_config_chat_id ON public.telegram_config(chat_id) WHERE chat_id IS NOT NULL;

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own telegram config"
  ON public.telegram_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own telegram config"
  ON public.telegram_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own telegram config"
  ON public.telegram_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own telegram config"
  ON public.telegram_config FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_telegram_config_updated_at
  BEFORE UPDATE ON public.telegram_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. telegram_bot_state (singleton, server-only)
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
-- No policies = nobody can access from client. Service role bypasses.

-- 3. telegram_messages (log de inbound)
CREATE TABLE public.telegram_messages (
  update_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT,
  raw_update JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages(chat_id);
CREATE INDEX idx_telegram_messages_user_id ON public.telegram_messages(user_id);
CREATE INDEX idx_telegram_messages_created_at ON public.telegram_messages(created_at DESC);

ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own telegram messages"
  ON public.telegram_messages FOR SELECT
  USING (auth.uid() = user_id);
-- Inserts/updates only via service role from poll endpoint.
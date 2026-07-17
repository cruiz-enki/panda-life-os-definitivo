
-- 1) Add new columns
ALTER TABLE public.custom_quests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS module_key TEXT,
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS linked_goal_id UUID,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2) Validation constraints (idempotent re-add)
ALTER TABLE public.custom_quests
  DROP CONSTRAINT IF EXISTS custom_quests_status_check;
ALTER TABLE public.custom_quests
  ADD CONSTRAINT custom_quests_status_check
  CHECK (status IN ('active', 'completed', 'paused', 'failed'));

ALTER TABLE public.custom_quests
  DROP CONSTRAINT IF EXISTS custom_quests_priority_check;
ALTER TABLE public.custom_quests
  ADD CONSTRAINT custom_quests_priority_check
  CHECK (priority IN ('low', 'medium', 'high'));

-- 3) Backfill status from existing `active` boolean
UPDATE public.custom_quests
SET status = CASE WHEN active THEN 'active' ELSE 'paused' END
WHERE status = 'active' AND active = false;

-- 4) Index for the notifications engine (per-user, active + due soon)
CREATE INDEX IF NOT EXISTS idx_custom_quests_user_status_due
  ON public.custom_quests (user_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_custom_quests_user_priority
  ON public.custom_quests (user_id, priority)
  WHERE status = 'active';

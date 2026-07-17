-- Gamification: unlocked achievements + weekly quest progress
CREATE TABLE public.achievements_unlocked (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.achievements_unlocked ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ach select" ON public.achievements_unlocked FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ach insert" ON public.achievements_unlocked FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ach delete" ON public.achievements_unlocked FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.quest_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_key text NOT NULL,
  quest_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  claimed boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_key, quest_id)
);

ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own quest select" ON public.quest_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own quest insert" ON public.quest_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quest update" ON public.quest_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own quest delete" ON public.quest_progress FOR DELETE USING (auth.uid() = user_id);
-- Bitácora de contenido consumido
CREATE TABLE public.content_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'book', -- book, movie, series, podcast, article, course, other
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  start_date DATE,
  end_date DATE,
  rating SMALLINT, -- 1..5
  genre TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  key_learnings TEXT DEFAULT '',
  recommend TEXT, -- yes, no, maybe
  tags TEXT[] NOT NULL DEFAULT '{}',
  progress_percent SMALLINT NOT NULL DEFAULT 0, -- 0..100
  current_position TEXT DEFAULT '', -- "Cap 5", "Ep 12", etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own content_log select" ON public.content_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own content_log insert" ON public.content_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own content_log update" ON public.content_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own content_log delete" ON public.content_log FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_content_log_updated_at
  BEFORE UPDATE ON public.content_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'book', -- book, movie, series, podcast, course, product, other
  priority TEXT NOT NULL DEFAULT 'medium', -- high, medium, low
  reason TEXT NOT NULL DEFAULT 'personal', -- recommendation, personal, work, other
  source TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  remind_at DATE,
  purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own wishlist select" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own wishlist insert" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own wishlist update" ON public.wishlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own wishlist delete" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_wishlist_updated_at
  BEFORE UPDATE ON public.wishlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_content_log_user ON public.content_log(user_id, created_at DESC);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id, created_at DESC);
CREATE TABLE public.meal_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🥕',
  category text NOT NULL DEFAULT 'otros',
  default_unit text NOT NULL DEFAULT '',
  default_qty text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ingredients select" ON public.meal_ingredients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ingredients insert" ON public.meal_ingredients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ingredients update" ON public.meal_ingredients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ingredients delete" ON public.meal_ingredients FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_meal_ingredients_updated_at
  BEFORE UPDATE ON public.meal_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_meal_ingredients_user ON public.meal_ingredients(user_id);
CREATE UNIQUE INDEX idx_meal_ingredients_user_name ON public.meal_ingredients(user_id, lower(name));

-- Catálogo de platillos
CREATE TABLE public.meal_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  dish_type TEXT NOT NULL DEFAULT 'quick', -- quick | meal_prep | snack
  classification TEXT NOT NULL DEFAULT 'saludable', -- saludable | regular | chatarra
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, qty, unit, category}]
  preparation TEXT NOT NULL DEFAULT '',
  prep_minutes INT NOT NULL DEFAULT 10,
  servings INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 5,
  notes TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal_dishes all" ON public.meal_dishes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_meal_dishes_upd BEFORE UPDATE ON public.meal_dishes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meal prep batches
CREATE TABLE public.meal_prep_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dish_id UUID REFERENCES public.meal_dishes(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  prep_date DATE NOT NULL DEFAULT CURRENT_DATE,
  days_lasting INT NOT NULL DEFAULT 3,
  servings_total INT NOT NULL DEFAULT 1,
  servings_remaining INT NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_prep_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal_prep_batches all" ON public.meal_prep_batches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_meal_prep_batches_upd BEFORE UPDATE ON public.meal_prep_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Menú semanal
CREATE TABLE public.meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL, -- desayuno | comida | cena | snack
  dish_id UUID REFERENCES public.meal_dishes(id) ON DELETE SET NULL,
  custom_name TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_awarded INT NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal_plan all" ON public.meal_plan FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_meal_plan_upd BEFORE UPDATE ON public.meal_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_meal_plan_user_date ON public.meal_plan(user_id, date);

-- Lista de compras
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL, -- lunes de la semana
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'otros', -- frutas_verduras | proteinas | lacteos | granos | despensa | bebidas | otros
  qty TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  bought BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'auto', -- auto | manual
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shopping_list_items all" ON public.shopping_list_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_shopping_list_items_upd BEFORE UPDATE ON public.shopping_list_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_shopping_list_user_week ON public.shopping_list_items(user_id, week_start);

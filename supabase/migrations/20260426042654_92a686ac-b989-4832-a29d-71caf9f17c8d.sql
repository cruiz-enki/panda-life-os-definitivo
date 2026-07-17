-- ============================================
-- MÓDULO FINANCIERO PERSONAL
-- ============================================

-- TARJETAS DE CRÉDITO
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL DEFAULT '',
  last_four TEXT NOT NULL DEFAULT '',
  credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  cut_day SMALLINT NOT NULL DEFAULT 1, -- día del mes (1-31)
  payment_day SMALLINT NOT NULL DEFAULT 20, -- día del mes (1-31)
  min_payment NUMERIC(12,2) NOT NULL DEFAULT 0,
  no_interest_payment NUMERIC(12,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'oklch(0.7 0.18 260)',
  icon TEXT NOT NULL DEFAULT '💳',
  status TEXT NOT NULL DEFAULT 'active', -- active | paused | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards select" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own cards insert" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cards update" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own cards delete" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CATEGORÍAS DE GASTO (personalizables)
CREATE TABLE public.finance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT 'oklch(0.7 0.15 200)',
  kind TEXT NOT NULL DEFAULT 'expense', -- expense | income
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fcat select" ON public.finance_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own fcat insert" ON public.finance_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own fcat update" ON public.finance_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own fcat delete" ON public.finance_categories FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_finance_categories_updated_at BEFORE UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GASTOS / INGRESOS
CREATE TABLE public.finance_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'otros',
  payment_method TEXT NOT NULL DEFAULT 'cash', -- cash | debit | transfer | credit | mercadopago | other
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  kind TEXT NOT NULL DEFAULT 'expense', -- expense | income
  expense_type TEXT NOT NULL DEFAULT 'normal', -- normal | msi | msi_charge
  msi_plan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fexp select" ON public.finance_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own fexp insert" ON public.finance_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own fexp update" ON public.finance_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own fexp delete" ON public.finance_expenses FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_finance_expenses_updated_at BEFORE UPDATE ON public.finance_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_fexp_user_date ON public.finance_expenses(user_id, date DESC);
CREATE INDEX idx_fexp_card ON public.finance_expenses(card_id);

-- MESES SIN INTERESES
CREATE TABLE public.msi_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  months INTEGER NOT NULL,
  monthly_amount NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'otros',
  note TEXT NOT NULL DEFAULT '',
  paid_months INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active | finished | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.msi_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msi select" ON public.msi_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own msi insert" ON public.msi_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msi update" ON public.msi_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own msi delete" ON public.msi_plans FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_msi_plans_updated_at BEFORE UPDATE ON public.msi_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PAGOS A TARJETAS
CREATE TABLE public.card_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'transfer',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.card_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cpay select" ON public.card_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own cpay insert" ON public.card_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cpay update" ON public.card_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own cpay delete" ON public.card_payments FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cpay_card_date ON public.card_payments(card_id, date DESC);

-- PRESUPUESTOS
CREATE TABLE public.finance_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT, -- NULL = general / total
  amount NUMERIC(12,2) NOT NULL,
  month TEXT NOT NULL, -- 'YYYY-MM'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, month)
);
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fbud select" ON public.finance_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own fbud insert" ON public.finance_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own fbud update" ON public.finance_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own fbud delete" ON public.finance_budgets FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_finance_budgets_updated_at BEFORE UPDATE ON public.finance_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RECORDATORIOS FINANCIEROS
CREATE TABLE public.finance_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- cut | payment | msi | custom
  title TEXT NOT NULL,
  date DATE NOT NULL,
  days_before INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own frem select" ON public.finance_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own frem insert" ON public.finance_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own frem update" ON public.finance_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own frem delete" ON public.finance_reminders FOR DELETE USING (auth.uid() = user_id);
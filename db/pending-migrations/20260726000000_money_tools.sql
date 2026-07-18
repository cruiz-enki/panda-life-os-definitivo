-- Money tools: envelopes (presupuesto tipo sobre), reglas de auto-clasificación
-- y log mensual de carga de gastos recurrentes.
-- Aplicar en Supabase SQL editor tras el pull.

-- ============ 6. Log de carga mensual de gastos recurrentes ============
-- Marca qué recurring_expense se registró en qué mes (YYYY-MM) para detectar faltantes.
create table public.recurring_expense_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recurring_id uuid references public.recurring_expenses(id) on delete cascade not null,
  month text not null, -- YYYY-MM
  expense_id uuid, -- referencia opcional a finance_expenses generado
  loaded_at timestamptz not null default now(),
  unique (recurring_id, month)
);

grant select, insert, update, delete on public.recurring_expense_logs to authenticated;
grant all on public.recurring_expense_logs to service_role;

alter table public.recurring_expense_logs enable row level security;

create policy "rec_exp_logs_owner_select" on public.recurring_expense_logs
  for select to authenticated using (auth.uid() = user_id);
create policy "rec_exp_logs_owner_insert" on public.recurring_expense_logs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "rec_exp_logs_owner_update" on public.recurring_expense_logs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rec_exp_logs_owner_delete" on public.recurring_expense_logs
  for delete to authenticated using (auth.uid() = user_id);

create index rec_exp_logs_user_month_idx on public.recurring_expense_logs(user_id, month);

-- ============ 7. Sobres (envelopes) de presupuesto ============
create table public.budget_envelopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null, -- YYYY-MM ('template' para plantilla base)
  category text not null,
  emoji text default '📦',
  percent numeric(6,3), -- % del ingreso (opcional)
  amount numeric(14,2) not null default 0, -- MXN asignado
  kind text not null default 'need', -- need | want | save
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category)
);

grant select, insert, update, delete on public.budget_envelopes to authenticated;
grant all on public.budget_envelopes to service_role;

alter table public.budget_envelopes enable row level security;

create policy "envelopes_owner_select" on public.budget_envelopes
  for select to authenticated using (auth.uid() = user_id);
create policy "envelopes_owner_insert" on public.budget_envelopes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "envelopes_owner_update" on public.budget_envelopes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "envelopes_owner_delete" on public.budget_envelopes
  for delete to authenticated using (auth.uid() = user_id);

create index envelopes_user_month_idx on public.budget_envelopes(user_id, month);

-- ============ 8. Reglas de auto-clasificación ============
create type public.rule_match_type as enum (
  'note_contains', 'amount_equals', 'amount_on_day'
);

create table public.expense_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  match_type public.rule_match_type not null,
  match_text text, -- para note_contains
  match_amount numeric(14,2), -- para amount_equals / amount_on_day
  match_day int check (match_day between 1 and 31), -- para amount_on_day
  set_category text not null,
  set_tags text[] default '{}',
  priority int not null default 100,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.expense_rules to authenticated;
grant all on public.expense_rules to service_role;

alter table public.expense_rules enable row level security;

create policy "expense_rules_owner_select" on public.expense_rules
  for select to authenticated using (auth.uid() = user_id);
create policy "expense_rules_owner_insert" on public.expense_rules
  for insert to authenticated with check (auth.uid() = user_id);
create policy "expense_rules_owner_update" on public.expense_rules
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expense_rules_owner_delete" on public.expense_rules
  for delete to authenticated using (auth.uid() = user_id);

create index expense_rules_user_idx on public.expense_rules(user_id, priority);

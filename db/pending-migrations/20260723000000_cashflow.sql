-- Cashflow: fuentes de ingreso recurrentes + gastos fijos no-suscripción
-- Aplicar en Supabase SQL editor tras el pull.

create type public.income_frequency as enum ('monthly', 'biweekly', 'weekly', 'yearly', 'one_time');

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(14,2) not null default 0,
  currency text not null default 'MXN',
  frequency public.income_frequency not null default 'monthly',
  day_of_month int check (day_of_month between 1 and 31),
  second_day_of_month int check (second_day_of_month between 1 and 31),
  next_date date,
  category text,
  emoji text default '💵',
  note text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.income_sources to authenticated;
grant all on public.income_sources to service_role;

alter table public.income_sources enable row level security;

create policy "income_sources_owner_select" on public.income_sources
  for select to authenticated using (auth.uid() = user_id);
create policy "income_sources_owner_insert" on public.income_sources
  for insert to authenticated with check (auth.uid() = user_id);
create policy "income_sources_owner_update" on public.income_sources
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income_sources_owner_delete" on public.income_sources
  for delete to authenticated using (auth.uid() = user_id);

create index income_sources_user_idx on public.income_sources(user_id);

-- Gastos fijos recurrentes (renta, préstamos, colegiaturas, etc.)
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(14,2) not null default 0,
  currency text not null default 'MXN',
  day_of_month int check (day_of_month between 1 and 31),
  category text,
  emoji text default '📌',
  note text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.recurring_expenses to authenticated;
grant all on public.recurring_expenses to service_role;

alter table public.recurring_expenses enable row level security;

create policy "recurring_expenses_owner_select" on public.recurring_expenses
  for select to authenticated using (auth.uid() = user_id);
create policy "recurring_expenses_owner_insert" on public.recurring_expenses
  for insert to authenticated with check (auth.uid() = user_id);
create policy "recurring_expenses_owner_update" on public.recurring_expenses
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_expenses_owner_delete" on public.recurring_expenses
  for delete to authenticated using (auth.uid() = user_id);

create index recurring_expenses_user_idx on public.recurring_expenses(user_id);

-- Savings Goals: fondo de emergencia + sinking funds (metas de ahorro)
-- Aplicar en Supabase SQL editor tras el pull.

create type public.savings_goal_kind as enum (
  'emergency', 'travel', 'gifts', 'insurance', 'tenencia', 'taxes',
  'gadget', 'home', 'car', 'wedding', 'education', 'other'
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  kind public.savings_goal_kind not null default 'other',
  target_amount numeric(14,2) not null default 0,
  current_amount numeric(14,2) not null default 0,
  monthly_contribution numeric(14,2) not null default 0,
  target_date date,
  linked_account_id uuid references public.asset_accounts(id) on delete set null,
  emoji text default '🎯',
  color text,
  note text,
  priority int not null default 0,
  status text not null default 'active',
  months_of_expenses numeric(6,2), -- solo para 'emergency': meses objetivo
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.savings_goals to authenticated;
grant all on public.savings_goals to service_role;

alter table public.savings_goals enable row level security;

create policy "savings_goals_owner_select" on public.savings_goals
  for select to authenticated using (auth.uid() = user_id);
create policy "savings_goals_owner_insert" on public.savings_goals
  for insert to authenticated with check (auth.uid() = user_id);
create policy "savings_goals_owner_update" on public.savings_goals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings_goals_owner_delete" on public.savings_goals
  for delete to authenticated using (auth.uid() = user_id);

-- Aportaciones (histórico)
create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_id uuid references public.savings_goals(id) on delete cascade not null,
  amount numeric(14,2) not null,
  contribution_date date not null default (now()::date),
  note text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.savings_contributions to authenticated;
grant all on public.savings_contributions to service_role;

alter table public.savings_contributions enable row level security;

create policy "savings_contrib_owner_select" on public.savings_contributions
  for select to authenticated using (auth.uid() = user_id);
create policy "savings_contrib_owner_insert" on public.savings_contributions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "savings_contrib_owner_update" on public.savings_contributions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings_contrib_owner_delete" on public.savings_contributions
  for delete to authenticated using (auth.uid() = user_id);

create index savings_goals_user_idx on public.savings_goals(user_id, status);
create index savings_contrib_goal_idx on public.savings_contributions(goal_id, contribution_date desc);

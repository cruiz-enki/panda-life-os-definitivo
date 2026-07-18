-- Deudas no-tarjeta: préstamos personales, hipoteca, auto, deudas con familia
-- Aplicar en Supabase SQL editor tras el pull.

create type public.debt_kind as enum (
  'personal_loan', 'mortgage', 'auto', 'family', 'student', 'business', 'other'
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  kind public.debt_kind not null default 'personal_loan',
  creditor text,
  currency text not null default 'MXN',
  original_amount numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  interest_rate numeric(6,3) not null default 0, -- % anual
  monthly_payment numeric(14,2) not null default 0,
  payment_day int check (payment_day between 1 and 31),
  start_date date,
  end_date date, -- fecha fin contractual (opcional)
  emoji text default '💸',
  note text,
  status text not null default 'active', -- active | paid_off | paused
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.debts to authenticated;
grant all on public.debts to service_role;

alter table public.debts enable row level security;

create policy "debts_owner_select" on public.debts
  for select to authenticated using (auth.uid() = user_id);
create policy "debts_owner_insert" on public.debts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "debts_owner_update" on public.debts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debts_owner_delete" on public.debts
  for delete to authenticated using (auth.uid() = user_id);

create index debts_user_idx on public.debts(user_id);

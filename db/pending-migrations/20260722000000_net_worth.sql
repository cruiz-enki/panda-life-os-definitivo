-- Net Worth: cuentas de activos + snapshots mensuales
-- Aplicar en Supabase SQL editor tras el pull.

create type public.asset_account_kind as enum (
  'cash', 'debit', 'savings', 'investment', 'crypto', 'retirement', 'real_estate', 'other'
);

create table public.asset_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  kind public.asset_account_kind not null default 'debit',
  institution text,
  currency text not null default 'MXN',
  current_balance numeric(14,2) not null default 0,
  emoji text default '💰',
  color text,
  note text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.asset_accounts to authenticated;
grant all on public.asset_accounts to service_role;

alter table public.asset_accounts enable row level security;

create policy "asset_accounts_owner_select" on public.asset_accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "asset_accounts_owner_insert" on public.asset_accounts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "asset_accounts_owner_update" on public.asset_accounts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "asset_accounts_owner_delete" on public.asset_accounts
  for delete to authenticated using (auth.uid() = user_id);

-- Snapshots (foto mensual del patrimonio)
create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  snapshot_date date not null,
  assets_total numeric(14,2) not null default 0,
  debts_total numeric(14,2) not null default 0,
  net_worth numeric(14,2) not null default 0,
  breakdown jsonb,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

grant select, insert, update, delete on public.net_worth_snapshots to authenticated;
grant all on public.net_worth_snapshots to service_role;

alter table public.net_worth_snapshots enable row level security;

create policy "net_worth_owner_select" on public.net_worth_snapshots
  for select to authenticated using (auth.uid() = user_id);
create policy "net_worth_owner_insert" on public.net_worth_snapshots
  for insert to authenticated with check (auth.uid() = user_id);
create policy "net_worth_owner_update" on public.net_worth_snapshots
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "net_worth_owner_delete" on public.net_worth_snapshots
  for delete to authenticated using (auth.uid() = user_id);

create index asset_accounts_user_idx on public.asset_accounts(user_id);
create index net_worth_snapshots_user_date_idx on public.net_worth_snapshots(user_id, snapshot_date desc);

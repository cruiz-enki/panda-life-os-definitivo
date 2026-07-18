-- Import bancario: dedup por hash y trazabilidad de sesiones de import.
-- Aplicar en Supabase SQL editor tras el pull.

-- ============ Sesiones de import ============
create table public.bank_import_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null default 'csv', -- csv | ofx | manual
  bank text,                          -- BBVA | Nu | HSBC | otro
  card_id uuid references public.credit_cards(id) on delete set null,
  filename text,
  rows_parsed int not null default 0,
  rows_imported int not null default 0,
  rows_skipped int not null default 0,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.bank_import_sessions to authenticated;
grant all on public.bank_import_sessions to service_role;

alter table public.bank_import_sessions enable row level security;

create policy "bank_imp_sessions_owner_select" on public.bank_import_sessions
  for select to authenticated using (auth.uid() = user_id);
create policy "bank_imp_sessions_owner_insert" on public.bank_import_sessions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "bank_imp_sessions_owner_update" on public.bank_import_sessions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bank_imp_sessions_owner_delete" on public.bank_import_sessions
  for delete to authenticated using (auth.uid() = user_id);

-- ============ Hashes para deduplicación ============
-- El hash combina fecha + monto + descripción normalizada para evitar duplicados.
create table public.bank_import_hashes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  hash text not null,
  session_id uuid references public.bank_import_sessions(id) on delete set null,
  expense_id uuid references public.finance_expenses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, hash)
);

grant select, insert, update, delete on public.bank_import_hashes to authenticated;
grant all on public.bank_import_hashes to service_role;

alter table public.bank_import_hashes enable row level security;

create policy "bank_imp_hashes_owner_select" on public.bank_import_hashes
  for select to authenticated using (auth.uid() = user_id);
create policy "bank_imp_hashes_owner_insert" on public.bank_import_hashes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "bank_imp_hashes_owner_delete" on public.bank_import_hashes
  for delete to authenticated using (auth.uid() = user_id);

create index bank_imp_hashes_user_idx on public.bank_import_hashes(user_id, hash);

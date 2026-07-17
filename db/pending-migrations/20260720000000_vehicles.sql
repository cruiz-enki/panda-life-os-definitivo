-- Vehículos: registro, servicios, verificaciones/tenencia, seguros, kilometraje
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  model text,
  year integer,
  plate text,
  color text,
  vin text,
  current_km integer default 0,
  fuel_type text,
  emoji text default '🚗',
  note text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;
create policy "own vehicles" on public.vehicles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Eventos: servicio, verificación, tenencia, seguro, gasolina, siniestro, otro
create table if not exists public.vehicle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  kind text not null, -- 'service' | 'verification' | 'tenencia' | 'insurance' | 'fuel' | 'incident' | 'other'
  title text not null,
  date date not null,
  km integer,
  cost numeric(12,2),
  provider text,
  note text,
  next_due_date date,
  next_due_km integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

grant select, insert, update, delete on public.vehicle_events to authenticated;
grant all on public.vehicle_events to service_role;
alter table public.vehicle_events enable row level security;
create policy "own vehicle events" on public.vehicle_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_vehicle_events_vehicle on public.vehicle_events(vehicle_id, date desc);
create index if not exists idx_vehicle_events_due on public.vehicle_events(user_id, next_due_date);

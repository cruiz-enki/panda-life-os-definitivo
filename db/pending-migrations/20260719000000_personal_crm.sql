-- Personal CRM: contacts with memory, 1:1 meetings, gift ideas.

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text,               -- amigo, familia, mentor, network, colega
  tags text[] default '{}',
  birthday date,                   -- solo mes/día importa; año opcional
  anniversary date,
  email text,
  phone text,
  location text,
  avatar_url text,
  how_we_met text,
  last_contact_at date,
  next_contact_at date,            -- recordatorio: cuándo re-contactar
  cadence_days integer,            -- cada cuánto quiero verle
  importance integer default 3 check (importance between 1 and 5),
  notes text,
  pending_topics text[] default '{}', -- "debo llamar a X sobre Y"
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists contacts_user_idx on public.contacts(user_id);
create index if not exists contacts_next_contact_idx on public.contacts(user_id, next_contact_at);

grant select, insert, update, delete on public.contacts to authenticated;
grant all on public.contacts to service_role;
alter table public.contacts enable row level security;

create policy "contacts own select" on public.contacts for select to authenticated using (auth.uid() = user_id);
create policy "contacts own insert" on public.contacts for insert to authenticated with check (auth.uid() = user_id);
create policy "contacts own update" on public.contacts for update to authenticated using (auth.uid() = user_id);
create policy "contacts own delete" on public.contacts for delete to authenticated using (auth.uid() = user_id);

-- Reuniones 1:1 / interacciones
create table if not exists public.contact_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  occurred_at date not null default current_date,
  kind text default 'meeting',     -- meeting, call, message, coffee, other
  summary text,
  notes text,                      -- notas persistentes
  next_agenda text,                -- agenda para la próxima vez
  mood integer check (mood between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists contact_interactions_user_idx on public.contact_interactions(user_id);
create index if not exists contact_interactions_contact_idx on public.contact_interactions(contact_id, occurred_at desc);

grant select, insert, update, delete on public.contact_interactions to authenticated;
grant all on public.contact_interactions to service_role;
alter table public.contact_interactions enable row level security;

create policy "interactions own select" on public.contact_interactions for select to authenticated using (auth.uid() = user_id);
create policy "interactions own insert" on public.contact_interactions for insert to authenticated with check (auth.uid() = user_id);
create policy "interactions own update" on public.contact_interactions for update to authenticated using (auth.uid() = user_id);
create policy "interactions own delete" on public.contact_interactions for delete to authenticated using (auth.uid() = user_id);

-- Ideas de regalo por persona
create table if not exists public.gift_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  notes text,
  url text,
  price numeric,
  currency text default 'MXN',
  occasion text,                   -- cumple, aniversario, navidad, "porque sí"
  target_date date,
  status text default 'idea',      -- idea, comprado, entregado, descartado
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists gift_ideas_user_idx on public.gift_ideas(user_id);
create index if not exists gift_ideas_contact_idx on public.gift_ideas(contact_id);

grant select, insert, update, delete on public.gift_ideas to authenticated;
grant all on public.gift_ideas to service_role;
alter table public.gift_ideas enable row level security;

create policy "gifts own select" on public.gift_ideas for select to authenticated using (auth.uid() = user_id);
create policy "gifts own insert" on public.gift_ideas for insert to authenticated with check (auth.uid() = user_id);
create policy "gifts own update" on public.gift_ideas for update to authenticated using (auth.uid() = user_id);
create policy "gifts own delete" on public.gift_ideas for delete to authenticated using (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.tg_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists contacts_touch on public.contacts;
create trigger contacts_touch before update on public.contacts for each row execute function public.tg_touch_updated_at();

drop trigger if exists contact_interactions_touch on public.contact_interactions;
create trigger contact_interactions_touch before update on public.contact_interactions for each row execute function public.tg_touch_updated_at();

drop trigger if exists gift_ideas_touch on public.gift_ideas;
create trigger gift_ideas_touch before update on public.gift_ideas for each row execute function public.tg_touch_updated_at();

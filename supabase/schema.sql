-- ============================================================
-- INTEGRIVA — Esquema de base de datos (Supabase / PostgreSQL)
-- ------------------------------------------------------------
-- Cómo aplicarlo:
--   Panel de Supabase → SQL Editor → New query → pegá TODO esto → Run.
--
-- Qué hace:
--   • profiles      : datos del usuario (ligados a auth.users de Supabase Auth)
--   • daily_logs    : registro diario (peso, comidas, actividad, emoción)
--   • memberships   : estado de la membresía
--   Todo protegido con RLS: cada persona solo ve y edita SUS datos.
--   (Importante en una app de salud: privacidad por diseño.)
-- ============================================================

-- ---------- PERFILES ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  nombre        text,
  edad          int,
  sexo          text check (sexo in ('F','M')),
  peso          numeric(5,1),
  peso_deseado  numeric(5,1),
  altura        numeric(5,1),
  actividad     text,
  acepta_terminos boolean default false,
  cal_objetivo  int,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfil: ver el propio" on public.profiles;
create policy "perfil: ver el propio" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "perfil: crear el propio" on public.profiles;
create policy "perfil: crear el propio" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "perfil: editar el propio" on public.profiles;
create policy "perfil: editar el propio" on public.profiles
  for update using (auth.uid() = id);

-- Cuando se confirma un usuario nuevo, creamos su fila de perfil
-- copiando los datos que mandamos como metadata en el registro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, edad, sexo, peso, peso_deseado, altura, actividad, acepta_terminos, cal_objetivo)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nombre',
    nullif(new.raw_user_meta_data->>'edad','')::int,
    new.raw_user_meta_data->>'sexo',
    nullif(new.raw_user_meta_data->>'peso','')::numeric,
    nullif(new.raw_user_meta_data->>'pesoDeseado','')::numeric,
    nullif(new.raw_user_meta_data->>'altura','')::numeric,
    new.raw_user_meta_data->>'actividad',
    coalesce((new.raw_user_meta_data->>'acepta')::boolean, false),
    nullif(new.raw_user_meta_data->>'cal','')::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- REGISTRO DIARIO ----------
create table if not exists public.daily_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  fecha      date not null,
  peso       numeric(5,1),
  comidas    jsonb default '[]',
  actividad  jsonb default '[]',
  emocion    jsonb,
  updated_at timestamptz default now(),
  unique (user_id, fecha)
);

alter table public.daily_logs enable row level security;

drop policy if exists "logs: dueño total" on public.daily_logs;
create policy "logs: dueño total" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- MEMBRESÍA ----------
create table if not exists public.memberships (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  active     boolean default false,
  started_at date,
  extras     jsonb default '{}',
  updated_at timestamptz default now()
);

alter table public.memberships enable row level security;

drop policy if exists "membresia: dueño total" on public.memberships;
create policy "membresia: dueño total" on public.memberships
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

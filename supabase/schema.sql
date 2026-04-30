-- Ejecutar en Supabase SQL Editor
-- Esquema base para Festival de la Niñez

create extension if not exists pgcrypto;

-- Tabla key-value utilizada por la Edge Function (actividades, perfil cacheado, ubicaciones)
create table if not exists public.kv_store_e1ac9291 (
  key text primary key,
  value jsonb not null
);

create index if not exists kv_store_e1ac9291_key_pattern_idx
  on public.kv_store_e1ac9291 (key text_pattern_ops);

-- Lista oficial de asistentes autorizados (origen: tu Google Sheet)
create table if not exists public.attendees (
  email text primary key,
  full_name text,
  attends_interclubes boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendees_is_active_idx
  on public.attendees (is_active);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attendees_set_updated_at on public.attendees;
create trigger attendees_set_updated_at
before update on public.attendees
for each row
execute function public.set_updated_at();

-- RLS recomendado
alter table public.kv_store_e1ac9291 enable row level security;
alter table public.attendees enable row level security;

-- No exponer estas tablas al cliente anon/authenticated.
drop policy if exists "deny_all_kv" on public.kv_store_e1ac9291;
create policy "deny_all_kv"
on public.kv_store_e1ac9291
for all
to public
using (false)
with check (false);

drop policy if exists "deny_all_attendees" on public.attendees;
create policy "deny_all_attendees"
on public.attendees
for all
to public
using (false)
with check (false);

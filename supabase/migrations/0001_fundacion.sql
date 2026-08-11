-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0001 — FUNDACIÓN (Fase 1)
-- Usuarios, roles, perfiles, seguridad (RLS) y auditoría.
--
-- Cómo aplicarlo:
--   Supabase → tu proyecto → SQL Editor → New query
--   Pega TODO este archivo y pulsa "Run".
-- ============================================================

-- ------------------------------------------------------------
-- 1. Roles de la aplicación (sección 28)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'admin',
      'gerente',
      'comercial',
      'jefe_obra',
      'operario',
      'administracion'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. Perfiles de usuario (extiende auth.users de Supabase)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        public.app_role not null default 'operario',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuario de la plataforma, vinculado a auth.users.';

-- ------------------------------------------------------------
-- 3. Función auxiliar: rol del usuario actual
--    (SECURITY DEFINER para evitar recursión en las políticas RLS)
-- ------------------------------------------------------------
create or replace function public.get_my_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 4. Alta automática de perfil al registrarse un usuario.
--    El PRIMER usuario que se registre será ADMINISTRADOR.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  es_primero boolean;
  rol_final  public.app_role;
begin
  select count(*) = 0 into es_primero from public.profiles;

  if es_primero then
    rol_final := 'admin';
  else
    rol_final := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.app_role,
      'operario'
    );
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    rol_final
  );

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 5. Mantener updated_at al día
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6. Evitar que un usuario se cambie el rol a sí mismo
--    (solo un administrador puede modificar roles)
-- ------------------------------------------------------------
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.get_my_role() <> 'admin' then
    raise exception 'Solo un administrador puede cambiar el rol de un usuario.';
  end if;
  return new;
end $$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ------------------------------------------------------------
-- 7. Seguridad a nivel de fila (RLS) para profiles
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.get_my_role() in ('admin', 'gerente')
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 8. Auditoría (sección 37): quién hizo qué y cuándo
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,          -- crear | editar | eliminar | cambio_estado
  entity      text,                   -- presupuesto | obra | partida | compra ...
  entity_id   text,
  changes     jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.audit_logs is 'Registro de auditoría de acciones sobre entidades clave.';

create index if not exists idx_audit_entity on public.audit_logs (entity, entity_id);
create index if not exists idx_audit_actor on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs
  for select to authenticated
  using (public.get_my_role() in ('admin', 'gerente'));

drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs
  for insert to authenticated
  with check (true);

-- ============================================================
-- FIN de la migración 0001
-- ============================================================

-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0021 — Personal (ficha completa) + notas internas en tareas
--
-- Amplía la ficha de las personas del equipo con datos personales,
-- llamados de atención y notas internas. Añade también un campo de
-- notas internas a las tareas.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- 1. Datos personales adicionales de las personas del equipo
alter table public.employees
  add column if not exists dni        text,
  add column if not exists position   text,   -- cargo
  add column if not exists birth_date date,
  add column if not exists address    text,
  add column if not exists start_date date;   -- fecha de alta/incorporación

-- 2. Llamados de atención
create table if not exists public.employee_warnings (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  warn_date   date not null default current_date,
  reason      text not null,
  severity    text not null default 'leve',    -- leve|grave|muy_grave
  notes       text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_emp_warnings_emp on public.employee_warnings (employee_id);
alter table public.employee_warnings enable row level security;
drop policy if exists employee_warnings_all on public.employee_warnings;
create policy employee_warnings_all on public.employee_warnings
  for all to authenticated using (true) with check (true);

-- 3. Notas internas de la persona
create table if not exists public.employee_notes (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  content     text not null,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_emp_notes_emp on public.employee_notes (employee_id);
drop trigger if exists trg_emp_notes_updated_at on public.employee_notes;
create trigger trg_emp_notes_updated_at
  before update on public.employee_notes
  for each row execute function public.set_updated_at();
alter table public.employee_notes enable row level security;
drop policy if exists employee_notes_all on public.employee_notes;
create policy employee_notes_all on public.employee_notes
  for all to authenticated using (true) with check (true);

-- 4. Notas internas en las tareas
alter table public.tasks
  add column if not exists notes text;

-- ============================================================
-- FIN de la migración 0021
-- ============================================================

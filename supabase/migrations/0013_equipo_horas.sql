-- ============================================================
-- ARKAN · Migración 0013 — EQUIPO Y CONTROL DE HORAS (Fase 7)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Equipo (operarios / colaboradores)
-- ------------------------------------------------------------
create table if not exists public.employees (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  role         text,
  specialty    text,
  relationship text not null default 'empleado',   -- empleado | autonomo | subcontrata
  phone        text,
  email        text,
  hourly_cost  numeric(10,2) not null default 0,
  active       boolean not null default true,
  notes        text,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_employees_active on public.employees (active);

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

alter table public.employees enable row level security;
drop policy if exists employees_all on public.employees;
create policy employees_all on public.employees
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Registro de horas (imputadas a obra y opcionalmente partida)
--    hourly_cost se guarda como "foto" para conservar el coste real.
-- ------------------------------------------------------------
create table if not exists public.time_entries (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid references public.employees (id) on delete set null,
  project_id      uuid not null references public.projects (id) on delete cascade,
  project_item_id uuid references public.project_items (id) on delete set null,
  work_date       date not null default current_date,
  hours           numeric(6,2) not null default 0,
  hourly_cost     numeric(10,2) not null default 0,
  notes           text,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_time_entries_project on public.time_entries (project_id);
create index if not exists idx_time_entries_employee on public.time_entries (employee_id);

drop trigger if exists trg_time_entries_updated_at on public.time_entries;
create trigger trg_time_entries_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

alter table public.time_entries enable row level security;
drop policy if exists time_entries_all on public.time_entries;
create policy time_entries_all on public.time_entries
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0013
-- ============================================================

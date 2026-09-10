-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0020 — Tareas (Fase 9 · Operaciones)
--
-- Tareas con prioridad, estado, fecha límite, asignación a una persona
-- del equipo y vínculo opcional a una obra.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  status       text not null default 'pendiente',       -- pendiente|en_proceso|hecha|cancelada
  priority     text not null default 'media',            -- baja|media|alta
  due_date     date,
  project_id   uuid references public.projects (id) on delete set null,
  assignee_id  uuid references public.employees (id) on delete set null,
  done_at      timestamptz,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_due on public.tasks (due_date);
create index if not exists idx_tasks_project on public.tasks (project_id);
create index if not exists idx_tasks_assignee on public.tasks (assignee_id);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0020
-- ============================================================

-- ============================================================
-- ARKAN · Migración 0008 — OBRAS (Fases 4 y 5)
-- Obras (proyectos), capítulos y partidas con seguimiento de avance.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Obras (sección 12)
-- ------------------------------------------------------------
create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  code           text,
  name           text,
  customer_id    uuid references public.customers (id) on delete set null,
  quote_id       uuid references public.quotes (id) on delete set null,
  address        text,
  responsible_id uuid references public.profiles (id) on delete set null,
  status         text not null default 'preparacion',
  start_planned  date,
  end_planned    date,
  start_real     date,
  end_real       date,
  contract_value numeric(14,2) not null default 0,
  notes          text,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_projects_customer on public.projects (customer_id);
create index if not exists idx_projects_status on public.projects (status);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
drop policy if exists projects_all on public.projects;
create policy projects_all on public.projects
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Capítulos de la obra
-- ------------------------------------------------------------
create table if not exists public.project_chapters (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  code       text,
  name       text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_chapters_project on public.project_chapters (project_id);

alter table public.project_chapters enable row level security;
drop policy if exists project_chapters_all on public.project_chapters;
create policy project_chapters_all on public.project_chapters
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Partidas de la obra (con seguimiento de avance, sección 14)
-- ------------------------------------------------------------
create table if not exists public.project_items (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  chapter_id     uuid not null references public.project_chapters (id) on delete cascade,
  code           text,
  description    text not null,
  unit           text default 'ud',
  quantity       numeric(12,3) not null default 1,
  cost_labor     numeric(12,2) not null default 0,
  cost_materials numeric(12,2) not null default 0,
  cost_other     numeric(12,2) not null default 0,
  margin_pct     numeric(6,2) not null default 0,
  est_hours      numeric(8,2),
  est_workers    int,
  pct_done       numeric(5,2) not null default 0,           -- % ejecutado
  item_status    text not null default 'pendiente',         -- pendiente|en_proceso|parcial|terminado|bloqueado
  notes          text,
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_project_items_project on public.project_items (project_id);
create index if not exists idx_project_items_chapter on public.project_items (chapter_id);

drop trigger if exists trg_project_items_updated_at on public.project_items;
create trigger trg_project_items_updated_at
  before update on public.project_items
  for each row execute function public.set_updated_at();

alter table public.project_items enable row level security;
drop policy if exists project_items_all on public.project_items;
create policy project_items_all on public.project_items
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0008
-- ============================================================

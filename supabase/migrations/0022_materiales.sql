-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0022 — Materiales (catálogo + necesidades por obra)
--
-- 1) materials: catálogo maestro de materiales reutilizable.
-- 2) material_requests: necesidades de material por obra, con estado
--    (por pedir → pedido → recibido), que pueden elegir del catálogo.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Catálogo de materiales
-- ------------------------------------------------------------
create table if not exists public.materials (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text,
  unit            text default 'ud',
  reference_price numeric(12,2) not null default 0,
  supplier_id     uuid references public.suppliers (id) on delete set null,
  reference       text,                                  -- referencia del proveedor
  notes           text,
  active          boolean not null default true,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_materials_name on public.materials (lower(name));
create index if not exists idx_materials_category on public.materials (category);

drop trigger if exists trg_materials_updated_at on public.materials;
create trigger trg_materials_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

alter table public.materials enable row level security;
drop policy if exists materials_all on public.materials;
create policy materials_all on public.materials
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Necesidades de material por obra
-- ------------------------------------------------------------
create table if not exists public.material_requests (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  name        text not null,                             -- nombre del material (desnormalizado)
  quantity    numeric(12,3) not null default 1,
  unit        text default 'ud',
  status      text not null default 'por_pedir',         -- por_pedir|pedido|recibido|cancelado
  supplier_id uuid references public.suppliers (id) on delete set null,
  notes       text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_mat_req_project on public.material_requests (project_id);
create index if not exists idx_mat_req_status on public.material_requests (status);

drop trigger if exists trg_mat_req_updated_at on public.material_requests;
create trigger trg_mat_req_updated_at
  before update on public.material_requests
  for each row execute function public.set_updated_at();

alter table public.material_requests enable row level security;
drop policy if exists material_requests_all on public.material_requests;
create policy material_requests_all on public.material_requests
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0022
-- ============================================================

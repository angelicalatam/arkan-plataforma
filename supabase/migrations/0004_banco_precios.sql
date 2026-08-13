-- ============================================================
-- ARKAN · Migración 0004 — BANCO DE PRECIOS (ampliación Fase 3)
-- Partidas de referencia + catálogo de materiales.
-- Además: tiempo estimado en las partidas del presupuesto.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Banco de partidas de referencia (desde M.O..xlsx)
-- ------------------------------------------------------------
create table if not exists public.price_items (
  id             uuid primary key default gen_random_uuid(),
  category       text,
  code           text,
  name           text not null,
  description    text,
  unit           text default 'ud',
  cost_labor     numeric(12,2) not null default 0,
  cost_materials numeric(12,2) not null default 0,
  cost_other     numeric(12,2) not null default 0,
  margin_pct     numeric(6,2) not null default 0,
  est_hours      numeric(8,2),
  est_workers    int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_price_items_category on public.price_items (category);
create index if not exists idx_price_items_name on public.price_items (lower(name));

drop trigger if exists trg_price_items_updated_at on public.price_items;
create trigger trg_price_items_updated_at
  before update on public.price_items
  for each row execute function public.set_updated_at();

alter table public.price_items enable row level security;
drop policy if exists price_items_all on public.price_items;
create policy price_items_all on public.price_items
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Catálogo de materiales (desde MATERIALES AUXILIARES.xlsx)
-- ------------------------------------------------------------
create table if not exists public.price_materials (
  id          uuid primary key default gen_random_uuid(),
  code        text,
  name        text not null,
  description text,
  unit        text,
  unit_price  numeric(12,2) not null default 0,
  reference   text,
  category    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_price_materials_name on public.price_materials (lower(name));
create index if not exists idx_price_materials_category on public.price_materials (category);

drop trigger if exists trg_price_materials_updated_at on public.price_materials;
create trigger trg_price_materials_updated_at
  before update on public.price_materials
  for each row execute function public.set_updated_at();

alter table public.price_materials enable row level security;
drop policy if exists price_materials_all on public.price_materials;
create policy price_materials_all on public.price_materials
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Tiempo estimado en las partidas del presupuesto (sección 10)
-- ------------------------------------------------------------
alter table public.quote_items add column if not exists est_hours numeric(8,2);
alter table public.quote_items add column if not exists est_workers int;

-- ============================================================
-- FIN de la migración 0004
-- ============================================================

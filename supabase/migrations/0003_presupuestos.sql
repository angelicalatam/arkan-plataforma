-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0003 — PRESUPUESTOS (Fase 3)
-- Presupuestos → capítulos → partidas (con desglose de costes).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Presupuestos (secciones 7 y 8)
-- ------------------------------------------------------------
create table if not exists public.quotes (
  id             uuid primary key default gen_random_uuid(),
  code           text,                                   -- nº de presupuesto (ej. PRES-0001)
  title          text,
  customer_id    uuid references public.customers (id) on delete set null,
  work_address   text,
  status         text not null default 'borrador',       -- borrador|en_preparacion|enviado|en_negociacion|aceptado|rechazado|cancelado|expirado
  issue_date     date default current_date,
  sent_date      date,
  accepted_date  date,
  valid_until    date,
  responsible_id uuid references public.profiles (id) on delete set null,
  tax_rate       numeric(5,2) not null default 21,       -- IVA %
  notes          text,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_quotes_customer on public.quotes (customer_id);
create index if not exists idx_quotes_status on public.quotes (status);

drop trigger if exists trg_quotes_updated_at on public.quotes;
create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

alter table public.quotes enable row level security;
drop policy if exists quotes_all on public.quotes;
create policy quotes_all on public.quotes
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Capítulos del presupuesto
-- ------------------------------------------------------------
create table if not exists public.quote_chapters (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.quotes (id) on delete cascade,
  code       text,
  name       text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_chapters_quote on public.quote_chapters (quote_id);

alter table public.quote_chapters enable row level security;
drop policy if exists quote_chapters_all on public.quote_chapters;
create policy quote_chapters_all on public.quote_chapters
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Partidas (secciones 8 y 9)
--    Desglose de coste: mano de obra + materiales + otros.
--    Precio de venta y margen se calculan en la aplicación.
-- ------------------------------------------------------------
create table if not exists public.quote_items (
  id             uuid primary key default gen_random_uuid(),
  quote_id       uuid not null references public.quotes (id) on delete cascade,
  chapter_id     uuid not null references public.quote_chapters (id) on delete cascade,
  code           text,
  description    text not null,
  unit           text default 'ud',                      -- unidad (ud, m2, ml, h…)
  quantity       numeric(12,3) not null default 1,
  cost_labor     numeric(12,2) not null default 0,       -- mano de obra (coste unitario)
  cost_materials numeric(12,2) not null default 0,       -- materiales (coste unitario)
  cost_other     numeric(12,2) not null default 0,       -- otros costes (coste unitario)
  margin_pct     numeric(6,2) not null default 0,        -- margen %
  position       int not null default 0,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_quote_items_quote on public.quote_items (quote_id);
create index if not exists idx_quote_items_chapter on public.quote_items (chapter_id);

drop trigger if exists trg_quote_items_updated_at on public.quote_items;
create trigger trg_quote_items_updated_at
  before update on public.quote_items
  for each row execute function public.set_updated_at();

alter table public.quote_items enable row level security;
drop policy if exists quote_items_all on public.quote_items;
create policy quote_items_all on public.quote_items
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0003
-- ============================================================

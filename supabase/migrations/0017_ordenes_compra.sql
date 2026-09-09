-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0017 — Órdenes de compra
--
-- Documento de pedido a proveedor con varias líneas de material.
-- Numeración OC-AAAA-NNN. El total se calcula en la aplicación.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Órdenes de compra
-- ------------------------------------------------------------
create table if not exists public.purchase_orders (
  id               uuid primary key default gen_random_uuid(),
  code             text,                                  -- OC-AAAA-NNN
  supplier_id      uuid references public.suppliers (id) on delete set null,
  project_id       uuid references public.projects (id) on delete set null,
  status           text not null default 'borrador',      -- borrador|enviada|confirmada|recibida|cancelada
  order_date       date default current_date,
  expected_date    date,
  delivery_address text,
  payment_terms    text,
  tax_rate         numeric(5,2) not null default 21,
  notes            text,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_purchase_orders_supplier on public.purchase_orders (supplier_id);
create index if not exists idx_purchase_orders_project on public.purchase_orders (project_id);

drop trigger if exists trg_purchase_orders_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

alter table public.purchase_orders enable row level security;
drop policy if exists purchase_orders_all on public.purchase_orders;
create policy purchase_orders_all on public.purchase_orders
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Líneas de la orden de compra
-- ------------------------------------------------------------
create table if not exists public.purchase_order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.purchase_orders (id) on delete cascade,
  description text not null,
  quantity    numeric(12,3) not null default 1,
  unit        text default 'ud',
  unit_price  numeric(12,2) not null default 0,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_purchase_order_items_order on public.purchase_order_items (order_id);

alter table public.purchase_order_items enable row level security;
drop policy if exists purchase_order_items_all on public.purchase_order_items;
create policy purchase_order_items_all on public.purchase_order_items
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0017
-- ============================================================

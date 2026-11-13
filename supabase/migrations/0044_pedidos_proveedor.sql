-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0044 — Pedidos a proveedor (a partir de una orden de compra)
--
-- A partir de los materiales de una orden de compra se genera un "pedido"
-- editable e independiente (documento de solicitud al proveedor). Editar
-- el pedido NO cambia la orden original. Queda guardado y vinculado a la
-- orden, la obra y el proveedor (historial / trazabilidad).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.order_requests (
  id               uuid primary key default gen_random_uuid(),
  code             text,
  order_id         uuid references public.purchase_orders (id) on delete set null,
  supplier_id      uuid references public.suppliers (id) on delete set null,
  project_id       uuid references public.projects (id) on delete set null,
  delivery_address text,
  general_notes    text,
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists public.order_request_items (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.order_requests (id) on delete cascade,
  description text not null default '',
  quantity    numeric(14,3) not null default 0,
  unit        text,
  observations text,
  position    int not null default 0
);

create index if not exists idx_order_requests_order on public.order_requests (order_id);
create index if not exists idx_order_request_items_req on public.order_request_items (request_id);

alter table public.order_requests enable row level security;
drop policy if exists order_requests_all on public.order_requests;
create policy order_requests_all on public.order_requests
  for all to authenticated using (true) with check (true);

alter table public.order_request_items enable row level security;
drop policy if exists order_request_items_all on public.order_request_items;
create policy order_request_items_all on public.order_request_items
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0044
-- ============================================================

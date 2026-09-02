-- ============================================================
-- ARKAN · Migración 0011 — COMPRAS / MATERIALES (Fase 6)
-- Compra de material ligada a proveedor + obra + partida (opcionales).
-- ============================================================

create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  code            text,
  supplier_id     uuid references public.suppliers (id) on delete set null,
  project_id      uuid references public.projects (id) on delete set null,
  project_item_id uuid references public.project_items (id) on delete set null,
  material        text not null,
  quantity        numeric(12,3) not null default 1,
  unit            text default 'ud',
  unit_price      numeric(12,2) not null default 0,
  tax_rate        numeric(5,2) not null default 21,
  status          text not null default 'pendiente',  -- pendiente|solicitado|pedido|en_transito|recibido|parcial|cancelado
  order_date      date,
  expected_date   date,
  received_date   date,
  invoice_ref     text,
  notes           text,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_purchases_project on public.purchases (project_id);
create index if not exists idx_purchases_supplier on public.purchases (supplier_id);
create index if not exists idx_purchases_status on public.purchases (status);

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;
drop policy if exists purchases_all on public.purchases;
create policy purchases_all on public.purchases
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0011
-- ============================================================

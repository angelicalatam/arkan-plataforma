-- ============================================================
-- ARKAN · Migración 0012 — VARIAS PERSONAS DE CONTACTO POR PROVEEDOR
-- ============================================================

create table if not exists public.supplier_contacts (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  name        text not null,
  role        text,
  phone       text,
  email       text,
  notes       text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_supplier_contacts_supplier on public.supplier_contacts (supplier_id);

drop trigger if exists trg_supplier_contacts_updated_at on public.supplier_contacts;
create trigger trg_supplier_contacts_updated_at
  before update on public.supplier_contacts
  for each row execute function public.set_updated_at();

alter table public.supplier_contacts enable row level security;
drop policy if exists supplier_contacts_all on public.supplier_contacts;
create policy supplier_contacts_all on public.supplier_contacts
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0012
-- ============================================================

-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0026 — Varias personas de contacto por cliente (hasta 10)
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.customer_contacts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  name        text not null,
  role        text,
  phone       text,
  email       text,
  notes       text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_customer_contacts_customer on public.customer_contacts (customer_id);

drop trigger if exists trg_customer_contacts_updated_at on public.customer_contacts;
create trigger trg_customer_contacts_updated_at
  before update on public.customer_contacts
  for each row execute function public.set_updated_at();

alter table public.customer_contacts enable row level security;
drop policy if exists customer_contacts_all on public.customer_contacts;
create policy customer_contacts_all on public.customer_contacts
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0026
-- ============================================================

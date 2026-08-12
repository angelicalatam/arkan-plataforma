-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0002 — CRM (Fase 2)
-- Etapas del pipeline, clientes, proveedores y actividades.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Etapas del pipeline CRM (configurables) — sección 4
-- ------------------------------------------------------------
create table if not exists public.crm_stages (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  label      text not null,
  position   int not null,
  color      text not null default 'ink',
  is_won     boolean not null default false,
  is_lost    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Semilla de las 15 etapas iniciales (solo si la tabla está vacía)
insert into public.crm_stages (key, label, position, color, is_won, is_lost)
select * from (values
  ('nuevo_lead',              'Nuevo lead',                1,  'blue',   false, false),
  ('contactado',             'Contactado',                2,  'blue',   false, false),
  ('primera_conversacion',   'Primera conversación',      3,  'blue',   false, false),
  ('visita_pendiente',       'Visita pendiente',          4,  'amber',  false, false),
  ('visita_realizada',       'Visita realizada',          5,  'amber',  false, false),
  ('presupuesto_preparacion','Presupuesto en preparación',6,  'amber',  false, false),
  ('presupuesto_enviado',    'Presupuesto enviado',       7,  'brand',  false, false),
  ('negociacion',            'Negociación',               8,  'brand',  false, false),
  ('presupuesto_aceptado',   'Presupuesto aceptado',      9,  'green',  false, false),
  ('cliente_ganado',         'Cliente ganado',            10, 'green',  true,  false),
  ('obra_preparacion',       'Obra en preparación',       11, 'green',  false, false),
  ('obra_ejecucion',         'Obra en ejecución',         12, 'green',  false, false),
  ('obra_finalizada',        'Obra finalizada',           13, 'ink',    false, false),
  ('postventa',              'Postventa',                 14, 'ink',    false, false),
  ('cliente_perdido',        'Cliente perdido',           15, 'red',    false, true)
) as v(key, label, position, color, is_won, is_lost)
where not exists (select 1 from public.crm_stages);

alter table public.crm_stages enable row level security;

drop policy if exists crm_stages_read on public.crm_stages;
create policy crm_stages_read on public.crm_stages
  for select to authenticated using (true);

drop policy if exists crm_stages_admin on public.crm_stages;
create policy crm_stages_admin on public.crm_stages
  for all to authenticated
  using (public.get_my_role() in ('admin', 'gerente'))
  with check (public.get_my_role() in ('admin', 'gerente'));

-- ------------------------------------------------------------
-- 2. Clientes (secciones 4 y 5)
-- ------------------------------------------------------------
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null default 'particular',   -- particular | empresa | inmobiliaria | aseguradora | otro
  tax_id          text,                                 -- CIF / NIF
  phone           text,
  whatsapp        text,
  email           text,
  address         text,
  city            text,
  postal_code     text,
  province        text,
  country         text default 'España',
  contact_person  text,
  contact_role    text,
  lead_source     text,                                 -- fuente del lead
  stage_id        uuid references public.crm_stages (id) on delete set null,
  status          text not null default 'activo',
  owner_id        uuid references public.profiles (id) on delete set null,  -- comercial responsable
  potential_value numeric(12,2),
  probability     int,
  notes           text,
  tags            text[] not null default '{}',
  last_contact    timestamptz,
  next_followup   date,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_customers_stage on public.customers (stage_id);
create index if not exists idx_customers_owner on public.customers (owner_id);
create index if not exists idx_customers_email on public.customers (lower(email));
create index if not exists idx_customers_taxid on public.customers (lower(tax_id));

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

drop policy if exists customers_all on public.customers;
create policy customers_all on public.customers
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Proveedores (sección 6)
-- ------------------------------------------------------------
create table if not exists public.suppliers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,          -- nombre comercial
  legal_name        text,                   -- razón social
  tax_id            text,
  contact_person    text,
  phone             text,
  whatsapp          text,
  email             text,
  address           text,
  city              text,
  postal_code       text,
  province          text,
  website           text,
  category          text,
  subcategory       text,
  products_services text,
  payment_terms     text,                   -- condiciones de pago
  payment_method    text,                   -- forma de pago
  delivery_time     text,                   -- plazo de entrega
  service_zone      text,                   -- zona de servicio
  notes             text,
  rating_price       int,
  rating_quality     int,
  rating_delivery    int,
  rating_reliability int,
  rating_service     int,
  rating_overall     numeric(2,1),
  tags              text[] not null default '{}',
  created_by        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_suppliers_category on public.suppliers (category);
create index if not exists idx_suppliers_email on public.suppliers (lower(email));
create index if not exists idx_suppliers_taxid on public.suppliers (lower(tax_id));

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

alter table public.suppliers enable row level security;

drop policy if exists suppliers_all on public.suppliers;
create policy suppliers_all on public.suppliers
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 4. Actividades (sección 5) — llamadas, visitas, notas, etc.
-- ------------------------------------------------------------
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'nota',   -- llamada | whatsapp | email | reunion | visita | nota
  subject     text,
  body        text,
  customer_id uuid references public.customers (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete cascade,
  due_date    timestamptz,
  done        boolean not null default false,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_activities_customer on public.activities (customer_id);
create index if not exists idx_activities_supplier on public.activities (supplier_id);

alter table public.activities enable row level security;

drop policy if exists activities_all on public.activities;
create policy activities_all on public.activities
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0002
-- ============================================================

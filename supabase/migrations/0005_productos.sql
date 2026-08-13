-- ============================================================
-- ARKAN · Migración 0005 — BANCO DE PRODUCTOS (ampliación Fase 3)
-- Productos con foto + opciones de producto por partida.
-- Incluye el bucket de Storage y sus políticas.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Banco de productos
-- ------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category    text,
  name        text not null,
  brand       text,
  description text,
  price       numeric(12,2) not null default 0,
  reference   text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  image_url   text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_name on public.products (lower(name));

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
drop policy if exists products_all on public.products;
create policy products_all on public.products
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Opciones de producto por partida (para ofrecer al cliente)
-- ------------------------------------------------------------
create table if not exists public.quote_item_products (
  id             uuid primary key default gen_random_uuid(),
  quote_item_id  uuid not null references public.quote_items (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  name           text not null,
  brand          text,
  description    text,
  price          numeric(12,2) not null default 0,
  reference      text,
  image_url      text,
  is_recommended boolean not null default false,
  position       int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_qip_item on public.quote_item_products (quote_item_id);

alter table public.quote_item_products enable row level security;
drop policy if exists quote_item_products_all on public.quote_item_products;
create policy quote_item_products_all on public.quote_item_products
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Almacenamiento de fotos (bucket público 'productos')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "productos lectura publica" on storage.objects;
create policy "productos lectura publica" on storage.objects
  for select using (bucket_id = 'productos');

drop policy if exists "productos subida autenticada" on storage.objects;
create policy "productos subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos');

drop policy if exists "productos actualizar autenticada" on storage.objects;
create policy "productos actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'productos');

drop policy if exists "productos borrar autenticada" on storage.objects;
create policy "productos borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'productos');

-- ============================================================
-- FIN de la migración 0005
-- ============================================================

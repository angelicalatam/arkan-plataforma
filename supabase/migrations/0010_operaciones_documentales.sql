-- ============================================================
-- ARKAN · Migración 0010 — OPERACIONES DOCUMENTALES CON PROVEEDORES
-- Operación (ciclo) = proveedor + obra + 4 documentos:
--   pedido de venta, factura, comprobante de pago, albarán.
-- El estado (completa/incompleta) se CALCULA en la app.
-- Requiere suppliers (0002) y projects (0008).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Operación documental (ciclo)
-- ------------------------------------------------------------
create table if not exists public.supplier_operations (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text,
  amount      numeric(12,2),
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_operations_supplier on public.supplier_operations (supplier_id);
create index if not exists idx_operations_project on public.supplier_operations (project_id);

drop trigger if exists trg_operations_updated_at on public.supplier_operations;
create trigger trg_operations_updated_at
  before update on public.supplier_operations
  for each row execute function public.set_updated_at();

alter table public.supplier_operations enable row level security;
drop policy if exists supplier_operations_all on public.supplier_operations;
create policy supplier_operations_all on public.supplier_operations
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Documentos de la operación (una ranura por tipo)
-- ------------------------------------------------------------
create table if not exists public.operation_documents (
  id           uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.supplier_operations (id) on delete cascade,
  doc_type     text not null,                 -- pedido | factura | pago | albaran
  name         text,
  url          text not null,
  path         text not null,
  mime_type    text,
  size         bigint,
  doc_date     date,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Un único documento por tipo dentro de cada operación (4 ranuras).
create unique index if not exists uq_operation_doc_type
  on public.operation_documents (operation_id, doc_type);

drop trigger if exists trg_operation_documents_updated_at on public.operation_documents;
create trigger trg_operation_documents_updated_at
  before update on public.operation_documents
  for each row execute function public.set_updated_at();

alter table public.operation_documents enable row level security;
drop policy if exists operation_documents_all on public.operation_documents;
create policy operation_documents_all on public.operation_documents
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Almacenamiento (bucket público 'operaciones')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('operaciones', 'operaciones', true)
on conflict (id) do nothing;

drop policy if exists "operaciones lectura publica" on storage.objects;
create policy "operaciones lectura publica" on storage.objects
  for select using (bucket_id = 'operaciones');

drop policy if exists "operaciones subida autenticada" on storage.objects;
create policy "operaciones subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'operaciones');

drop policy if exists "operaciones actualizar autenticada" on storage.objects;
create policy "operaciones actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'operaciones');

drop policy if exists "operaciones borrar autenticada" on storage.objects;
create policy "operaciones borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'operaciones');

-- ============================================================
-- FIN de la migración 0010
-- ============================================================

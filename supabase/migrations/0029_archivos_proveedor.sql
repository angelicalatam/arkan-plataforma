-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0029 — Catálogos y documentos del proveedor
--
-- Archivos (PDF u otras extensiones) subidos a la ficha del proveedor,
-- por ejemplo catálogos, tarifas, fichas técnicas, etc.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.supplier_files (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  title       text,
  name        text,
  url         text not null,
  path        text not null,
  mime_type   text,
  size        bigint,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_supplier_files_supplier on public.supplier_files (supplier_id);

alter table public.supplier_files enable row level security;
drop policy if exists supplier_files_all on public.supplier_files;
create policy supplier_files_all on public.supplier_files
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Almacenamiento (bucket público 'proveedores')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('proveedores', 'proveedores', true)
on conflict (id) do nothing;

drop policy if exists "proveedores lectura publica" on storage.objects;
create policy "proveedores lectura publica" on storage.objects
  for select using (bucket_id = 'proveedores');

drop policy if exists "proveedores subida autenticada" on storage.objects;
create policy "proveedores subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'proveedores');

drop policy if exists "proveedores actualizar autenticada" on storage.objects;
create policy "proveedores actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'proveedores');

drop policy if exists "proveedores borrar autenticada" on storage.objects;
create policy "proveedores borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'proveedores');

-- ============================================================
-- FIN de la migración 0029
-- ============================================================

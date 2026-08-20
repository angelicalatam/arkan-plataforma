-- ============================================================
-- ARKAN · Migración 0007 — ARCHIVOS DE CLIENTE
-- Fotografías, vídeos y planos por cliente + su almacenamiento.
-- ============================================================

create table if not exists public.customer_files (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  category    text not null default 'foto',   -- foto | video | plano | otro
  name        text,
  url         text not null,
  path        text not null,                   -- ruta en Storage (para poder borrarlo)
  mime_type   text,
  size        bigint,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_customer_files_customer
  on public.customer_files (customer_id, category);

alter table public.customer_files enable row level security;
drop policy if exists customer_files_all on public.customer_files;
create policy customer_files_all on public.customer_files
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Almacenamiento de archivos de cliente (bucket público 'clientes')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('clientes', 'clientes', true)
on conflict (id) do nothing;

drop policy if exists "clientes lectura publica" on storage.objects;
create policy "clientes lectura publica" on storage.objects
  for select using (bucket_id = 'clientes');

drop policy if exists "clientes subida autenticada" on storage.objects;
create policy "clientes subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'clientes');

drop policy if exists "clientes actualizar autenticada" on storage.objects;
create policy "clientes actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'clientes');

drop policy if exists "clientes borrar autenticada" on storage.objects;
create policy "clientes borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'clientes');

-- ============================================================
-- FIN de la migración 0007
-- ============================================================

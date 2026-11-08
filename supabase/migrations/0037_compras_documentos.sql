-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0037 — Documentos de la compra (orden de compra y comprobante de pago)
--
-- Permite adjuntar a cada compra uno o varios archivos de dos tipos:
--   kind = 'orden_compra'     → la orden / pedido
--   kind = 'comprobante_pago' → el justificante de pago
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.purchase_files (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  kind        text not null default 'orden_compra',  -- orden_compra | comprobante_pago
  title       text,
  name        text,
  url         text not null,
  path        text not null,
  mime_type   text,
  size        bigint,
  created_at  timestamptz not null default now()
);

create index if not exists idx_purchase_files_purchase on public.purchase_files (purchase_id);

alter table public.purchase_files enable row level security;
drop policy if exists purchase_files_all on public.purchase_files;
create policy purchase_files_all on public.purchase_files
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Almacenamiento (bucket público 'compras')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('compras', 'compras', true)
on conflict (id) do nothing;

drop policy if exists "compras lectura publica" on storage.objects;
create policy "compras lectura publica" on storage.objects
  for select using (bucket_id = 'compras');

drop policy if exists "compras subida autenticada" on storage.objects;
create policy "compras subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'compras');

drop policy if exists "compras actualizar autenticada" on storage.objects;
create policy "compras actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'compras');

drop policy if exists "compras borrar autenticada" on storage.objects;
create policy "compras borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'compras');

-- ============================================================
-- FIN de la migración 0037
-- ============================================================

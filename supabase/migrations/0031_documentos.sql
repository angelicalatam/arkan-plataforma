-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0031 — Biblioteca documental (Fase 9)
--
-- Documentos clasificados por categoría y, opcionalmente, vinculados a
-- una obra (contratos, planos, licencias, seguros, certificados, etc.).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  category    text not null default 'otro',   -- contrato|plano|foto|factura|albaran|licencia|certificado|seguro|otro
  project_id  uuid references public.projects (id) on delete set null,
  name        text,
  url         text not null,
  path        text not null,
  mime_type   text,
  size        bigint,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_documents_project on public.documents (project_id);
create index if not exists idx_documents_category on public.documents (category);

alter table public.documents enable row level security;
drop policy if exists documents_all on public.documents;
create policy documents_all on public.documents
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Almacenamiento (bucket público 'documentos')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;

drop policy if exists "documentos lectura publica" on storage.objects;
create policy "documentos lectura publica" on storage.objects
  for select using (bucket_id = 'documentos');

drop policy if exists "documentos subida autenticada" on storage.objects;
create policy "documentos subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos');

drop policy if exists "documentos actualizar autenticada" on storage.objects;
create policy "documentos actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'documentos');

drop policy if exists "documentos borrar autenticada" on storage.objects;
create policy "documentos borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'documentos');

-- ============================================================
-- FIN de la migración 0031
-- ============================================================

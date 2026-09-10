-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0018 — Peticiones de oferta a proveedores
--
-- Petición de oferta = solicitud a un proveedor (con planos y otros
-- adjuntos) que se envía por correo, con fecha de seguimiento, y donde
-- luego se adjunta la oferta recibida.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Peticiones de oferta
-- ------------------------------------------------------------
create table if not exists public.rfqs (
  id             uuid primary key default gen_random_uuid(),
  code           text,                                   -- PET-AAAA-NNN
  supplier_id    uuid not null references public.suppliers (id) on delete cascade,
  project_id     uuid references public.projects (id) on delete set null,
  subject        text not null,
  message        text,
  status         text not null default 'borrador',        -- borrador|enviada|recibida|cerrada|cancelada
  sent_at        timestamptz,
  follow_up_date date,                                    -- fecha de recordatorio de seguimiento
  response_at    date,                                    -- cuándo llegó la oferta
  notes          text,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_rfqs_supplier on public.rfqs (supplier_id);
create index if not exists idx_rfqs_status on public.rfqs (status);
create index if not exists idx_rfqs_follow_up on public.rfqs (follow_up_date);

drop trigger if exists trg_rfqs_updated_at on public.rfqs;
create trigger trg_rfqs_updated_at
  before update on public.rfqs
  for each row execute function public.set_updated_at();

alter table public.rfqs enable row level security;
drop policy if exists rfqs_all on public.rfqs;
create policy rfqs_all on public.rfqs
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Archivos de la petición (planos, petición, oferta recibida…)
-- ------------------------------------------------------------
create table if not exists public.rfq_files (
  id         uuid primary key default gen_random_uuid(),
  rfq_id     uuid not null references public.rfqs (id) on delete cascade,
  kind       text not null default 'otro',               -- peticion|plano|oferta|otro
  name       text not null,
  url        text not null,
  path       text not null,
  mime_type  text,
  size       bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_rfq_files_rfq on public.rfq_files (rfq_id);

alter table public.rfq_files enable row level security;
drop policy if exists rfq_files_all on public.rfq_files;
create policy rfq_files_all on public.rfq_files
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Almacenamiento de archivos (bucket público 'peticiones')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('peticiones', 'peticiones', true)
on conflict (id) do nothing;

drop policy if exists "peticiones lectura publica" on storage.objects;
create policy "peticiones lectura publica" on storage.objects
  for select using (bucket_id = 'peticiones');

drop policy if exists "peticiones subida autenticada" on storage.objects;
create policy "peticiones subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'peticiones');

drop policy if exists "peticiones actualizar autenticada" on storage.objects;
create policy "peticiones actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'peticiones');

drop policy if exists "peticiones borrar autenticada" on storage.objects;
create policy "peticiones borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'peticiones');

-- ============================================================
-- FIN de la migración 0018
-- ============================================================

-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0030 — Incidencias (Fase 9 · Operaciones)
--
-- Registro y seguimiento de incidencias de obra, con gravedad, estado,
-- responsable, acción correctiva y fotos.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Incidencias
-- ------------------------------------------------------------
create table if not exists public.incidents (
  id              uuid primary key default gen_random_uuid(),
  code            text,                                   -- INC-AAAA-NNN
  title           text not null,
  description     text,
  project_id      uuid references public.projects (id) on delete set null,
  supplier_id     uuid references public.suppliers (id) on delete set null,
  assignee_id     uuid references public.employees (id) on delete set null,
  severity        text not null default 'media',          -- baja|media|alta|critica
  status          text not null default 'abierta',        -- abierta|en_proceso|resuelta|cerrada
  incident_date   date default current_date,
  corrective_action text,                                 -- acción correctiva / resolución
  resolved_at     date,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_incidents_project on public.incidents (project_id);
create index if not exists idx_incidents_status on public.incidents (status);

drop trigger if exists trg_incidents_updated_at on public.incidents;
create trigger trg_incidents_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();

alter table public.incidents enable row level security;
drop policy if exists incidents_all on public.incidents;
create policy incidents_all on public.incidents
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Fotos / archivos de la incidencia
-- ------------------------------------------------------------
create table if not exists public.incident_photos (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  name        text,
  url         text not null,
  path        text not null,
  mime_type   text,
  size        bigint,
  created_at  timestamptz not null default now()
);

create index if not exists idx_incident_photos_incident on public.incident_photos (incident_id);

alter table public.incident_photos enable row level security;
drop policy if exists incident_photos_all on public.incident_photos;
create policy incident_photos_all on public.incident_photos
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 3. Almacenamiento (bucket público 'incidencias')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('incidencias', 'incidencias', true)
on conflict (id) do nothing;

drop policy if exists "incidencias lectura publica" on storage.objects;
create policy "incidencias lectura publica" on storage.objects
  for select using (bucket_id = 'incidencias');

drop policy if exists "incidencias subida autenticada" on storage.objects;
create policy "incidencias subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'incidencias');

drop policy if exists "incidencias actualizar autenticada" on storage.objects;
create policy "incidencias actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'incidencias');

drop policy if exists "incidencias borrar autenticada" on storage.objects;
create policy "incidencias borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'incidencias');

-- ============================================================
-- FIN de la migración 0030
-- ============================================================

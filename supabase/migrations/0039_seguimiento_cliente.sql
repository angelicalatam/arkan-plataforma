-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0039 — Seguimiento con el cliente en la obra
--
-- Notas rápidas de seguimiento (texto + fecha) con el cliente de la obra,
-- dentro de la sección "Conversaciones / Seguimiento".
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.project_client_notes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  content     text not null,
  note_date   date not null default current_date,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_project_client_notes_project on public.project_client_notes (project_id);

alter table public.project_client_notes enable row level security;
drop policy if exists project_client_notes_all on public.project_client_notes;
create policy project_client_notes_all on public.project_client_notes
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0039
-- ============================================================

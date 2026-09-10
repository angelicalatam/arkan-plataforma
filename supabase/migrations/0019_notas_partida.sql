-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0019 — Notas internas y recordatorios por partida de obra
--
-- Cada partida de una obra puede tener varias notas internas, y cada
-- nota puede llevar una fecha de recordatorio (remind_on) para que
-- aparezca en las alertas del panel principal.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.project_item_notes (
  id              uuid primary key default gen_random_uuid(),
  project_item_id uuid not null references public.project_items (id) on delete cascade,
  project_id      uuid not null references public.projects (id) on delete cascade,
  content         text not null,
  remind_on       date,                                   -- fecha de recordatorio (opcional)
  done            boolean not null default false,         -- recordatorio atendido
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_item_notes_item on public.project_item_notes (project_item_id);
create index if not exists idx_item_notes_project on public.project_item_notes (project_id);
create index if not exists idx_item_notes_remind on public.project_item_notes (remind_on);

drop trigger if exists trg_item_notes_updated_at on public.project_item_notes;
create trigger trg_item_notes_updated_at
  before update on public.project_item_notes
  for each row execute function public.set_updated_at();

alter table public.project_item_notes enable row level security;
drop policy if exists project_item_notes_all on public.project_item_notes;
create policy project_item_notes_all on public.project_item_notes
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0019
-- ============================================================

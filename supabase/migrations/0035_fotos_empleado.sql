-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0035 — Varias fotos por empleado (galería)
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.employee_photos (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  name        text,
  url         text not null,
  path        text not null,
  mime_type   text,
  size        bigint,
  created_at  timestamptz not null default now()
);

create index if not exists idx_employee_photos_employee on public.employee_photos (employee_id);

alter table public.employee_photos enable row level security;
drop policy if exists employee_photos_all on public.employee_photos;
create policy employee_photos_all on public.employee_photos
  for all to authenticated using (true) with check (true);

-- (El almacén 'empleados' ya se creó en la migración 0034.)

-- ============================================================
-- FIN de la migración 0035
-- ============================================================

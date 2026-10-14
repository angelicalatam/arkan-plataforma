-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0034 — Personal: foto, seguridad social, tallas y tarjeta de salud
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.employees
  add column if not exists photo_url       text,   -- foto del empleado
  add column if not exists health_card_url text,   -- foto de la tarjeta de salud
  add column if not exists social_security text,    -- nº de seguridad social
  add column if not exists shirt_size      text,    -- talla de camisa
  add column if not exists pants_size      text;    -- talla de pantalón

-- ------------------------------------------------------------
-- Almacenamiento de fotos del personal (bucket público 'empleados')
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('empleados', 'empleados', true)
on conflict (id) do nothing;

drop policy if exists "empleados lectura publica" on storage.objects;
create policy "empleados lectura publica" on storage.objects
  for select using (bucket_id = 'empleados');

drop policy if exists "empleados subida autenticada" on storage.objects;
create policy "empleados subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'empleados');

drop policy if exists "empleados actualizar autenticada" on storage.objects;
create policy "empleados actualizar autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'empleados');

drop policy if exists "empleados borrar autenticada" on storage.objects;
create policy "empleados borrar autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'empleados');

-- ============================================================
-- FIN de la migración 0034
-- ============================================================

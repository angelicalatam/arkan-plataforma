-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0036 — Tipo de foto del empleado (empleado / tarjeta de salud)
--
-- Permite subir varias fotos también de la tarjeta de salud.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.employee_photos
  add column if not exists kind text not null default 'foto';   -- foto | tarjeta_salud

-- ============================================================
-- FIN de la migración 0036
-- ============================================================

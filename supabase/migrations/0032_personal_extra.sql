-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0032 — Personal: teléfono de emergencia
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.employees
  add column if not exists emergency_phone text;   -- teléfono de contacto de emergencia

-- (El campo "notes" ya existe en employees; solo se vuelve a mostrar en el formulario.)

-- ============================================================
-- FIN de la migración 0032
-- ============================================================

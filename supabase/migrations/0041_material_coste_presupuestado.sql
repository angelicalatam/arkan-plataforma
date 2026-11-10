-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0041 — Coste presupuestado del material (desde el Excel)
--
-- Guarda en cada material necesario el coste de materiales del PRODUCTO
-- del Excel (columna "Precio coste materiales" × cantidad), para poder
-- compararlo con lo realmente comprado dentro de "Materiales necesarios".
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.material_requests
  add column if not exists budget_cost numeric(14,4) not null default 0;

-- ============================================================
-- FIN de la migración 0041
-- ============================================================

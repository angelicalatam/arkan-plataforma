-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0042 — Coste real de mano de obra y materiales por partida
--
-- Para la nueva sección "Mano de obra" de la obra: guarda, por partida,
-- el coste REAL de mano de obra y de materiales que la usuaria escribe
-- a mano, para compararlo con lo presupuestado (del Excel).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.project_items
  add column if not exists real_labor     numeric(14,4) not null default 0,
  add column if not exists real_materials numeric(14,4) not null default 0;

-- ============================================================
-- FIN de la migración 0042
-- ============================================================

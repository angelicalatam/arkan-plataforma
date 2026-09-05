-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0016 — Cronograma de obra (fechas por partida)
--
-- Añade a cada partida de obra una fecha de inicio y fin previstas,
-- para dibujar el cronograma (planning) de la obra. Si están vacías,
-- la plataforma las reparte automáticamente entre el inicio y el fin
-- de la obra.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.project_items
  add column if not exists planned_start date,
  add column if not exists planned_end   date;

-- ============================================================
-- FIN de la migración 0016
-- ============================================================

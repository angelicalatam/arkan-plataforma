-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0028 — Presupuestos en PDF por cliente (con nombre de versión)
--
-- Reutiliza la tabla customer_files (categoría 'presupuesto') y añade un
-- campo 'title' para nombrar cada archivo (Versión 1, Versión 2…).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.customer_files
  add column if not exists title text;

-- ============================================================
-- FIN de la migración 0028
-- ============================================================

-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0025 — Enlace al producto del proveedor
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.materials
  add column if not exists product_url text;   -- enlace a la página del producto del proveedor

-- ============================================================
-- FIN de la migración 0025
-- ============================================================

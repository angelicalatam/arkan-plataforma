-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0040 — Coste de producto por partida (para comparar con la compra)
--
-- Guarda, aparte del coste de materiales total, SOLO el coste de los
-- productos de la partida (azulejo, mampara, sanitario…), para poder
-- comparar el producto presupuestado contra el realmente comprado.
-- No cambia los totales (cost_materials sigue incluyendo el producto).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.project_items
  add column if not exists cost_products numeric(14,4) not null default 0;

-- ============================================================
-- FIN de la migración 0040
-- ============================================================

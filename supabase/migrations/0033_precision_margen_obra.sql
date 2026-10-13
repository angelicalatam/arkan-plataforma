-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0033 — Precisión del margen en partidas de obra
--
-- Amplía los decimales del margen de las partidas de obra para que, al
-- importar una obra desde Excel, los importes cuadren al céntimo
-- (igual que se hizo en presupuestos con la 0014).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.project_items
  alter column margin_pct type numeric(10,4);

-- ============================================================
-- FIN de la migración 0033
-- ============================================================

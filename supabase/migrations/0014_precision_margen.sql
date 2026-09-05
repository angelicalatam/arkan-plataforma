-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0014 — Precisión del margen (para importar Excel)
--
-- Amplía los decimales del margen de las partidas para que, al
-- importar un presupuesto desde Excel, los importes cuadren al
-- céntimo (antes solo se guardaban 2 decimales del margen).
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.quote_items
  alter column margin_pct type numeric(10,4);

-- ============================================================
-- FIN de la migración 0014
-- ============================================================

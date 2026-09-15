-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0023 — Presentación del material (cómo se compra)
--
-- Desglose de empaquetado: unidad de compra + precio, y opcionalmente
-- el formato (ej. 1 palet = 23 m² = 575 panots). La plataforma calcula
-- el precio del palet y de cada pieza a partir del precio por unidad.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.materials
  add column if not exists pack_unit       text,           -- nombre del formato (ej. palet, caja)
  add column if not exists pack_quantity   numeric(12,3),   -- unidades de compra por formato (ej. 23 m²)
  add column if not exists pieces_per_pack numeric(12,3),   -- piezas por formato (ej. 575)
  add column if not exists piece_unit      text;            -- nombre de la pieza (ej. panot)

-- ============================================================
-- FIN de la migración 0023
-- ============================================================

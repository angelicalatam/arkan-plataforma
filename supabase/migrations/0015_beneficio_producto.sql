-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0015 — Coste y % de beneficio en las opciones de producto
--
-- Añade a cada opción de producto (las que se ofrecen al cliente
-- dentro de una partida) un coste y un porcentaje de beneficio, para
-- poder calcular el precio de venta como coste + beneficio.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.quote_item_products
  add column if not exists cost       numeric(12,2) not null default 0,
  add column if not exists margin_pct numeric(10,4) not null default 0;

-- ============================================================
-- FIN de la migración 0015
-- ============================================================

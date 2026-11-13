-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0043 — Estado por línea de la orden de compra
--
-- Añade a cada producto/línea de una orden de compra un estado de
-- seguimiento para saber en qué punto está:
--   pendiente  → Pendiente por pedir
--   comprado   → Comprado / pedido
--   transito   → En tránsito
--   llegado    → Llegado / recibido
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.purchase_order_items
  add column if not exists status text not null default 'pendiente';

-- ============================================================
-- FIN de la migración 0043
-- ============================================================

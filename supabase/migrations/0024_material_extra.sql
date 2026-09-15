-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0024 — Foto, IVA y descripción del material
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.materials
  add column if not exists image_url   text,
  add column if not exists tax_rate    numeric(5,2) not null default 21,
  add column if not exists description text;

-- ============================================================
-- FIN de la migración 0024
-- ============================================================

-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0027 — Varios documentos por tipo, con título/concepto
--
-- Permite subir varias facturas (y varios pagos, pedidos, albaranes)
-- en una operación, cada documento con un título que indica el concepto
-- (ej. "Pago inicial 12%", "Pago de saldo").
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- Título/concepto del documento.
alter table public.operation_documents
  add column if not exists title text;

-- Quitar el límite de "un documento por tipo" para permitir varios.
drop index if exists uq_operation_doc_type;

-- ============================================================
-- FIN de la migración 0027
-- ============================================================

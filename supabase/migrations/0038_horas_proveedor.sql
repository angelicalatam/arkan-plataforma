-- ============================================================
-- ARKAN · Plataforma de gestión integral
-- Migración 0038 — Horas realizadas por un proveedor (outsourcing)
--
-- Permite que un registro de "Mano de obra / Horas" sea de un
-- trabajador (employee_id) O de un proveedor de servicios (supplier_id)
-- que realiza una partida en régimen de subcontratación.
--
-- Cómo aplicarlo:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.time_entries
  add column if not exists supplier_id uuid references public.suppliers (id) on delete set null;

create index if not exists idx_time_entries_supplier on public.time_entries (supplier_id);

-- ============================================================
-- FIN de la migración 0038
-- ============================================================

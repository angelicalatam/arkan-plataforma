-- ============================================================
-- ARKAN · Migración 0009 — CONVERSACIONES CON PROVEEDORES + NOTAS
-- Proveedor → Conversación (opcionalmente ligada a una obra) → Notas.
-- Requiere que existan suppliers (0002) y projects (0008).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Conversaciones con proveedor
-- ------------------------------------------------------------
create table if not exists public.supplier_conversations (
  id               uuid primary key default gen_random_uuid(),
  supplier_id      uuid not null references public.suppliers (id) on delete cascade,
  project_id       uuid references public.projects (id) on delete set null,
  subject          text not null,
  status           text not null default 'abierta',   -- abierta | cerrada
  last_activity_at timestamptz not null default now(),
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_conv_supplier on public.supplier_conversations (supplier_id);
create index if not exists idx_conv_project on public.supplier_conversations (project_id);
create index if not exists idx_conv_last_activity on public.supplier_conversations (last_activity_at desc);

drop trigger if exists trg_conv_updated_at on public.supplier_conversations;
create trigger trg_conv_updated_at
  before update on public.supplier_conversations
  for each row execute function public.set_updated_at();

alter table public.supplier_conversations enable row level security;
drop policy if exists supplier_conversations_all on public.supplier_conversations;
create policy supplier_conversations_all on public.supplier_conversations
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 2. Notas de la conversación (historial cronológico)
-- ------------------------------------------------------------
create table if not exists public.conversation_notes (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.supplier_conversations (id) on delete cascade,
  content         text not null,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Consulta principal: notas de una conversación, más recientes primero.
create index if not exists idx_notes_conversation on public.conversation_notes (conversation_id, created_at desc);

drop trigger if exists trg_notes_updated_at on public.conversation_notes;
create trigger trg_notes_updated_at
  before update on public.conversation_notes
  for each row execute function public.set_updated_at();

alter table public.conversation_notes enable row level security;
drop policy if exists conversation_notes_all on public.conversation_notes;
create policy conversation_notes_all on public.conversation_notes
  for all to authenticated using (true) with check (true);

-- ============================================================
-- FIN de la migración 0009
-- ============================================================

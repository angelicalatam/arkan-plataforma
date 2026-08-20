-- ============================================================
-- ARKAN · Migración 0006 — Conexión con Google (Calendar)
-- Guarda las credenciales de Google de cada usuario.
-- ============================================================

create table if not exists public.google_credentials (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  access_token  text,
  refresh_token text,
  scope         text,
  token_type    text,
  expiry_date   bigint,          -- milisegundos epoch de caducidad del access_token
  google_email  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_google_credentials_updated_at on public.google_credentials;
create trigger trg_google_credentials_updated_at
  before update on public.google_credentials
  for each row execute function public.set_updated_at();

alter table public.google_credentials enable row level security;

-- Cada usuario solo puede ver/gestionar SUS propias credenciales.
drop policy if exists google_credentials_own on public.google_credentials;
create policy google_credentials_own on public.google_credentials
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- FIN de la migración 0006
-- ============================================================

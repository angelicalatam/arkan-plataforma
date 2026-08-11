/**
 * Comprueba si las claves de Supabase están configuradas en .env.local.
 * Mientras no lo estén, la plataforma se muestra en "modo vista previa"
 * (se ve el diseño, pero el login y los datos aún no están activos).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

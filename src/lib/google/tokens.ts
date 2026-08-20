import { createClient } from "@/lib/supabase/server";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./config";

/**
 * Devuelve un access_token válido de Google para el usuario actual,
 * refrescándolo automáticamente si ha caducado. null si no está conectado.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: creds } = await supabase
    .from("google_credentials")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creds) return null;

  // Token aún válido (con 1 minuto de margen).
  if (creds.access_token && creds.expiry_date && creds.expiry_date - Date.now() > 60_000) {
    return creds.access_token as string;
  }

  // Refrescar con el refresh_token.
  if (!creds.refresh_token) return null;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: creds.refresh_token as string,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) return null;
  const tok = (await resp.json()) as { access_token: string; expires_in?: number };
  const expiry = Date.now() + (tok.expires_in ?? 3600) * 1000;
  await supabase
    .from("google_credentials")
    .update({ access_token: tok.access_token, expiry_date: expiry })
    .eq("user_id", user.id);
  return tok.access_token;
}

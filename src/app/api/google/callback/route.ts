import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  googleRedirectUri,
} from "@/lib/google/config";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const err = request.nextUrl.searchParams.get("error");
  if (err || !code) {
    return NextResponse.redirect(new URL("/configuracion?google=error", origin));
  }

  // Intercambiar el código por los tokens.
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!resp.ok) {
    return NextResponse.redirect(new URL("/configuracion?google=error", origin));
  }
  const tok = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  // Obtener el email de la cuenta de Google conectada.
  let googleEmail: string | null = null;
  try {
    const u = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (u.ok) googleEmail = ((await u.json()) as { email?: string }).email ?? null;
  } catch {
    // ignorar: el email es solo informativo
  }

  // Guardar las credenciales para el usuario actual.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  await supabase.from("google_credentials").upsert({
    user_id: user.id,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? null,
    scope: tok.scope ?? null,
    token_type: tok.token_type ?? null,
    expiry_date: Date.now() + (tok.expires_in ?? 3600) * 1000,
    google_email: googleEmail,
  });

  return NextResponse.redirect(new URL("/configuracion?google=ok", origin));
}

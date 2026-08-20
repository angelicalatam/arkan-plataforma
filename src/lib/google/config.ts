/** Configuración de la conexión con Google (Calendar). */

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

export const isGoogleConfigured =
  GOOGLE_CLIENT_ID.length > 0 && GOOGLE_CLIENT_SECRET.length > 0;

/** Permisos que pedimos: email del usuario + gestión de eventos de calendario. */
export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

/** URL de retorno tras autorizar (debe coincidir con la de Google Cloud). */
export function googleRedirectUri(origin: string): string {
  return `${origin}/api/google/callback`;
}

/**
 * Configuración del envío de correos por Gmail (contraseña de aplicación).
 * Los valores se ponen en .env.local:
 *   GMAIL_USER=angelica@arkanreformas.es
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 */
export const GMAIL_USER = process.env.GMAIL_USER ?? "";
export const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");

export const isEmailConfigured =
  GMAIL_USER.length > 0 && GMAIL_APP_PASSWORD.length > 0;

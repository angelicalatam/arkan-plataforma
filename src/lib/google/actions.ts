"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "./tokens";
import { insertCalendarEvent } from "./calendar";

/** Estado de la conexión con Google del usuario actual. */
export async function getGoogleStatus(): Promise<{ connected: boolean; email: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { connected: false, email: null };
  const { data } = await supabase
    .from("google_credentials")
    .select("google_email, refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();
  return { connected: Boolean(data?.refresh_token), email: data?.google_email ?? null };
}

/** Desconecta la cuenta de Google del usuario actual. */
export async function disconnectGoogle(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from("google_credentials").delete().eq("user_id", user.id);
  revalidatePath("/configuracion");
  return { ok: true };
}

/** Crea el evento en Google Calendar y envía las invitaciones automáticamente. */
export async function scheduleViaGoogle(input: {
  summary: string;
  description?: string;
  location?: string;
  startISO: string;
  endISO: string;
  timeZone: string;
  attendees: string[];
}): Promise<
  { ok: true; htmlLink?: string } | { ok: false; error: string; needsConnect?: boolean }
> {
  const token = await getValidAccessToken();
  if (!token) {
    return { ok: false, error: "No hay conexión con Google.", needsConnect: true };
  }
  const res = await insertCalendarEvent(token, {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: { dateTime: input.startISO, timeZone: input.timeZone },
    end: { dateTime: input.endISO, timeZone: input.timeZone },
    attendees: input.attendees.filter(Boolean).map((email) => ({ email })),
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, htmlLink: res.htmlLink };
}

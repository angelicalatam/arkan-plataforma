/** Llamada a la API de Google Calendar para crear un evento con invitados. */

type CalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
};

export async function insertCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
): Promise<{ ok: true; htmlLink?: string } | { ok: false; error: string }> {
  const resp = await fetch(
    // sendUpdates=all → Google envía las invitaciones por correo a todos los invitados.
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );
  if (!resp.ok) {
    const text = await resp.text();
    return { ok: false, error: text.slice(0, 300) };
  }
  const data = (await resp.json()) as { htmlLink?: string };
  return { ok: true, htmlLink: data.htmlLink };
}

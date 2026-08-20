/** Utilidades para programar citas: enlace de Google Calendar y correo. */

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(
    d.getMinutes(),
  )}00`;
}

/** Enlace que abre Google Calendar con el evento prerrellenado. */
export function buildGoogleCalendarUrl(opts: {
  title: string;
  start: Date;
  durationMinutes: number;
  details?: string;
  location?: string;
  /** Correos de los invitados (cliente + equipo). Google les envía la invitación. */
  guests?: string[];
  /** Zona horaria (ej. "Europe/Madrid") para que la hora coincida exactamente. */
  timeZone?: string;
}): string {
  const end = new Date(opts.start.getTime() + opts.durationMinutes * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${stamp(opts.start)}/${stamp(end)}`,
    details: opts.details ?? "",
    location: opts.location ?? "",
  });
  if (opts.timeZone) params.set("ctz", opts.timeZone);
  const guests = (opts.guests ?? []).filter(Boolean);
  if (guests.length > 0) params.set("add", guests.join(","));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Enlace mailto que abre el correo con destinatario, asunto y cuerpo. */
export function buildMailto(opts: { to: string; subject: string; body: string }): string {
  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(
    opts.subject,
  )}&body=${encodeURIComponent(opts.body)}`;
}

/** Genera el contenido de un archivo .ics (invitación de calendario). */
export function buildIcs(opts: {
  title: string;
  start: Date;
  durationMinutes: number;
  details?: string;
  location?: string;
}): string {
  const end = new Date(opts.start.getTime() + opts.durationMinutes * 60000);
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ARKAN Reformas//Plataforma//ES",
    "BEGIN:VEVENT",
    `DTSTART:${stamp(opts.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.details ?? "")}`,
    `LOCATION:${esc(opts.location ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

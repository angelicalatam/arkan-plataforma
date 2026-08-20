"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  CalendarPlus,
  CalendarCheck,
  Download,
  Check,
  Mail,
  Users,
  Search,
  Plus,
  UserPlus,
} from "lucide-react";
import { addActivity, searchCustomerContacts } from "@/lib/crm/actions";
import { sendAppointmentEmail } from "@/lib/email/actions";
import type { TeamMember } from "@/lib/crm/queries";
import { scheduleViaGoogle } from "@/lib/google/actions";
import { buildGoogleCalendarUrl, buildMailto, buildIcs } from "@/lib/schedule";
import { inputClass } from "@/components/ui/Form";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  city: string | null;
};

const TIPOS = [
  { value: "visita", label: "Visita" },
  { value: "reunion", label: "Reunión" },
  { value: "cita", label: "Cita" },
] as const;

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`;
}

export function ScheduleModal({
  customer,
  teamMembers,
  googleConnected,
  emailConfigured,
  onClose,
}: {
  customer: Customer;
  teamMembers: TeamMember[];
  googleConnected: boolean;
  emailConfigured: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["value"]>("visita");
  const [when, setWhen] = useState(defaultStart());
  const [duration, setDuration] = useState(60);
  const [place, setPlace] = useState(
    [customer.address, customer.city].filter(Boolean).join(", "),
  );
  const [subject, setSubject] = useState("Programación de visita — ARKAN Reformas");
  const [message, setMessage] = useState("");
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<{ email: string; label: string }[]>([]);
  const [contactTerm, setContactTerm] = useState("");
  const [contactResults, setContactResults] = useState<
    { id: string; name: string; email: string | null }[]
  >([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    mode: "auto" | "email" | "manual";
    gcal: string;
    mailto: string;
    ics: string;
    htmlLink?: string;
    note?: string;
  }>(null);

  const tipoLabel = TIPOS.find((t) => t.value === tipo)!.label;

  function toggleInvite(email: string) {
    setInvited((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  // Correos ya presentes (para no duplicar).
  function alreadyInvited(email: string): boolean {
    const e = email.toLowerCase();
    return (
      (customer.email ?? "").toLowerCase() === e ||
      Array.from(invited).some((x) => x.toLowerCase() === e) ||
      extra.some((x) => x.email.toLowerCase() === e)
    );
  }

  function addExtra(email: string, label: string) {
    const clean = email.trim();
    if (!clean || alreadyInvited(clean)) return;
    setExtra((prev) => [...prev, { email: clean, label: label.trim() || clean }]);
  }

  function removeExtra(email: string) {
    setExtra((prev) => prev.filter((x) => x.email !== email));
  }

  async function runContactSearch(term: string) {
    setContactTerm(term);
    setContactLoading(true);
    setContactResults(await searchCustomerContacts(term));
    setContactLoading(false);
  }

  function addManualEmail() {
    const e = manualEmail.trim();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Ese correo no parece válido.");
      return;
    }
    addExtra(e, e);
    setManualEmail("");
    setError(null);
  }

  function prettyWhen(): string {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(when));
  }

  function defaultMessage(): string {
    return (
      `Hola ${customer.name},\n\n` +
      `Desde ARKAN Reformas queremos proponerte una ${tipoLabel.toLowerCase()} el ${prettyWhen()}` +
      (place ? ` en ${place}` : "") +
      `.\n\n¿Te viene bien esa fecha y hora? Quedamos atentos a tu confirmación.\n\n` +
      `Un saludo,\nARKAN Reformas`
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) {
      setError("Revisa la fecha y la hora.");
      return;
    }

    const body = message.trim() || defaultMessage();
    const title = `${tipoLabel} — ${customer.name} (ARKAN)`;
    const guests = [
      customer.email ?? "",
      ...Array.from(invited),
      ...extra.map((x) => x.email),
    ].filter(Boolean);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const end = new Date(start.getTime() + duration * 60000);
    const mailto = customer.email ? buildMailto({ to: customer.email, subject, body }) : "";
    const ics = buildIcs({ title, start, durationMinutes: duration, details: body, location: place });

    function saveActivity() {
      return addActivity({
        type: tipo,
        subject: `${tipoLabel}: ${subject}`,
        body: body + (guests.length ? `\n\nInvitados: ${guests.join(", ")}` : ""),
        customer_id: customer.id,
        due_date: start.toISOString(),
      });
    }

    // MODO AUTOMÁTICO: Google conectado → crea el evento y envía las invitaciones solo.
    if (googleConnected) {
      setLoading(true);
      const res = await scheduleViaGoogle({
        summary: title,
        description: body,
        location: place,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        timeZone,
        attendees: guests,
      });
      if (!res.ok) {
        setLoading(false);
        setError("No se pudo crear el evento en Google: " + res.error);
        return;
      }
      await saveActivity();
      setLoading(false);
      setDone({ mode: "auto", gcal: "", mailto, ics, htmlLink: res.htmlLink });
      router.refresh();
      return;
    }

    // MODO CORREO (Gmail): envía las invitaciones por correo automáticamente.
    if (emailConfigured) {
      setLoading(true);
      const saveRes = await saveActivity();
      const mailRes = await sendAppointmentEmail({
        to: guests,
        subject,
        message: body,
        title,
        startISO: start.toISOString(),
        durationMinutes: duration,
        location: place,
      });
      setLoading(false);
      if (!saveRes.ok) {
        setError(saveRes.error);
        return;
      }
      if (!mailRes.ok) {
        setError("No se pudieron enviar los correos: " + mailRes.error);
        return;
      }
      const gcalMe = buildGoogleCalendarUrl({
        title,
        start,
        durationMinutes: duration,
        details: body,
        location: place,
        timeZone,
      });
      setDone({
        mode: "email",
        gcal: gcalMe,
        mailto,
        ics,
        note: `Correo enviado a ${mailRes.sent} ${mailRes.sent === 1 ? "invitado" : "invitados"}.`,
      });
      router.refresh();
      return;
    }

    // MODO MANUAL (sin Google ni correo conectados): abre Google Calendar con los invitados.
    const gcal = buildGoogleCalendarUrl({
      title,
      start,
      durationMinutes: duration,
      details: body,
      location: place,
      guests,
      timeZone,
    });
    window.open(gcal, "_blank");
    setLoading(true);
    saveActivity().then((res) => {
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone({ mode: "manual", gcal, mailto, ics });
      router.refresh();
    });
  }

  function downloadIcs() {
    if (!done) return;
    const blob = new Blob([done.ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cita-${customer.name}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const invitedCount = (customer.email ? 1 : 0) + invited.size + extra.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <CalendarPlus className="h-5 w-5 text-brand-600" />
            Programar {tipoLabel.toLowerCase()}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!done ? (
          <form onSubmit={onSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    tipo === t.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 sm:col-span-1">
                <span className="mb-1 block text-sm font-medium text-ink-700">Fecha y hora</span>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className="mb-1 block text-sm font-medium text-ink-700">Duración (min)</span>
                <input
                  type="number"
                  step="15"
                  className={inputClass}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 60)}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Lugar</span>
              <input
                className={inputClass}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Dirección o lugar de la cita"
              />
            </label>

            {/* Invitados */}
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                <Users className="h-4 w-4 text-ink-400" />
                Invitados ({invitedCount})
              </span>
              <div className="space-y-1.5 rounded-lg border border-ink-200 p-2">
                <div className="flex items-center gap-2 rounded-md bg-ink-50 px-2 py-1.5 text-sm">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-medium text-ink-800">{customer.name}</span>
                  <span className="text-ink-400">
                    {customer.email || "(sin email — no recibirá invitación)"}
                  </span>
                  <span className="ml-auto text-xs text-ink-400">Cliente</span>
                </div>
                {teamMembers.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-ink-400">
                    No hay más personas registradas para invitar.
                  </p>
                ) : (
                  teamMembers.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ink-50"
                    >
                      <input
                        type="checkbox"
                        checked={invited.has(m.email!)}
                        onChange={() => toggleInvite(m.email!)}
                        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-ink-800">{m.full_name || m.email}</span>
                      <span className="text-ink-400">{m.email}</span>
                    </label>
                  ))
                )}
              </div>

              {/* Invitados añadidos (contactos o correos manuales) */}
              {extra.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {extra.map((g) => (
                    <span
                      key={g.email}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700 ring-1 ring-inset ring-brand-200"
                      title={g.email}
                    >
                      {g.label}
                      <button
                        type="button"
                        onClick={() => removeExtra(g.email)}
                        className="text-brand-400 hover:text-brand-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Añadir más invitados */}
              <div className="mt-2 rounded-lg border border-dashed border-ink-300 p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    value={contactTerm}
                    onChange={(e) => runContactSearch(e.target.value)}
                    onFocus={() => {
                      if (contactResults.length === 0) runContactSearch("");
                    }}
                    placeholder="Buscar en tus contactos para invitar…"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                {(contactTerm !== "" || contactResults.length > 0) && (
                  <div className="mt-1 max-h-40 overflow-y-auto">
                    {contactLoading ? (
                      <p className="py-2 text-center text-xs text-ink-400">Buscando…</p>
                    ) : (() => {
                        const visibles = contactResults.filter(
                          (c) => !(c.email && alreadyInvited(c.email)),
                        );
                        if (visibles.length === 0) {
                          return (
                            <p className="py-2 text-center text-xs text-ink-400">
                              No se encontraron contactos.
                            </p>
                          );
                        }
                        return (
                          <ul className="divide-y divide-ink-100">
                            {visibles.map((c) =>
                              c.email ? (
                                <li key={c.id}>
                                  <button
                                    type="button"
                                    onClick={() => addExtra(c.email!, c.name)}
                                    className="flex w-full items-center gap-2 px-1 py-1.5 text-left text-sm hover:bg-brand-50"
                                  >
                                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                                    <span className="text-ink-800">{c.name}</span>
                                    <span className="truncate text-ink-400">{c.email}</span>
                                  </button>
                                </li>
                              ) : (
                                <li
                                  key={c.id}
                                  className="flex items-center gap-2 px-1 py-1.5 text-sm text-ink-400"
                                  title="Este contacto no tiene email guardado"
                                >
                                  <UserPlus className="h-3.5 w-3.5 shrink-0" />
                                  <span>{c.name}</span>
                                  <span className="ml-auto text-xs italic">sin correo</span>
                                </li>
                              ),
                            )}
                          </ul>
                        );
                      })()}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addManualEmail();
                      }
                    }}
                    placeholder="…o escribe un correo y pulsa Añadir"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addManualEmail}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
                  >
                    <Plus className="h-4 w-4" /> Añadir
                  </button>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">
                Mensaje / descripción
              </span>
              <textarea
                rows={4}
                className={inputClass}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={defaultMessage()}
              />
              <span className="mt-1 block text-xs text-ink-400">
                Si lo dejas vacío, se usará un mensaje automático. Aparecerá en la invitación del
                calendario.
              </span>
            </label>

            <div className="rounded-lg bg-brand-50 p-2 text-xs text-brand-800">
              {googleConnected ? (
                <>
                  Al pulsar “Programar”, la plataforma creará el evento en tu Google Calendar y{" "}
                  <strong>enviará las invitaciones por correo automáticamente</strong> a todos los
                  invitados. ✨
                </>
              ) : emailConfigured ? (
                <>
                  Al pulsar “Programar”, la plataforma <strong>enviará el correo automáticamente</strong>{" "}
                  a todos los invitados, con la invitación de calendario incluida. ✨
                </>
              ) : (
                <>
                  Al pulsar “Programar”, se abrirá Google Calendar con el evento y{" "}
                  <strong>todos los invitados</strong> ya añadidos. Pulsa <strong>Guardar</strong> y
                  Google les enviará la invitación.
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Programar y enviar invitaciones
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 p-5">
            {done.mode === "auto" ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <Check className="h-5 w-5 shrink-0" />
                  ¡Listo! El evento se creó en tu Google Calendar y se enviaron las{" "}
                  <strong>invitaciones por correo</strong> a todos los invitados. La cita está en el
                  historial del cliente.
                </div>
                {done.htmlLink && (
                  <a
                    href={done.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                  >
                    <CalendarCheck className="h-4 w-4 text-brand-600" />
                    Ver el evento en Google Calendar
                  </a>
                )}
              </>
            ) : done.mode === "email" ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <Check className="h-5 w-5 shrink-0" />
                  ¡Correo enviado! {done.note} Recibirán la invitación en su correo. La cita ya está
                  en el historial del cliente.
                </div>
                <a
                  href={done.gcal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  <CalendarCheck className="h-4 w-4 text-brand-600" />
                  Añadir a mi Google Calendar
                </a>
                <button
                  onClick={downloadIcs}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
                >
                  <Download className="h-4 w-4" />
                  Descargar invitación (.ics)
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <Check className="h-5 w-5 shrink-0" />
                  Se abrió Google Calendar con el evento y los invitados. Pulsa{" "}
                  <strong>Guardar</strong> allí para enviar las invitaciones. La cita ya está en el
                  historial del cliente.
                </div>
                <a
                  href={done.gcal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  <CalendarCheck className="h-4 w-4 text-brand-600" />
                  ¿No se abrió? Abrir Google Calendar de nuevo
                </a>
                {done.mailto && (
                  <a
                    href={done.mailto}
                    className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
                  >
                    <Mail className="h-4 w-4" />
                    Enviar además un correo personalizado al cliente
                  </a>
                )}
                <button
                  onClick={downloadIcs}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
                >
                  <Download className="h-4 w-4" />
                  Descargar invitación (.ics)
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

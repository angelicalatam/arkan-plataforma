"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Link2Off, CheckCircle2, CalendarCheck } from "lucide-react";
import { disconnectGoogle } from "@/lib/google/actions";

export function GoogleConnectionCard({
  configured,
  connected,
  email,
}: {
  configured: boolean;
  connected: boolean;
  email: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDisconnect() {
    if (!window.confirm("¿Desconectar tu cuenta de Google?")) return;
    setLoading(true);
    await disconnectGoogle();
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-brand-600" />
        <h3 className="text-base font-semibold text-ink-900">Google Calendar</h3>
      </div>

      {!configured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Aún faltan las <strong>credenciales de Google</strong> en la plataforma
          (<code>GOOGLE_CLIENT_ID</code> y <code>GOOGLE_CLIENT_SECRET</code>). Sigue la guía de
          conexión y pégalas en el archivo <code>.env.local</code>; después reinicia el servidor.
        </div>
      ) : connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              Conectado{email ? ` como ${email}` : ""}. Al programar una cita, la plataforma creará
              el evento y enviará las invitaciones automáticamente. ✨
            </span>
          </div>
          <button
            onClick={onDisconnect}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
            Desconectar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink-600">
            Conecta tu cuenta de Google para que la plataforma envíe las invitaciones de cita por
            correo y cree los eventos en tu calendario automáticamente.
          </p>
          <a
            href="/api/google/authorize"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Link2 className="h-4 w-4" />
            Conectar Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}
